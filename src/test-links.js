const puppeteer = require('puppeteer');

async function testLinkExtraction() {
    console.log('🧪 Testing Divar link extraction...');
    
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/usr/bin/google-chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    
    try {
        // Test Tehran rent-apartment
        console.log('🔍 Testing Tehran rent-apartment...');
        await page.goto('https://divar.ir/s/tehran/rent-apartment', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        const links = await page.evaluate(() => {
            const adElements = document.querySelectorAll('a[href*="/v/"], a[href*="divar.ir/v/"], .kt-post-card a[href]');
            return Array.from(adElements).map(el => {
                const href = el.href;
                if (!href || !href.includes('divar.ir') || !href.includes('/v/')) {
                    return null;
                }
                
                return {
                    link: href,
                    title: el.querySelector('h2')?.innerText?.trim() ||
                           el.querySelector('.kt-post-card__title')?.innerText?.trim() ||
                           el.querySelector('.kt-post-card__body h2')?.innerText?.trim() ||
                           el.closest('.kt-post-card')?.querySelector('h2')?.innerText?.trim() ||
                           'بدون عنوان'
                };
            }).filter(ad => ad !== null);
        });
        
        console.log(`✅ Found ${links.length} links in Tehran rent-apartment`);
        if (links.length > 0) {
            console.log('📋 Sample links:');
            links.slice(0, 3).forEach((link, index) => {
                console.log(`   ${index + 1}. ${link.title}`);
                console.log(`      URL: ${link.link}`);
            });
        }
        
        // Test Karaj buy-apartment
        console.log('\n🔍 Testing Karaj buy-apartment...');
        await page.goto('https://divar.ir/s/karaj/buy-apartment', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        const links2 = await page.evaluate(() => {
            const adElements = document.querySelectorAll('a[href*="/v/"], a[href*="divar.ir/v/"], .kt-post-card a[href]');
            return Array.from(adElements).map(el => {
                const href = el.href;
                if (!href || !href.includes('divar.ir') || !href.includes('/v/')) {
                    return null;
                }
                
                return {
                    link: href,
                    title: el.querySelector('h2')?.innerText?.trim() ||
                           el.querySelector('.kt-post-card__title')?.innerText?.trim() ||
                           el.querySelector('.kt-post-card__body h2')?.innerText?.trim() ||
                           el.closest('.kt-post-card')?.querySelector('h2')?.innerText?.trim() ||
                           'بدون عنوان'
                };
            }).filter(ad => ad !== null);
        });
        
        console.log(`✅ Found ${links2.length} links in Karaj buy-apartment`);
        if (links2.length > 0) {
            console.log('📋 Sample links:');
            links2.slice(0, 3).forEach((link, index) => {
                console.log(`   ${index + 1}. ${link.title}`);
                console.log(`      URL: ${link.link}`);
            });
        }
        
        console.log('\n🎉 Link extraction test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during test:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
testLinkExtraction().catch(console.error);
