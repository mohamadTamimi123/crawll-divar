const puppeteer = require('puppeteer');
const { ScrapedAd } = require('../models');

// Function to get last 10 links from database for a specific city and ad type
async function getLast10LinksFromDatabase(city, adType) {
    try {
        const lastAds = await ScrapedAd.findAll({
            where: {
                '$city.name$': city,
                ad_type: adType
            },
            include: [{
                model: require('../models').City,
                as: 'city'
            }],
            order: [['created_at', 'DESC']],
            limit: 10
        });
        
        console.log(`📊 Found ${lastAds.length} previous ads in database for ${city} - ${adType}`);

        return lastAds.map(ad => ad.link);
    } catch (error) {
        console.error('❌ Error getting last 10 links from database:', error.message);
        return [];
    }
}

// Function to check if we've reached enough of the last 10 links
function hasReachedLastLinks(currentLinks, last10Links) {
    if (last10Links.length === 0) return false;
    
    // We need to see at least 3 links from the last 10 to be sure
    // This prevents stopping due to temporary position changes
    const minRequiredMatches = Math.min(3, last10Links.length);
    let matchesFound = 0;
    
    for (const currentLink of currentLinks) {
        if (last10Links.includes(currentLink)) {
            matchesFound++;
            // If we found enough matches, we can stop
            if (matchesFound >= minRequiredMatches) {
                return true;
            }
        }
    }
    
    return false;
}

// Function to count new ads (ads that weren't in the last 10)
function countNewAds(allLinks, last10Links) {
    if (last10Links.length === 0) return allLinks.length;
    
    let newCount = 0;
    for (const link of allLinks) {
        if (!last10Links.includes(link)) {
            newCount++;
        }
    }
    return newCount;
}

