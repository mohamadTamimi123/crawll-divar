const fs = require('fs');
const path = require('path');
const { 
    saveBasicAdsToDatabase, 
    updateAdsWithDetails,
    getDatabaseStats 
} = require('./services/databaseService');

// Function to read and parse output files with detailed analysis
async function readOutputFilesDetailed() {
    const outputDir = path.join(__dirname, '..', 'output');
    
    if (!fs.existsSync(outputDir)) {
        console.log('❌ Output directory not found');
        return [];
    }
    
    const files = fs.readdirSync(outputDir).filter(file => file.endsWith('.json'));
    console.log(`📁 Found ${files.length} output files`);
    
    const fileAnalysis = [];
    
    for (const file of files) {
        try {
            const filePath = path.join(outputDir, file);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(fileContent);
            
            const analysis = {
                filename: file,
                city: data.city,
                adType: data.adType,
                scrapedAt: data.scrapedAt,
                totalAds: data.totalAds || 0,
                hasDetails: false,
                basicAds: [],
                detailedAds: []
            };
            
            // Analyze the structure of ads
            if (data.ads && Array.isArray(data.ads)) {
                for (const ad of data.ads) {
                    if (ad.title && ad.link) {
                        // Check if this ad has detailed information
                        if (ad.details && Object.keys(ad.details).length > 0) {
                            analysis.hasDetails = true;
                            analysis.detailedAds.push({
                                title: ad.title,
                                link: ad.link,
                                details: ad.details
                            });
                        } else {
                            analysis.basicAds.push({
                                title: ad.title,
                                link: ad.link
                            });
                        }
                    }
                }
            }
            
            fileAnalysis.push(analysis);
            
            console.log(`📖 ${file}:`);
            console.log(`   City: ${analysis.city}`);
            console.log(`   Ad Type: ${analysis.adType}`);
            console.log(`   Total: ${analysis.totalAds}`);
            console.log(`   Basic: ${analysis.basicAds.length}`);
            console.log(`   Detailed: ${analysis.detailedAds.length}`);
            console.log(`   Has Details: ${analysis.hasDetails ? '✅' : '❌'}`);
            
        } catch (error) {
            console.error(`❌ Error reading file ${file}:`, error.message);
        }
    }
    
    return fileAnalysis;
}

// Function to import basic ads first
async function importBasicAds(fileAnalysis) {
    console.log('\n💾 Phase 1: Importing basic ads...');
    
    let totalImported = 0;
    let totalSkipped = 0;
    
    for (const file of fileAnalysis) {
        if (file.basicAds.length > 0) {
            console.log(`\n🏙️ Processing ${file.city} - ${file.adType} (Basic ads)`);
            console.log(`   Basic ads to process: ${file.basicAds.length}`);
            
            try {
                await saveBasicAdsToDatabase(file.basicAds, file.city, file.adType);
                totalImported += file.basicAds.length;
            } catch (error) {
                console.error(`❌ Error importing basic ads for ${file.city} - ${file.adType}:`, error.message);
            }
        }
    }
    
    console.log(`\n📊 Basic ads import summary:`);
    console.log(`   Total imported: ${totalImported}`);
    console.log(`   Total skipped: ${totalSkipped}`);
    
    return { totalImported, totalSkipped };
}

// Function to import detailed ads
async function importDetailedAds(fileAnalysis) {
    console.log('\n💾 Phase 2: Importing detailed ads...');
    
    let totalImported = 0;
    let totalSkipped = 0;
    
    for (const file of fileAnalysis) {
        if (file.detailedAds.length > 0) {
            console.log(`\n🏙️ Processing ${file.city} - ${file.adType} (Detailed ads)`);
            console.log(`   Detailed ads to process: ${file.detailedAds.length}`);
            
            try {
                // For detailed ads, we need to save basic info first, then details
                const basicAds = file.detailedAds.map(ad => ({
                    title: ad.title,
                    link: ad.link
                }));
                
                // Save basic info
                await saveBasicAdsToDatabase(basicAds, file.city, file.adType);
                
                // Then update with details
                await updateAdsWithDetails(file.detailedAds, file.city, file.adType);
                
                totalImported += file.detailedAds.length;
            } catch (error) {
                console.error(`❌ Error importing detailed ads for ${file.city} - ${file.adType}:`, error.message);
            }
        }
    }
    
    console.log(`\n📊 Detailed ads import summary:`);
    console.log(`   Total imported: ${totalImported}`);
    console.log(`   Total skipped: ${totalSkipped}`);
    
    return { totalImported, totalSkipped };
}

// Function to show import summary
async function showImportSummary(basicResult, detailedResult) {
    console.log('\n🎯 Import Summary:');
    console.log('='.repeat(50));
    console.log(`📋 Basic Ads:`);
    console.log(`   Imported: ${basicResult.totalImported}`);
    console.log(`   Skipped: ${basicResult.totalSkipped}`);
    console.log(`\n📋 Detailed Ads:`);
    console.log(`   Imported: ${detailedResult.totalImported}`);
    console.log(`   Skipped: ${detailedResult.totalSkipped}`);
    console.log(`\n📊 Total:`);
    console.log(`   Imported: ${basicResult.totalImported + detailedResult.totalImported}`);
    console.log(`   Skipped: ${basicResult.totalSkipped + detailedResult.totalSkipped}`);
    
    // Show final database stats
    console.log('\n📊 Final database statistics:');
    const stats = await getDatabaseStats();
    if (stats) {
        console.log(`   Total cities: ${stats.totalCities}`);
        console.log(`   Total ads: ${stats.totalAds}`);
        console.log(`   Total ad details: ${stats.totalDetails}`);
    }
}

// Main function
async function main() {
    try {
        console.log('🚀 Starting detailed data import from output files...\n');
        
        // Read and analyze all output files
        const fileAnalysis = await readOutputFilesDetailed();
        
        if (fileAnalysis.length === 0) {
            console.log('❌ No output files found to analyze');
            return;
        }
        
        // Phase 1: Import basic ads
        const basicResult = await importBasicAds(fileAnalysis);
        
        // Phase 2: Import detailed ads
        const detailedResult = await importDetailedAds(fileAnalysis);
        
        // Show final summary
        await showImportSummary(basicResult, detailedResult);
        
        console.log('\n✅ Detailed data import completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during detailed import:', error);
        process.exit(1);
    }
}

// Run the import if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = {
    readOutputFilesDetailed,
    importBasicAds,
    importDetailedAds,
    showImportSummary
};
