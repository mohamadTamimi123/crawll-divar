const fs = require('fs');
const path = require('path');

// Function to save ads to JSON file (backup)
async function saveAdsToFile(ads, city, adType) {
    try {
        console.log(`💾 Saving ${ads.length} ads to backup file...`);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputDir = path.join(__dirname, '..', 'output');
        
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const filename = `${city}_${adType}_${timestamp}.json`;
        const filepath = path.join(outputDir, filename);
        
        // Add metadata to the data
        const dataToSave = {
            city: city,
            adType: adType,
            scrapedAt: new Date().toISOString(),
            totalAds: ads.length,
            ads: ads
        };
        
        fs.writeFileSync(filepath, JSON.stringify(dataToSave, null, 2), 'utf-8');
        console.log(`💾 Backup saved to ${filename}`);
        
        return filename;
    } catch (error) {
        console.error(`❌ File save error:`, error.message);
        return null;
    }
}

// Function to save basic ads to JSON file (backup)
async function saveBasicAdsToFile(ads, city, adType) {
    try {
        console.log(`💾 Saving ${ads.length} basic ads to backup file...`);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputDir = path.join(__dirname, '..', 'output');
        
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const filename = `${city}_${adType}_basic_${timestamp}.json`;
        const filepath = path.join(outputDir, filename);
        
        // Add metadata to the data
        const dataToSave = {
            city: city,
            adType: adType,
            scrapedAt: new Date().toISOString(),
            totalAds: ads.length,
            ads: ads.map(ad => ({
                title: ad.title,
                link: ad.link
            }))
        };
        
        fs.writeFileSync(filepath, JSON.stringify(dataToSave, null, 2), 'utf-8');
        console.log(`💾 Basic ads backup saved to ${filename}`);
        
        return filename;
    } catch (error) {
        console.error(`❌ Basic ads file save error:`, error.message);
        return null;
    }
}

// Function to ensure output directory exists
function ensureOutputDirectory() {
    const outputDir = path.join(__dirname, '..', 'output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    return outputDir;
}

// Function to get output directory path
function getOutputDirectory() {
    return path.join(__dirname, '..', 'output');
}

module.exports = {
    saveAdsToFile,
    saveBasicAdsToFile,
    ensureOutputDirectory,
    getOutputDirectory
};
