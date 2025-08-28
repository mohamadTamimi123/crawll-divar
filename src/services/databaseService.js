const { City, ScrapedAd, AdDetail } = require('../models');

// Function to save basic ad information (title and link) to database immediately
async function saveBasicAdsToDatabase(ads, city, adType) {
    try {
        console.log(`💾 Saving ${ads.length} basic ads to database...`);
        
        // Get city from database
        const cityRecord = await City.findOne({ where: { name: city } });
        if (!cityRecord) {
            console.error(`❌ City not found: ${city}`);
            return;
        }
        
        let savedCount = 0;
        let skippedCount = 0;
        
        for (const ad of ads) {
            try {
                // Check if ad already exists by link
                const existingAd = await ScrapedAd.findOne({ where: { link: ad.link } });
                
                if (existingAd) {
                    console.log(`⚠️ Ad already exists: ${ad.title}`);
                    skippedCount++;
                    continue;
                }
                
                // Create scraped ad with basic information only
                const scrapedAd = await ScrapedAd.create({
                    title: ad.title,
                    link: ad.link,
                    cityId: cityRecord.id,
                    adType: adType
                });
                
                console.log(`✅ Saved basic ad: ${ad.title} (ID: ${scrapedAd.id})`);
                savedCount++;
                
            } catch (error) {
                console.error(`❌ Error saving basic ad "${ad.title}":`, error.message);
            }
        }
        
        console.log(`💾 Basic ads saved: ${savedCount} saved, ${skippedCount} skipped`);
        
    } catch (error) {
        console.error(`❌ Database error saving basic ads:`, error.message);
    }
}

// Function to save ads to crawler database using Sequelize (legacy function)
async function saveAdsToDatabase(ads, city, adType) {
    try {
        console.log(`💾 Saving ${ads.length} ads to crawler database...`);
        
        // Get city from database
        const cityRecord = await City.findOne({ where: { name: city } });
        if (!cityRecord) {
            console.error(`❌ City not found: ${city}`);
            return;
        }
        
        let savedCount = 0;
        let skippedCount = 0;
        
        for (const ad of ads) {
            try {
                // Check if ad already exists by link
                const existingAd = await ScrapedAd.findOne({ where: { link: ad.link } });
                
                if (existingAd) {
                    console.log(`⚠️ Ad already exists: ${ad.title}`);
                    skippedCount++;
                    continue;
                }
                
                // Create scraped ad
                const scrapedAd = await ScrapedAd.create({
                    title: ad.title,
                    link: ad.link,
                    cityId: cityRecord.id,
                    adType: adType
                });
                
                console.log(`✅ Saved ad: ${ad.title} (ID: ${scrapedAd.id})`);
                
                // Save details if available
                if (ad.details) {
                    await AdDetail.create({
                        adId: scrapedAd.id,
                        metraj: ad.details.metraj || null,
                        salSakht: ad.details.salSakht || null,
                        otagh: ad.details.otagh || null,
                        tabaghe: ad.details.tabaghe || null,
                        parking: ad.details.parking || null,
                        asansor: ad.details.asansor || null,
                        anbari: ad.details.anbari || null,
                        tozihat: ad.details.tozihat || null,
                        location: ad.details.location || null,
                        imageLinks: ad.details.imageLinks || [],
                        vadie: ad.details.vadie || null,
                        ejare: ad.details.ejare || null,
                        gheymatKol: ad.details.gheymatKol || null,
                        gheymatHarMetr: ad.details.gheymatHarMetr || null,
                        ghabeleTabdil: ad.details.ghabeleTabdil || false
                    });
                    console.log(`✅ Saved details for: ${ad.title}`);
                }
                
                savedCount++;
                
            } catch (error) {
                console.error(`❌ Error saving ad "${ad.title}":`, error.message);
            }
        }
        
        // Show database statistics
        const totalAds = await ScrapedAd.count();
        const totalDetails = await AdDetail.count();
        console.log(`📊 Total ads in crawler database: ${totalAds}`);
        console.log(`📊 Total ad details: ${totalDetails}`);
        
        console.log(`💾 Database save completed: ${savedCount} saved, ${skippedCount} skipped`);
        
    } catch (error) {
        console.error(`❌ Database error:`, error.message);
    }
}

// Function to update existing ads with detailed information (currently disabled)
// TODO: Re-enable when details extraction is needed
async function updateAdsWithDetails(ads, city, adType) {
    try {
        console.log(`💾 Processing ${ads.length} ads (details extraction disabled)...`);
        
        // Since details extraction is disabled, we just log the basic info
        console.log(`📋 Basic information saved for all ads`);
        console.log(`⏸️ Details extraction is currently disabled`);
        
        // Show database statistics
        const totalAds = await ScrapedAd.count();
        const totalDetails = await AdDetail.count();
        console.log(`📊 Total ads in database: ${totalAds}`);
        console.log(`📊 Total ad details: ${totalDetails}`);
        
        console.log(`💾 Basic processing completed for ${ads.length} ads`);
        
    } catch (error) {
        console.error(`❌ Database error:`, error.message);
    }
}

// Function to get database statistics
async function getDatabaseStats() {
    try {
        const totalAds = await ScrapedAd.count();
        const totalDetails = await AdDetail.count();
        const totalCities = await City.count();
        
        return {
            totalAds,
            totalDetails,
            totalCities
        };
    } catch (error) {
        console.error(`❌ Error getting database stats:`, error.message);
        return null;
    }
}

module.exports = {
    saveBasicAdsToDatabase,
    saveAdsToDatabase,
    updateAdsWithDetails,
    getDatabaseStats
};
