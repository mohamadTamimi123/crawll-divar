const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { extractAllNumbers, parseTabaghe } = require('./persian_number_utils');

// Configuration
const CONFIG = {
    cities: [
        { name: 'tehran', displayName: 'تهران', slug: 'tehran' },
        { name: 'karaj', displayName: 'کرج', slug: 'karaj' }
    ],
    adTypes: [
        { name: 'rent', displayName: 'اجاره', slug: 'rent-apartment' }
    ],
    maxAdsPerType: 5,
    delayBetweenPages: 3000,
    delayBetweenAds: 2000,
    headless: false,
    incognito: true,
    executablePath: '/usr/bin/google-chrome',
    // When true, only listing pages are opened. We auto-scroll and count found ads without opening each ad page
    listingOnly: true,
    scrollTimeoutMs: 90000,
    // Test mode: only close the map on each listing and immediately move on
    mapCloseTestOnly: true
};

class DivarCrawler {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            sale: { tehran: [], karaj: [] },
            rent: { tehran: [], karaj: [] }
        };
    }

    async dismissChangeCityIfPrompted(page) {
        try {
            // Wait briefly for any prompt to appear
            await page.waitForTimeout(1000);
            const clicked = await page.evaluate(() => {
                const matchesText = (el, texts) => {
                    const t = (el.innerText || el.textContent || '').trim();
                    return texts.some(x => t.includes(x));
                };
                const candidates = Array.from(document.querySelectorAll('button, a'));
                // Common "No" variants on Divar for city change
                const noTexts = [
                    'نه',
                    'تغییر نمی‌دهم',
                    'تغییر نمیدهم',
                    'خیر'
                ];
                for (const el of candidates) {
                    if (matchesText(el, noTexts)) {
                        (el instanceof HTMLElement) && el.click();
                        return true;
                    }
                }
                return false;
            });
            if (clicked) {
                console.log('🛑 City change prompt detected -> selected "نه" (do not change)');
                await page.waitForTimeout(500);
            }
        } catch (_) {
            // Ignore
        }
    }

    async closeMapIfOpen(page) {
        try {
            for (let attempt = 0; attempt < 3; attempt++) {
                const clicked = await page.evaluate(() => {
                    const isVisible = (el) => {
                        const style = window.getComputedStyle(el);
                        const rect = el.getBoundingClientRect();
                        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
                    };
                    const btns = document.querySelectorAll('button.kt-fab-button.kt-fab-button--medium.kt-fab-button--extended.kt-fab-button--raised');
                    let any = false;
                    btns.forEach(btn => { if (isVisible(btn)) { (btn instanceof HTMLElement) && btn.click(); any = true; } });
                    return any;
                });
                if (clicked) {
                    await page.waitForTimeout(700);
                    return true;
                }
                await page.waitForTimeout(5000);
            }
            return false;
        } catch (_) {
            return false;
        }
    }

    async init() {
        console.log('🚀 Launching browser...');
        
        const args = [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-web-security',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=VizDisplayCompositor'
        ];

        // Add incognito mode if enabled
        if (CONFIG.incognito) {
            // args.push('--incognito');
            // console.log('🔒 Incognito mode enabled');
        }

        this.browser = await puppeteer.launch({
            headless: CONFIG.headless,
            executablePath: CONFIG.executablePath,
            args: args,
        });

        this.page = await this.browser.newPage();
        await this.page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        );


        await this.page.setViewport({ width: 1024, height: 800, isMobile: false });
        await this.page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        );
        
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async waitForElement(selector, timeout = 10000) {
        try {
            await this.page.waitForSelector(selector, { timeout });
            return true;
        } catch (error) {
            return false;
        }
    }

    async autoScrollUntilButton(page, timeout = CONFIG.scrollTimeoutMs, scrollDelay = 1000) {
        let allPostsMap = new Map();
        const distance = 500;
        const startTime = Date.now();

        console.log('🔄 Auto-scrolling to load all ads...');

        while (Date.now() - startTime < timeout) {
            await page.evaluate(distance => window.scrollBy(0, distance), distance);
            await new Promise(r => setTimeout(r, scrollDelay));

            const currentPosts = await page.evaluate(() => {
                const cards = document.querySelectorAll('div.kt-post-card__body');
                return Array.from(cards).map(card => ({
                    title: card.querySelector('h2')?.innerText?.trim() || '',
                    link: card.closest('a')?.href || '',
                })).filter(item => item.link && item.title);
            });

            for (const post of currentPosts) {
                if (post.link) allPostsMap.set(post.link, post);
            }

            // If not listing-only, stop early when we have enough posts
            if (!CONFIG.listingOnly) {
                if (allPostsMap.size >= CONFIG.maxAdsPerType) {
                    console.log(`✅ Found ${allPostsMap.size} ads, stopping scroll`);
                    break;
                }
            }

            // Check if we've reached the end
            const isEnd = await page.evaluate(() => {
                const endText = document.body.innerText;
                return endText.includes('آخرین آگهی') || endText.includes('پایان نتایج') || endText.includes('No more results');
            });

            if (isEnd) {
                console.log('🏁 Reached end of results');
                break;
            }

            // If load more button is visible, click it to fetch more
            const clickedLoadMore = await page.evaluate(() => {
                const btn = document.querySelector('button.kt-button.kt-button--primary.kt-button--outlined.post-list__load-more-btn-be092');
                if (!btn) return false;
                const style = window.getComputedStyle(btn);
                const rect = btn.getBoundingClientRect();
                const visible = style.display !== 'none' && style.visibility !== 'hidden' && rect.top >= 0 && rect.bottom <= window.innerHeight;
                if (visible) {
                    btn.click();
                    return true;
                }
                return false;
            });

            if (clickedLoadMore) {
                console.log('🔘 Clicked load more...');
                await new Promise(r => setTimeout(r, 1500));
            }

            // Log progress every 10 posts
            if (allPostsMap.size % 10 === 0 && allPostsMap.size > 0) {
                console.log(`📊 Found ${allPostsMap.size} ads so far...`);
            }
        }

        console.log(`📋 Total ads found after scrolling: ${allPostsMap.size}`);
        const arr = Array.from(allPostsMap.values());
        return CONFIG.listingOnly ? arr : arr.slice(0, CONFIG.maxAdsPerType);
    }

    async getAdLinks(city, adType) {
        try {
            const url = `https://divar.ir/s/${city}/${adType}?business-type=personal`;
            console.log(`🔍 Fetching links from: ${url}`);

            // More robust navigation: wait for network to be idle
            await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            await new Promise(r => setTimeout(r, CONFIG.delayBetweenPages));

            // First, explicitly handle the multi-city change alert button if present (hash-safe)
            for (let i = 0; i < 3; i++) {
                const clickedCityAlert = await this.page.evaluate(() => {
                    const isVisible = (el) => {
                        const style = window.getComputedStyle(el);
                        const rect = el.getBoundingClientRect();
                        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
                    };
                    const buttons = Array.from(document.querySelectorAll('button'))
                        .filter(b => (b.className || '').includes('kt-button')
                            && (b.className || '').includes('kt-button--primary')
                            && (b.className || '').includes('kt-button--outlined')
                            && (b.className || '').includes('multi-city-change-alert-actions-'));
                    let any = false;
                    for (const btn of buttons) {
                        if (isVisible(btn)) { (btn instanceof HTMLElement) && btn.click(); any = true; }
                    }
                    return any;
                });
                if (clickedCityAlert) {
                    console.log('🏙️ Multi-city change alert dismissed');
                    await this.page.waitForTimeout(800);
                    break;
                }
                await this.page.waitForTimeout(800);
            }

            // If city-change prompt appears, choose "No" (do not change)
            await this.dismissChangeCityIfPrompted(this.page);

            // Close map if exists (simple FAB click with retries)
            const mapClosed = await this.closeMapIfOpen(this.page);
            if (mapClosed) {
                console.log('🗺️ Map closed');
            } else {
                console.log('🗺️ Map already closed or not visible');
            }

            // If test-only mode, move on without scrolling/list extraction
            if (CONFIG.mapCloseTestOnly) {
                console.log('🧪 mapCloseTestOnly enabled: skipping scroll and moving to next');
                return [];
            }

            // Wait for ads to load (longer timeout)
            await this.waitForElement('div.kt-post-card__body', 30000);

            const links = await this.autoScrollUntilButton(this.page);
            console.log(`✅ ${links.length} links found`);
            return links;
        } catch (error) {
            console.error(`❌ Error fetching links for ${city} - ${adType}:`, error.message);
            return [];
        }
    }

    async extractAdDetails(link, city, adType) {
        try {
            // Create new page (incognito arguments already set at browser level)
            const detailPage = await this.browser.newPage();
            
            await detailPage.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            );

            await detailPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await new Promise(r => setTimeout(r, CONFIG.delayBetweenAds));

            const data = await detailPage.evaluate(async (citySlug, adTypeSlug) => {
                // Scroll to load all content
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    const distance = 300;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;
                        if (totalHeight >= scrollHeight) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 200);
                });

                const getRowValue = (label) => {
                    const rows = document.querySelectorAll('.kt-base-row');
                    for (const row of rows) {
                        const title = row.querySelector('.kt-base-row__title')?.innerText?.trim();
                        const value = row.querySelector('.kt-unexpandable-row__value')?.innerText?.trim();
                        if (title === label) return value;
                    }
                    return null;
                };

                const values = document.querySelectorAll('td.kt-group-row-item--info-row');
                const values2 = document.querySelectorAll('.kt-group-row-item.kt-group-row-item__value.kt-body.kt-body--stable');

                const descriptionEl = document.querySelector('.kt-description-row__text.kt-description-row__text--primary');
                const location = document.querySelector('.kt-page-title__subtitle.kt-page-title__subtitle--responsive-sized');

                const imageConfirmation = getRowValue('تصویر‌ها برای همین ملک است؟');
                let imageLinks = [];

                if (imageConfirmation === 'بله') {
                    const imageElements = document.querySelectorAll('.kt-image-block__image.kt-image-block__image--fading');
                    imageLinks = Array.from(imageElements).map(img => img.getAttribute('src')).filter(src => src);
                }

                const mapLocation = document.querySelector('.kt-show-map__link')?.getAttribute('href') || null;

                // Extract price information based on ad type
                let priceData = {};
                const convertTable = document.querySelector('.convert-slider table.kt-group-row');
                const ghabeleTabdil = !!convertTable;

                // Check if this is a rent ad
                const isRentAd = window.location.href.includes('rent') || 
                                window.location.href.includes('اجاره') || 
                                document.querySelector('h1')?.innerText?.includes('اجاره') ||
                                adTypeSlug === 'rent-apartment' ||
                                !!convertTable; // If convertTable exists, it's likely a rent ad

                if (isRentAd) {
                    // Rental ad - using mian4.js logic
                    let vadie = null;
                    let ejare = null;
                    
                    if (convertTable) {
                        const rows = convertTable.querySelectorAll('tbody tr td');
                        vadie = rows[0]?.innerText.trim() || null;
                        ejare = rows[1]?.innerText.trim() || null;
                    } else {
                        vadie = getRowValue('ودیعه');
                        ejare = getRowValue('اجارهٔ ماهانه');
                    }
                    
                    priceData = { 
                        vadie, 
                        ejare, 
                        ghabeleTabdil 
                    };
                } else {
                    // Sale ad
                    priceData = {
                        gheymatKol: getRowValue('قیمت کل'),
                        gheymatHarMetr: getRowValue('قیمت هر متر'),
                        ghabeleTabdil: false
                    };
                }

                return {
                    title: document.querySelector('h1')?.innerText || '',
                    metraj: values[0]?.innerText.trim() || null,
                    salSakht: values[1]?.innerText.trim() || null,
                    otagh: values[2]?.innerText.trim() || null,
                    tabaghe: getRowValue('طبقه'),
                    parking: values2[0]?.innerText.trim() || null,
                    asansor: values2[1]?.innerText.trim() || null,
                    anbari: values2[2]?.innerText.trim() || null,
                    tozihat: descriptionEl?.innerText?.trim() || null,
                    location: location?.innerText?.trim() || null,
                    imageLinks,
                    imageConfirmation,
                    mapLocation,
                    vadie: priceData.vadie || null,
                    ejare: priceData.ejare || null,
                    gheymatKol: priceData.gheymatKol || null,
                    gheymatHarMetr: priceData.gheymatHarMetr || null,
                    ghabeleTabdil: priceData.ghabeleTabdil || false,
                    url: window.location.href,
                    scrapedAt: new Date().toISOString(),
                    city: citySlug,
                    adType: adTypeSlug === 'buy-apartment' ? 'sale' : 'rent'
                };
            }, city, adType);

            await detailPage.close();
            
            // Extract numeric values using our Persian number extractor
            const enhancedData = extractAllNumbers(data);
            
            // Parse tabaghe to get current and total floors
            const tabagheParsed = parseTabaghe(enhancedData.tabaghe);
            enhancedData.tabagheCurrent = tabagheParsed.current;
            enhancedData.tabagheTotal = tabagheParsed.total;
            
            return enhancedData;
        } catch (error) {
            console.error(`❌ Error extracting ad details:`, error.message);
            return null;
        }
    }

    async crawlCity(city) {
        console.log(`\n🏙️ Starting crawl for ${CONFIG.cities.find(c => c.slug === city)?.displayName}...`);
        
        for (const adType of CONFIG.adTypes) {
            console.log(`\n📋 Processing ${adType.displayName}...`);
            
            const links = await this.getAdLinks(city, adType.slug);
            if (CONFIG.listingOnly) {
                this.results[adType.name][city] = links; // store only titles and links
                console.log(`\n✅ Listing-only mode: ${adType.displayName} for ${CONFIG.cities.find(c => c.slug === city)?.displayName}: ${links.length} links`);
            } else {
                const details = [];
                for (let i = 0; i < Math.min(links.length, CONFIG.maxAdsPerType); i++) {
                    const link = links[i];
                    console.log(`\n🔍 Processing ${i + 1}/${Math.min(links.length, CONFIG.maxAdsPerType)}: ${link.title}`);
                    const detail = await this.extractAdDetails(link.link, city, adType.slug);
                    if (detail) {
                        details.push(detail);
                        console.log(`✅ Successfully extracted: ${detail.title}`);
                    } else {
                        console.log(`❌ Failed to extract details from: ${link.title}`);
                    }
                    if (i < links.length - 1) {
                        await new Promise(r => setTimeout(r, CONFIG.delayBetweenAds));
                    }
                }
                this.results[adType.name][city] = details;
                console.log(`\n✅ Completed ${adType.displayName} for ${CONFIG.cities.find(c => c.slug === city)?.displayName}: ${details.length} ads`);
            }
        }
    }

    async crawl() {
        try {
            await this.init();
            
            for (const city of CONFIG.cities) {
                await this.crawlCity(city.slug);
            }
            
            await this.saveResults();

            // Print grand totals for visibility
            let grandTotal = 0;
            for (const adType of CONFIG.adTypes) {
                for (const city of CONFIG.cities) {
                    const arr = this.results[adType.name][city.slug] || [];
                    grandTotal += arr.length;
                    console.log(`📈 ${adType.displayName} - ${city.displayName}: ${arr.length}`);
                }
            }
            console.log(`\n🔢 Grand total ads found: ${grandTotal}`);
            console.log('\n🎉 Crawling completed successfully!');
            
        } catch (error) {
            console.error('❌ Error during crawling:', error);
        } finally {
            await this.close();
        }
    }

    async saveResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputDir = path.join(__dirname, 'output');
        
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Save individual files for each city and ad type
        for (const city of CONFIG.cities) {
            for (const adType of CONFIG.adTypes) {
                const data = this.results[adType.name][city.slug];
                if (data && data.length > 0) {
                    const filename = `${city.slug}_${adType.name}_${timestamp}.json`;
                    const filepath = path.join(outputDir, filename);
                    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
                    console.log(`💾 Saved ${data.length} ${adType.displayName} ads for ${city.displayName} to ${filename}`);
                }
            }
        }

        // Save combined results
        const combinedFilename = `divar_combined_${timestamp}.json`;
        const combinedFilepath = path.join(outputDir, combinedFilename);
        fs.writeFileSync(combinedFilepath, JSON.stringify(this.results, null, 2), 'utf-8');
        console.log(`💾 Saved combined results to ${combinedFilename}`);
    }
}

// Run the crawler
if (require.main === module) {
    const crawler = new DivarCrawler();
    crawler.crawl().catch(console.error);
}

module.exports = DivarCrawler; 