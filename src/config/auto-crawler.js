// Auto-Crawler Configuration
module.exports = {
    // Crawling intervals (in milliseconds)
    intervals: {
        hourly: 60 * 60 * 1000,        // 1 hour
        every2Hours: 2 * 60 * 60 * 1000, // 2 hours
        every4Hours: 4 * 60 * 60 * 1000, // 4 hours
        every6Hours: 6 * 60 * 60 * 1000, // 6 hours
        daily: 24 * 60 * 60 * 1000      // 24 hours
    },
    
    // Current crawling interval
    currentInterval: 'hourly', // Options: hourly, every2Hours, every4Hours, every6Hours, daily
    
    // Cities and ad types to crawl
    targets: [
        { city: 'tehran', adType: 'buy-apartment', displayName: 'تهران - خرید آپارتمان', enabled: true },
        { city: 'tehran', adType: 'rent-apartment', displayName: 'تهران - اجاره آپارتمان', enabled: true },
        { city: 'karaj', adType: 'buy-apartment', displayName: 'کرج - خرید آپارتمان', enabled: true },
        { city: 'karaj', adType: 'rent-apartment', displayName: 'کرج - اجاره آپارتمان', enabled: true }
    ],
    
    // Crawling settings
    crawling: {
        timeout: 120000,           // 2 minutes timeout for each city
        scrollDelay: 1000,         // 1 second delay between scrolls
        waitBetweenCities: 5000,   // 5 seconds wait between cities
        maxConsecutiveNoNewAds: 3, // Stop if no new ads found in 3 consecutive scrolls
        timeBasedStopping: {
            enabled: true,
            maxAge: '3 ساعت پیش',   // Stop at ads older than 3 hours
            crawlOlderAds: false   // Don't crawl ads older than maxAge
        }
    },
    
    // Browser settings
    browser: {
        headless: false,           // Show browser window
        executablePath: '/usr/bin/google-chrome',
        defaultViewport: null,
        args: [
            '--start-maximized',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    },
    
    // Email notifications
    email: {
        enabled: true,
        sendAfterEachCity: true,   // Send email after each city/adType
        sendFinalSummary: true,    // Send final summary email
        includeDatabaseStats: true // Include database statistics in emails
    },
    
    // Database settings
    database: {
        saveBasicInfo: true,       // Save title and link immediately
        saveDetails: false,        // Currently disabled
        checkDuplicates: true,     // Check for duplicate ads
        backupToFile: true         // Save backup to JSON files
    },
    
    // Logging settings
    logging: {
        level: 'info',             // Log level: debug, info, warn, error
        saveToFile: false,         // Save logs to file
        logFile: 'auto-crawler.log',
        consoleOutput: true        // Show logs in console
    },
    
    // Performance settings
    performance: {
        maxConcurrentCities: 1,    // Process cities one by one
        retryOnFailure: true,      // Retry failed crawls
        maxRetries: 3,             // Maximum retry attempts
        retryDelay: 30000          // 30 seconds delay between retries
    },
    
    // Monitoring settings
    monitoring: {
        healthCheck: true,         // Enable health monitoring
        healthCheckInterval: 300000, // Check health every 5 minutes
        alertOnFailure: true,      // Send alert on failure
        maxConsecutiveFailures: 3  // Alert after 3 consecutive failures
    }
};
