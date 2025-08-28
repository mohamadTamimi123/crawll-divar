const { ScrapedAd, City } = require('./models');

async function checkDatabaseData() {
    console.log('🔍 Checking Database Data...\n');
    
    try {
        // Get cities
        const cities = await City.findAll();
        console.log(`🏙️ Cities in database: ${cities.length}`);
        cities.forEach(city => {
            console.log(`   - ${city.name} (${city.displayName})`);
        });
        
        console.log('\n' + '='.repeat(60));
        
        // Get total ads count
        const totalAds = await ScrapedAd.count();
        console.log(`📊 Total ads in database: ${totalAds}`);
        
        // Get ads by city and type
        for (const city of cities) {
            console.log(`\n🏙️ ${city.displayName || city.name}:`);
            
            const rentAds = await ScrapedAd.count({
                where: { cityId: city.id, adType: 'rent-apartment' }
            });
            
            const buyAds = await ScrapedAd.count({
                where: { cityId: city.id, adType: 'buy-apartment' }
            });
            
            console.log(`   🏠 Rent apartments: ${rentAds}`);
            console.log(`   🏠 Buy apartments: ${buyAds}`);
            console.log(`   📊 Total: ${rentAds + buyAds}`);
            
            // Show recent ads
            const recentAds = await ScrapedAd.findAll({
                where: { cityId: city.id },
                order: [['createdAt', 'DESC']],
                limit: 3
            });
            
            if (recentAds.length > 0) {
                console.log(`   📋 Recent ads:`);
                recentAds.forEach((ad, index) => {
                    const time = ad.createdAt.toLocaleString('fa-IR');
                    console.log(`      ${index + 1}. ${ad.title} (${time})`);
                });
            }
        }
        
        // Show overall statistics
        console.log('\n' + '='.repeat(60));
        console.log('📈 OVERALL STATISTICS:');
        console.log('='.repeat(60));
        
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        const todayAds = await ScrapedAd.count({
            where: {
                createdAt: {
                    [require('sequelize').Op.gte]: startOfDay
                }
            }
        });
        
        const yesterdayAds = await ScrapedAd.count({
            where: {
                createdAt: {
                    [require('sequelize').Op.gte]: new Date(startOfDay.getTime() - 24*60*60*1000),
                    [require('sequelize').Op.lt]: startOfDay
                }
            }
        });
        
        console.log(`📅 Today's ads: ${todayAds}`);
        console.log(`📅 Yesterday's ads: ${yesterdayAds}`);
        console.log(`📊 Total ads: ${totalAds}`);
        
        // Show data structure
        console.log('\n' + '='.repeat(60));
        console.log('🗂️ DATA STRUCTURE:');
        console.log('='.repeat(60));
        
        if (totalAds > 0) {
            const sampleAd = await ScrapedAd.findOne();
            console.log('📋 Sample ad structure:');
            console.log(`   ID: ${sampleAd.id}`);
            console.log(`   Title: ${sampleAd.title}`);
            console.log(`   Link: ${sampleAd.link}`);
            console.log(`   City ID: ${sampleAd.cityId}`);
            console.log(`   Ad Type: ${sampleAd.adType}`);
            console.log(`   Created: ${sampleAd.createdAt}`);
            console.log(`   Updated: ${sampleAd.updatedAt}`);
        }
        
        console.log('\n✅ Database check completed!');
        
    } catch (error) {
        console.error('❌ Error checking database:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the check
checkDatabaseData().catch(err => {
    console.error('❌ Database check failed:', err);
    process.exit(1);
});
