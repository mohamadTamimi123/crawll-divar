const fs = require('fs');
const path = require('path');
const { 
    saveBasicAdsToDatabase, 
    getDatabaseStats 
} = require('./services/databaseService');

// Function to read and parse output files
async function readOutputFiles() {
    const outputDir = path.join(__dirname, '..', 'output');
    
    if (!fs.existsSync(outputDir)) {
        console.log('❌ Output directory not found');
        return [];
    }
    
    const files = fs.readdirSync(outputDir).filter(file => file.endsWith('.json'));
    console.log(`📁 Found ${files.length} output files`);
    
    const allAds = [];
    
    for (const file of files) {
        try {
            const filePath = path.join(outputDir, file);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(fileContent);
            
            console.log(`📖 Reading file: ${file}`);
            console.log(`   City: ${data.city}`);
            console.log(`   Ad Type: ${data.adType}`);
            console.log(`   Total Ads: ${data.totalAds}`);
            console.log(`   Scraped At: ${data.scrapedAt}`);
            
            // Extract ads from the file
            if (data.ads && Array.isArray(data.ads)) {
                for (const ad of data.ads) {
                    // Check if this is a basic ad (title + link) or detailed ad
                    if (ad.title && ad.link) {
                        allAds.push({
                            title: ad.title,
                            link: ad.link,
                            city: data.city,
                            adType: data.adType,
                            scrapedAt: data.scrapedAt,
                            // Include details if available
                            details: ad.details || null
                        });
                    }
                }
            }
            
        } catch (error) {
            console.error(`❌ Error reading file ${file}:`, error.message);
        }
    }
    
    console.log(`\n📊 Total ads found across all files: ${allAds.length}`);
    return allAds;
}

// Function to group ads by city and ad type
function groupAdsByCityAndType(ads) {
    const grouped = {};
    
    for (const ad of ads) {
        const key = `${ad.city}_${ad.adType}`;
        if (!grouped[key]) {
            grouped[key] = {
                city: ad.city,
                adType: ad.adType,
                ads: []
            };
        }
        grouped[key].ads.push(ad);
    }
    
    return Object.values(grouped);
}

// Function to import ads to database
async function importAdsToDatabase(groupedAds) {
    console.log('\n💾 Starting database import...');
    
    let totalImported = 0;
    let totalSkipped = 0;
    
    for (const group of groupedAds) {
        console.log(`\n🏙️ Processing ${group.city} - ${group.adType}`);
        console.log(`   Ads to process: ${group.ads.length}`);
        
        try {
            // Save basic ads to database
            await saveBasicAdsToDatabase(group.ads, group.city, group.adType);
            
            // Count imported vs skipped (this info comes from the service)
            // For now, we'll assume all were processed
            totalImported += group.ads.length;
            
        } catch (error) {
            console.error(`❌ Error importing ${group.city} - ${group.adType}:`, error.message);
        }
    }
    
    console.log(`\n📊 Import Summary:`);
    console.log(`   Total imported: ${totalImported}`);
    console.log(`   Total skipped: ${totalSkipped}`);
    
    return { totalImported, totalSkipped };
}

// Main function
async function main() {
    try {
        console.log('🚀 Starting data import from output files...\n');
        
        // Read all output files
        const allAds = await readOutputFiles();
        
        if (allAds.length === 0) {
            console.log('❌ No ads found in output files');
            return;
        }
        
        // Group ads by city and ad type
        const groupedAds = groupAdsByCityAndType(allAds);
        console.log(`\n📋 Grouped into ${groupedAds.length} categories`);
        
        // Import to database
        const importResult = await importAdsToDatabase(groupedAds);
        
        // Show final database stats
        console.log('\n📊 Final database statistics:');
        const stats = await getDatabaseStats();
        if (stats) {
            console.log(`   Total cities: ${stats.totalCities}`);
            console.log(`   Total ads: ${stats.totalAds}`);
            console.log(`   Total ad details: ${stats.totalDetails}`);
        }
        
        console.log('\n✅ Data import completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during import:', error);
        process.exit(1);
    }
}

// Run the import if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = {
    readOutputFiles,
    groupAdsByCityAndType,
    importAdsToDatabase
};
