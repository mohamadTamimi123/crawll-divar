// Database configuration for Divar Crawler
module.exports = {
    // PostgreSQL connection settings
    postgres: {
        user: 'myuser',
        host: 'localhost',
        database: 'divar_crawler_db',
        password: 'mypass',
        port: 5432,
        // Connection pool settings
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    },
    
    // Database table names
    tables: {
        scrapedAds: 'scraped_ads',
        adDetails: 'ad_details',
        cities: 'cities'
    },
    
    // Default cities for initialization
    defaultCities: [
        { name: 'tehran', displayName: 'تهران' },
        { name: 'karaj', displayName: 'کرج' }
    ]
};
