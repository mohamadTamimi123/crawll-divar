const { extractAdDetails } = require('./services/detailsExtractionService');

// Test function to check details extraction for a single ad
async function testSingleAdDetails() {
    console.log('🧪 Testing single ad details extraction...');
    
    const testAd = {
        title: 'Test Ad',
        link: 'https://divar.ir/v/اجاره-آپارتمان/AadKPzbF'
    };
    
    try {
        console.log(`🔍 Extracting details from: ${testAd.title}`);
        console.log(`🔗 URL: ${testAd.link}`);
        
        const details = await extractAdDetails(testAd.link, 'tehran', 'rent-apartment');
        
        if (details) {
            console.log('\n✅ Details extracted successfully!');
            console.log('📋 Extracted details:');
            console.log(`   عنوان: ${details.title}`);
            console.log(`   متراژ: ${details.metraj}`);
            console.log(`   سال ساخت: ${details.salSakht}`);
            console.log(`   اتاق: ${details.otagh}`);
            console.log(`   طبقه: ${details.tabaghe}`);
            console.log(`   پارکینگ: ${details.parking}`);
            console.log(`   آسانسور: ${details.asansor}`);
            console.log(`   انباری: ${details.anbari}`);
            console.log(`   توضیحات: ${details.tozihat ? details.tozihat.substring(0, 100) + '...' : 'ندارد'}`);
            console.log(`   موقعیت: ${details.location}`);
            console.log(`   ودیعه: ${details.vadie}`);
            console.log(`   اجاره: ${details.ejare}`);
            console.log(`   قیمت کل: ${details.gheymatKol}`);
            console.log(`   قیمت هر متر: ${details.gheymatHarMetr}`);
            console.log(`   قابل تبدیل: ${details.ghabeleTabdil}`);
            console.log(`   تعداد تصاویر: ${details.imageLinks ? details.imageLinks.length : 0}`);
            console.log(`   لینک نقشه: ${details.mapLocation ? 'دارد' : 'ندارد'}`);
        } else {
            console.log('❌ Failed to extract details');
        }
        
    } catch (error) {
        console.error('❌ Error in details extraction test:', error.message);
    }
}

// Run the test
testSingleAdDetails().catch(console.error);
