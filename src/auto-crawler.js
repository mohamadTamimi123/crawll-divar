const puppeteer = require('puppeteer');
const { saveBasicAdsToDatabase, updateAdsWithDetails, getDatabaseStats } = require('./services/databaseService');
const { saveBasicAdsToFile } = require('./services/fileService');
const { autoScrollUntilButton, handleCityChangePrompt, closeMapIfOpen } = require('./services/crawlerService');
const { sendCrawlingReport, sendFinalSummaryEmail } = require('./services/emailService');
const config = require('./config/auto-crawler');

// Get configuration values
const { intervals, currentInterval, targets, crawling, browser: browserConfig, email: emailConfig } = config;
const CRAWL_INTERVAL = intervals[currentInterval];
const enabledTargets = targets.filter(target => target.enabled);

// Function to perform a single crawl
async function performCrawl() {
    console.log(`\n🚀 Starting automated crawl at ${new Date().toLocaleString('fa-IR')}`);
    console.log('='.repeat(60));
    
    const browser = await puppeteer.launch(browserConfig);
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Selectors
    const selectors = {
        citySelector: 'select[name="city"]',
        adTypeSelector: 'select[name="category"]',
        cityOption: 'option[value="tehran"]',
        adTypeOption: 'option[value="buy-apartment"]'
    };
    
    let totalNewAds = 0;
    const crawlStartTime = new Date();
    
    try {
        for (const item of enabledTargets) {
            console.log(`\n📍 Processing: ${item.displayName}`);
            console.log('─'.repeat(40));
            
            const cityStartTime = new Date();
            
            // Navigate to Divar
            await page.goto('https://divar.ir/tehran', { waitUntil: 'networkidle2' });
            
            // Handle city change if needed
            await handleCityChangePrompt(page, item.city);
            
            // Close map if open
            await closeMapIfOpen(page);
            
            // Navigate to specific ad type
            const adTypeUrl = `https://divar.ir/${item.city}/${item.adType}`;
            await page.goto(adTypeUrl, { waitUntil: 'networkidle2' });
            
            // Perform crawling with time-based stopping
            const ads = await autoScrollUntilButton(page, crawling.timeout, crawling.scrollDelay, item.city, item.adType);
            
            // Save basic ads to database
            const saveResult = await saveBasicAdsToDatabase(ads, item.city, item.adType);
            
            // Save backup to file
            await saveBasicAdsToFile(ads, item.city, item.adType);
            
            // Update with details (currently disabled)
            await updateAdsWithDetails(ads, item.city, item.adType);
            
            const cityEndTime = new Date();
            const cityDuration = Math.round((cityEndTime - cityStartTime) / 1000);
            
            // Get database stats
            const stats = await getDatabaseStats();
            
            console.log(`\n📊 Summary for ${item.displayName}:`);
            console.log(`   Total ads in database: ${stats.totalAds}`);
            console.log(`   New ads added this run: ${saveResult.newAdsAdded || ads.length}`);
            console.log(`   Skipped ads: ${saveResult.skippedAds || 0}`);
            console.log(`   City: ${item.city}`);
            console.log(`   Ad Type: ${item.adType}`);
            console.log(`   Crawling duration: ${cityDuration} seconds`);
            
            totalNewAds += (saveResult.newAdsAdded || ads.length);
            
            // Send email report for this city/adType
            if (emailConfig.enabled && emailConfig.sendAfterEachCity) {
                try {
                    console.log(`📧 Sending email report for ${item.displayName}...`);
                    await sendCrawlingReport({
                        city: item.city,
                        adType: item.adType,
                        displayName: item.displayName,
                        totalAdsFound: ads.length,
                        newAdsAdded: saveResult.newAdsAdded || ads.length,
                        skippedAds: saveResult.skippedAds || 0,
                        crawlingDuration: `${cityDuration} seconds`,
                        startTime: cityStartTime.toLocaleString('fa-IR'),
                        endTime: cityEndTime.toLocaleString('fa-IR'),
                        databaseStats: emailConfig.includeDatabaseStats ? stats : null
                    });
                    console.log(`✅ Email report sent successfully for ${item.displayName}`);
                } catch (error) {
                    console.error(`❌ Failed to send email report for ${item.displayName}:`, error.message);
                }
            }
            
            console.log(`\n✅ Completed processing for ${item.displayName}`);
            
            // Wait before next city
            if (item !== enabledTargets[enabledTargets.length - 1]) {
                console.log(`⏳ Waiting ${crawling.waitBetweenCities / 1000} seconds before next city...`);
                await new Promise(r => setTimeout(r, crawling.waitBetweenCities));
            }
        }
        
        await browser.close();
        
        const crawlEndTime = new Date();
        const crawlingDuration = Math.round((crawlEndTime - crawlStartTime) / 1000);
        
        // Get final database stats
        const finalStats = await getDatabaseStats();
        
        console.log('\n🎯 AUTOMATED CRAWL SUMMARY:');
        console.log('='.repeat(60));
        console.log(`📊 Total cities in database: ${finalStats.totalCities}`);
        console.log(`📊 Total ads in database: ${finalStats.totalAds}`);
        console.log(`📊 Total ad details in database: ${finalStats.totalDetails}`);
        console.log(`📊 New ads added this run: ${totalNewAds}`);
        console.log(`⏱️ Total crawling duration: ${crawlingDuration} seconds`);
        console.log(`🕐 Crawl completed at: ${crawlEndTime.toLocaleString('fa-IR')}`);
        console.log('='.repeat(60));
        
        // Send final summary email
        if (emailConfig.enabled && emailConfig.sendFinalSummary) {
            try {
                console.log('📧 Sending final summary email...');
                await sendFinalSummaryEmail({
                    ...finalStats,
                    newAdsAdded: totalNewAds,
                    crawlingDuration: `${crawlingDuration} seconds`,
                    crawlCompletedAt: crawlEndTime.toLocaleString('fa-IR')
                });
                console.log('✅ Final summary email sent successfully!');
            } catch (error) {
                console.error('❌ Failed to send final summary email:', error.message);
            }
        }
        
        console.log('✅ Automated crawl completed successfully!');
        return { success: true, newAdsAdded: totalNewAds, duration: crawlingDuration };
        
    } catch (error) {
        console.error('❌ Error during automated crawl:', error);
        await browser.close();
        return { success: false, error: error.message };
    }
}

