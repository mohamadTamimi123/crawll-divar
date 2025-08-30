const { extractAdDetails } = require('./services/detailsExtractionService');

// Test function to check details extraction for multiple ads
async function testMultipleAdDetails() {
    console.log('🧪 Testing multiple ad details extraction...');
    
    const testAds = [
        {
            title: 'اجاره آپارتمان تهران',
            link: 'https://divar.ir/v/اجاره-آپارتمان/AadKPzbF'
        },
        {
            title: 'فروش آپارتمان کرج',
            link: 'https://divar.ir/v/155متری-2-پارکینگ-فول-مشاعات-نگین-شهرک-غرب/AavmAYux'
        },
        {
            title: 'اجاره آپارتمان کرج',
            link: 'https://divar.ir/v/۶۰متر-با-آسانسور-بدون-مالک/Aaz2hqzI'
        }
    ];
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < testAds.length; i++) {
        const ad = testAds[i];
        console.log(`\n🔍 Processing ${i + 1}/${testAds.length}: ${ad.title}`);
        console.log(`🔗 URL: ${ad.link}`);
        
        try {
            const details = await extractAdDetails(ad.link, 'tehran', 'rent-apartment');
            
            if (details) {
                console.log(`✅ Success: ${ad.title}`);
                console.log(`   متراژ: ${details.metraj}`);
                console.log(`   سال ساخت: ${details.salSakht}`);
                console.log(`   اتاق: ${details.otagh}`);
                console.log(`   ودیعه: ${details.vadie}`);
                console.log(`   اجاره: ${details.ejare}`);
                console.log(`   قیمت کل: ${details.gheymatKol}`);
                successCount++;
            } else {
                console.log(`❌ Failed: ${ad.title}`);
                errorCount++;
            }
            
            // Add delay between requests
            if (i < testAds.length - 1) {
                console.log('⏳ Waiting 3 seconds before next request...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
        } catch (error) {
            console.error(`❌ Error processing ${ad.title}:`, error.message);
            errorCount++;
        }
    }
    
    console.log('\n📊 Test Summary:');
    console.log(`   Total ads tested: ${testAds.length}`);
    console.log(`   Successful extractions: ${successCount}`);
    console.log(`   Failed extractions: ${errorCount}`);
    console.log(`   Success rate: ${((successCount / testAds.length) * 100).toFixed(1)}%`);
}

// Run the test
testMultipleAdDetails().catch(console.error);
