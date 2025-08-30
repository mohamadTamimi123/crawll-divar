const { updateAdsWithDetails } = require('./services/databaseService');

// Test function to check details extraction
async function testDetailsExtraction() {
    console.log('🧪 Testing details extraction...');
    
    const testAds = [
        {
            title: 'Test Ad 1',
            link: 'https://divar.ir/v/اجاره-آپارتمان/AadKPzbF'
        },
        {
            title: 'Test Ad 2', 
            link: 'https://divar.ir/v/155متری-2-پارکینگ-فول-مشاعات-نگین-شهرک-غرب/AavmAYux'
        }
    ];
    
    try {
        await updateAdsWithDetails(testAds, 'tehran', 'rent-apartment');
        console.log('✅ Details extraction test completed');
    } catch (error) {
        console.error('❌ Error in details extraction test:', error.message);
    }
}

// Run the test
testDetailsExtraction().catch(console.error);
