# Divar Crawler Backend

A modular backend crawler for Divar real estate ads with database storage and file backup capabilities.

## 🏗️ Project Structure

```
src/
├── config/
│   └── database.js          # Database configuration
├── models/                  # Sequelize models
│   ├── city.js
│   ├── scrapedAd.js
│   ├── adDetail.js
│   └── index.js
├── services/                # Modular services
│   ├── databaseService.js   # Database operations
│   ├── fileService.js       # File operations
│   └── crawlerService.js    # Crawling logic
├── migrations/              # Database migrations
├── seeders/                 # Database seeders
├── open_listing.js          # Main crawler script
├── importFromOutput.js      # Basic import script
└── importDetailedData.js    # Detailed import script
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
# Create database
npx sequelize-cli db:create

# Run migrations
npx sequelize-cli db:migrate

# Seed default cities
npx sequelize-cli db:seed:all
```

### 3. Run the Crawler
```bash
# Start crawling (saves to database + backup files)
npm run crawl

# Or directly
node src/open_listing.js
```

## 📥 Import Existing Data

If you have existing output files from previous crawls, you can import them into the database:

### Basic Import (Title + Link only)
```bash
npm run import
# Or
node src/importFromOutput.js
```

### Detailed Import (with full ad details)
```bash
npm run import:detailed
# Or
node src/importDetailedData.js
```

## 🔧 Available Scripts

- `npm start` / `npm run crawl` - Run the main crawler
- `npm run import` - Import basic ad data from output files
- `npm run import:detailed` - Import detailed ad data from output files
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with default data

## 📊 Database Schema

### Cities Table
- `id` - Primary key
- `name` - City slug (e.g., 'tehran', 'karaj')
- `display_name` - Persian city name (e.g., 'تهران', 'کرج')

### Scraped Ads Table
- `id` - Primary key
- `title` - Ad title
- `link` - Ad URL (unique)
- `city_id` - Foreign key to cities
- `ad_type` - Type of ad (e.g., 'rent-apartment', 'buy-apartment')

### Ad Details Table
- `id` - Primary key
- `ad_id` - Foreign key to scraped ads
- `metraj` - Area in square meters
- `sal_sakht` - Construction year
- `otagh` - Number of rooms
- `tabaghe` - Floor information
- `parking` - Parking availability
- `asansor` - Elevator availability
- `anbari` - Storage availability
- `tozihat` - Description
- `location` - Location details
- `image_links` - Array of image URLs
- `vadie` - Deposit amount (for rent)
- `ejare` - Monthly rent (for rent)
- `gheymat_kol` - Total price (for sale)
- `gheymat_har_metr` - Price per square meter (for sale)
- `ghabele_tabdil` - Convertible status

## 🔄 How It Works

### Main Crawler (`open_listing.js`)
1. **Setup**: Initialize browser and page
2. **Crawl**: Visit each city and ad type combination
3. **Collect**: Auto-scroll to gather all ad links
4. **Save Basic**: Immediately save title + link to database
5. **Extract Details**: Visit each ad page for detailed information
6. **Update**: Add detailed information to existing database records

### Import Scripts
1. **Read Files**: Parse all JSON files in the output directory
2. **Analyze**: Determine if files contain basic or detailed data
3. **Import Basic**: Save title + link information first
4. **Import Details**: Add detailed information to existing records

## 📁 Output Files

The crawler creates backup files in the `output/` directory:
- `{city}_{adType}_{timestamp}.json` - Full ad data with details
- `{city}_{adType}_basic_{timestamp}.json` - Basic ad data (title + link)

## 🛠️ Configuration

Database configuration is in `src/config/database.js`. Update the connection details as needed:

```javascript
module.exports = {
  development: {
    username: 'myuser',
    password: 'mypass',
    database: 'divar_crawler_db',
    host: 'localhost',
    port: 5432,
    dialect: 'postgres'
  }
  // ... production and test configs
};
```

## 🔍 Monitoring

The crawler provides real-time feedback:
- ✅ Success indicators
- ⚠️ Warning messages
- ❌ Error notifications
- 📊 Progress counters
- 💾 Database statistics

## 🚨 Error Handling

- Duplicate ads are automatically skipped
- Failed detail extractions are logged but don't stop the process
- Database connection errors are handled gracefully
- File I/O errors are logged with context

## 📈 Performance

- **Two-phase processing**: Basic info saved immediately, details added later
- **Batch operations**: Database operations are optimized
- **Progress tracking**: Real-time feedback on crawling progress
- **Memory efficient**: Large datasets are processed in chunks

## 🤝 Contributing

1. Follow the modular structure
2. Add new services in the `services/` directory
3. Update this README for new features
4. Test database operations thoroughly

## 📝 License

MIT License - see LICENSE file for details. 