// Function to start the automated crawling service
async function startAutoCrawler() {
    console.log('🤖 Starting Divar Auto-Crawler Service...');
    console.log(`⏰ Will run every ${CRAWL_INTERVAL / (60 * 1000)} minutes`);
    console.log(`🕐 Started at: ${new Date().toLocaleString('fa-IR')}`);
    console.log('='.repeat(60));
    
    // Perform initial crawl
    console.log('🚀 Performing initial crawl...');
    await performCrawl();
    
    // Set up interval for subsequent crawls
    setInterval(async () => {
        console.log(`\n🔄 Scheduled crawl triggered at ${new Date().toLocaleString('fa-IR')}`);
        await performCrawl();
    }, CRAWL_INTERVAL);
    
    console.log('✅ Auto-crawler service is now running!');
    console.log('💡 Press Ctrl+C to stop the service');
}

// Function to stop the service gracefully
function stopAutoCrawler() {
    console.log('\n🛑 Stopping Auto-Crawler Service...');
    console.log('👋 Service stopped. Goodbye!');
    process.exit(0);
}

// Handle graceful shutdown
process.on('SIGINT', stopAutoCrawler);
process.on('SIGTERM', stopAutoCrawler);

// Start the service if this file is run directly
if (require.main === module) {
    startAutoCrawler().catch(err => {
        console.error('❌ Failed to start auto-crawler service:', err);
        process.exit(1);
    });
}

module.exports = {
    performCrawl,
    startAutoCrawler,
    stopAutoCrawler
};