// Function to extract timestamp from Divar URL
function extractTimestampFromUrl(url) {
    try {
        // Divar URLs often contain timestamps or IDs that can indicate age
        // For now, we'll use a simple heuristic based on URL patterns
        const urlParts = url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        
        // If the last part looks like a timestamp or old ID, consider it old
        // This is a simplified approach - you might want to refine this logic
        if (lastPart && lastPart.length > 10) {
            // For now, we'll assume older-looking URLs are older
            // You can enhance this function based on your specific needs
            return new Date(Date.now() - (Math.random() * 24 * 60 * 60 * 1000)); // Placeholder
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

async function autoScrollUntilButton(page, timeout = 60000, scrollDelay = 1000, city, adType) {
    console.log('🔄 Starting auto-scroll with time-based stopping...');
    
    // Note: Database link checking removed - only time-based stopping remains
    console.log('⏰ Will stop when reaching ads older than 3 hours');
    console.log('🔍 Will crawl both regular and نردبان شده ads');
    console.log('✅ Ads from 2 hours ago will be crawled');
    
    const startTime = Date.now();
    const allLinks = new Set();
    const adTitles = new Map(); // Store link -> title mapping
    let consecutiveNoNewLinks = 0;
    const maxConsecutiveNoNewLinks = 3;
    
    while (Date.now() - startTime < timeout) {
        try {
            // Get current page links, titles, and publish times
            const currentAds = await page.evaluate(() => {
                const adElements = document.querySelectorAll('a[href*="/v/"]');
                return Array.from(adElements).map(el => {
                    // Try to find the publish time in the .kt-post-card__bottom span
                    let time = '';
                    const bottomDiv = el.querySelector('.kt-post-card__bottom');
                    if (bottomDiv) {
                        const timeSpan = bottomDiv.querySelector('span.kt-post-card__bottom-description');
                        if (timeSpan) {
                            time = timeSpan.innerText?.trim() || '';
                        }
                    }
                    return {
                        link: el.href,
                        title: el.querySelector('h2')?.innerText?.trim() ||
                               el.querySelector('.kt-post-card__title')?.innerText?.trim() ||
                               el.querySelector('.kt-post-card__body h2')?.innerText?.trim() ||
                               'بدون عنوان',
                        time
                    };
                });
            });
            // Add new ads to our set
            let newAdsThisScroll = 0;
            for (const ad of currentAds) {
                if (!allLinks.has(ad.link)) {
                    allLinks.add(ad.link);
                    // Store title with link
                    adTitles.set(ad.link, ad.title);
                    newAdsThisScroll++;
                }
            }
            
            // Note: Database link checking removed - only time-based stopping remains
            
            // Check if we've reached ads older than 3 hours based on time text
            const oldAdsFound = currentAds.filter(ad => {
                const timeText = ad.time;
                if (timeText) {
                    // Check for "3 ساعت پیش" or older (3+ hours)
                    if (timeText.includes('۳ ساعت پیش') || 
                        timeText.includes('4 ساعت پیش') ||
                        timeText.includes('5 ساعت پیش') ||
                        timeText.includes('6 ساعت پیش') ||
                        timeText.includes('1 روز پیش') ||
                        timeText.includes('2 روز پیش')) {
                        return true;
                    }
                }
                return false;
            });
            
            if (oldAdsFound.length > 0) {
                console.log(`⏰ Found ${oldAdsFound.length} ads older than 3 hours! Stopping crawl.`);
                console.log(`   Oldest ad found: ${oldAdsFound[0].title} (${oldAdsFound[0].time})`);
                break;
            }
            
            if (newAdsThisScroll > 0) {
                console.log(`✅ Found ${newAdsThisScroll} new ads (Total: ${allLinks.size})`);
                consecutiveNoNewLinks = 0;
            } else {
                consecutiveNoNewLinks++;
                console.log(`⏳ No new ads found (${consecutiveNoNewLinks}/${maxConsecutiveNoNewLinks})`);
            }
            
            // Stop if no new links for several consecutive scrolls
            if (consecutiveNoNewLinks >= maxConsecutiveNoNewLinks) {
                console.log('🛑 No new links found for several scrolls. Stopping crawl.');
                break;
            }
            
            // Scroll down
            await page.evaluate(() => {
                window.scrollBy(0, window.innerHeight);
            });
            
            await new Promise(resolve => setTimeout(resolve, scrollDelay));
            
        } catch (error) {
            console.error('❌ Error during auto-scroll:', error.message);
            break;
        }
    }
    
    const totalLinks = Array.from(allLinks);
    const newAdsCount = countNewAds(totalLinks, last10Links);
    
    // Convert links to ads with titles
    const ads = totalLinks.map(link => ({
        title: adTitles.get(link) || 'بدون عنوان',
        link: link
    }));
    
    console.log('\n📊 Crawling Summary:');
    console.log(`   Total ads found: ${ads.length}`);
    console.log(`   New ads: ${newAdsCount}`);
    console.log(`   Existing ads: ${ads.length - newAdsCount}`);
    
    // Note: Database link checking removed - only time-based stopping remains
    
    return ads;
}

async function extractAdDetails(page, link, city, adType) {
    try {
        console.log(`🔍 Extracting details for: ${link.substring(0, 50)}...`);
        
        // Navigate to the ad page
        await page.goto(link, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Extract ad details
        const details = await page.evaluate(() => {
            const extractText = (selector) => {
                const element = document.querySelector(selector);
                return element ? element.textContent.trim() : null;
            };
            
            const extractBoolean = (selector) => {
                const element = document.querySelector(selector);
                return element !== null;
            };
            
            const extractArray = (selector) => {
                const elements = document.querySelectorAll(selector);
                return Array.from(elements).map(el => el.src || el.href).filter(Boolean);
            };
            
            return {
                metraj: extractText('[data-testid="metraj"]') || extractText('.metraj'),
                sal_sakht: extractText('[data-testid="sal_sakht"]') || extractText('.sal-sakht'),
                otagh: extractText('[data-testid="otagh"]') || extractText('.otagh'),
                tabaghe: extractText('[data-testid="tabaghe"]') || extractText('.tabaghe'),
                parking: extractBoolean('[data-testid="parking"]') || extractBoolean('.parking'),
                asansor: extractBoolean('[data-testid="asansor"]') || extractBoolean('.asansor'),
                anbari: extractBoolean('[data-testid="anbari"]') || extractBoolean('.anbari'),
                tozihat: extractText('[data-testid="tozihat"]') || extractText('.tozihat'),
                location: extractText('[data-testid="location"]') || extractText('.location'),
                image_links: extractArray('img[src*="divar"]'),
                vadie: extractText('[data-testid="vadie"]') || extractText('.vadie'),
                ejare: extractText('[data-testid="ejare"]') || extractText('.ejare'),
                gheymat_kol: extractText('[data-testid="gheymat_kol"]') || extractText('.gheymat-kol'),
                gheymat_har_metr: extractText('[data-testid="gheymat_har_metr"]') || extractText('.gheymat-har-metr'),
                ghabele_tabdil: extractText('[data-testid="ghabele_tabdil"]') || extractText('.ghabele-tabdil')
            };
        });
        
        console.log(`✅ Details extracted successfully`);
        return details;
        
    } catch (error) {
        console.error(`❌ Error extracting details for ${link}:`, error.message);
        return null;
    }
}

async function handleCityChangePrompt(page, multiCityButtonSelector) {
    try {
        const multiCityButton = await page.$(multiCityButtonSelector);
        if (multiCityButton) {
            console.log('🏙️ City change prompt detected, clicking multi-city button...');
            await multiCityButton.click();
            await page.waitForTimeout(2000);
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Error handling city change prompt:', error.message);
        return false;
    }
}

async function closeMapIfOpen(page, mapCloseButtonSelector) {
    try {
        const mapCloseButton = await page.$(mapCloseButtonSelector);
        if (mapCloseButton) {
            console.log('🗺️ Map detected, closing...');
            await mapCloseButton.click();
            await page.waitForTimeout(1000);
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Error closing map:', error.message);
        return false;
    }
}

module.exports = {
    autoScrollUntilButton,
    extractAdDetails,
    handleCityChangePrompt,
    closeMapIfOpen,
    getLast10LinksFromDatabase,
    hasReachedLastLinks,
    countNewAds
};
