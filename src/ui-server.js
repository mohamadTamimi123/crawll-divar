const express = require('express');
const { getDatabaseStats } = require('./services/databaseService');
const { City, ScrapedAd, AdDetail } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// Set view engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Serve static files
app.use(express.static('public'));

// Middleware to parse JSON
app.use(express.json());

// Routes
app.get('/', async (req, res) => {
    try {
        const stats = await getDatabaseStats();
        res.render('dashboard', { stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to get database stats
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await getDatabaseStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to get cities
app.get('/api/cities', async (req, res) => {
    try {
        const cities = await City.findAll({
            order: [['name', 'ASC']]
        });
        res.json(cities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to get ads with pagination
app.get('/api/ads', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const cityFilter = req.query.city || '';
        const adTypeFilter = req.query.adType || '';

        let whereClause = {};
        if (cityFilter) {
            whereClause.city_id = cityFilter;
        }
        if (adTypeFilter) {
            whereClause.ad_type = adTypeFilter;
        }

        const { count, rows: ads } = await ScrapedAd.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: City,
                    as: 'city',
                    attributes: ['name', 'display_name']
                },
                {
                    model: AdDetail,
                    as: 'details',
                    attributes: ['metraj', 'sal_sakht', 'otagh', 'tabaghe', 'parking', 'asansor', 'anbari', 'tozihat', 'location', 'image_links', 'vadie', 'ejare', 'gheymat_kol', 'gheymat_har_metr', 'ghabele_tabdil']
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        const totalPages = Math.ceil(count / limit);

        res.json({
            ads,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: count,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to get ad details
app.get('/api/ads/:id', async (req, res) => {
    try {
        const ad = await ScrapedAd.findByPk(req.params.id, {
            include: [
                {
                    model: City,
                    as: 'city',
                    attributes: ['name', 'display_name']
                },
                {
                    model: AdDetail,
                    as: 'details'
                }
            ]
        });

        if (!ad) {
            return res.status(404).json({ error: 'Ad not found' });
        }

        res.json(ad);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 UI Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🔌 API Base: http://localhost:${PORT}/api`);
});

module.exports = app;
