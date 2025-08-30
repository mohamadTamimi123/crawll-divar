const puppeteer = require('puppeteer');
const { City, ScrapedAd, AdDetail } = require('../models');

// Function to extract detailed information from a single ad
async function extractAdDetails(link, city, adType) {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.BROWSER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
        
        // Navigate to the ad page
        await page.goto(link, { 
            waitUntil: 'domcontentloaded', 
            timeout: parseInt(process.env.CRAWLER_TIMEOUT) || 60000 
        });
        
        // Wait for content to load
        await page.waitForTimeout(2000);
        
        // Extract detailed information
        const details = await page.evaluate(() => {
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
                            adType === 'rent-apartment' ||
                            !!convertTable;
            
            if (isRentAd) {
                // Rental ad
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
                
                priceData = { vadie, ejare, ghabeleTabdil };
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
                scrapedAt: new Date().toISOString()
            };
        });
        
        await browser.close();
        return details;
        
    } catch (error) {
        console.error(`❌ Error extracting details from ${link}:`, error.message);
        await browser.close();
        return null;
    }
}

// Function to update existing ads with detailed information
async function updateAdsWithDetails(ads, city, adType) {
    try {
        console.log(`🔍 Starting detailed extraction for ${ads.length} ads...`);
        
        // Get city from database
        const cityRecord = await City.findOne({ where: { name: city } });
        if (!cityRecord) {
            console.error(`❌ City not found: ${city}`);
            return;
        }
        
        let processedCount = 0;
        let detailsSavedCount = 0;
        let errorsCount = 0;
        
        for (const ad of ads) {
            try {
                console.log(`🔍 Processing details for: ${ad.title}`);
                
                // Check if ad exists in database
                const existingAd = await ScrapedAd.findOne({ 
                    where: { link: ad.link },
                    include: [{ model: AdDetail, as: 'details' }]
                });
                
                if (!existingAd) {
                    console.log(`⚠️ Ad not found in database: ${ad.title}`);
                    continue;
                }
                
                // Check if details already exist
                if (existingAd.details) {
                    console.log(`⚠️ Details already exist for: ${ad.title}`);
                    continue;
                }
                
                // Extract details from the ad page
                const details = await extractAdDetails(ad.link, city, adType);
                
                if (details) {
                    // Save details to database
                    await AdDetail.create({
                        adId: existingAd.id,
                        metraj: details.metraj || null,
                        salSakht: details.salSakht || null,
                        otagh: details.otagh || null,
                        tabaghe: details.tabaghe || null,
                        parking: details.parking || null,
                        asansor: details.asansor || null,
                        anbari: details.anbari || null,
                        tozihat: details.tozihat || null,
                        location: details.location || null,
                        imageLinks: details.imageLinks || [],
                        vadie: details.vadie || null,
                        ejare: details.ejare || null,
                        gheymatKol: details.gheymatKol || null,
                        gheymatHarMetr: details.gheymatHarMetr || null,
                        ghabeleTabdil: details.ghabeleTabdil || false,
                        scrapedAt: details.scrapedAt
                    });
                    
                    console.log(`✅ Details saved for: ${ad.title}`);
                    detailsSavedCount++;
                } else {
                    console.log(`❌ Failed to extract details for: ${ad.title}`);
                    errorsCount++;
                }
                
                processedCount++;
                
                // Add delay between requests to avoid being blocked
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`❌ Error processing details for "${ad.title}":`, error.message);
                errorsCount++;
            }
        }
        
        console.log(`\n📊 Details extraction summary:`);
        console.log(`   Total ads processed: ${processedCount}`);
        console.log(`   Details saved: ${detailsSavedCount}`);
        console.log(`   Errors: ${errorsCount}`);
        
        // Show updated database statistics
        const totalAds = await ScrapedAd.count();
        const totalDetails = await AdDetail.count();
        console.log(`📊 Total ads in database: ${totalAds}`);
        console.log(`📊 Total ad details: ${totalDetails}`);
        
    } catch (error) {
        console.error(`❌ Error in updateAdsWithDetails:`, error.message);
    }
}

module.exports = {
    extractAdDetails,
    updateAdsWithDetails
};
