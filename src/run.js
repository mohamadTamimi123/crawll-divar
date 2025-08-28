const puppeteer = require('puppeteer');
const { saveBasicAdsToDatabase, updateAdsWithDetails } = require('./services/databaseService');
const { saveBasicAdsToFile } = require('./services/fileService');
const { autoScrollUntilButton, handleCityChangePrompt, closeMapIfOpen } = require('./services/crawlerService');
const { sendCrawlingReport, sendFinalSummaryEmail } = require('./services/emailService');

(async () => {
  console.log('🚀 Starting Divar Crawler...');
  
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/usr/bin/google-chrome',
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set user agent to avoid detection
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  // پیکربندی دینامیک شهرها و نوع آگهی‌ها
  const config = [
    { city: 'karaj', adType: 'rent-apartment', displayName: 'karaj - rent' },
    { city: 'karaj', adType: 'buy-apartment', displayName: 'karaj - buy' },
    { city: 'tehran', adType: 'rent-apartment', displayName: 'tehran - rent' },
    { city: 'tehran', adType: 'buy-apartment', displayName: 'tehran - buy' }
  ];

  // دکمه بستن نقشه یک تگ i هم داخلش دارد، پس باید سلکتور را طوری بنویسیم که div و i را با هم بگیرد
  const mapCloseButtonSelector = "div.kt-fab-button.kt-fab-button--medium.kt-fab-button--extended.kt-fab-button--raised";
  const multiCityButtonSelector = 'button.kt-button.kt-button--primary.multi-city-change-alert-actions-ac158';
  
  for (const item of config) {
    const crawlStartTime = new Date();
    const url = `https://divar.ir/s/${item.city}/${item.adType}?business-type=personal`;
    console.log(`\n🔍 Opening: ${item.displayName}`);
    console.log(`URL: ${url}`);
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log(`✅ ${item.displayName} page opened. Keeping browser open for 15 seconds...`);
    await new Promise(r => setTimeout(r, 15000));
    
    // روی دکمه‌ای که داخلش span با متن "بله، تغییر می‌دهم" هست کلیک کن
    const yesChangeButton = await page.$x("//button[.//span[contains(@class, 'kt-text-truncate') and contains(text(), 'بله، تغییر می‌دهم')]]");
    if (yesChangeButton.length > 0) {
      await yesChangeButton[0].click();
      console.log('🏙️ City change prompt detected, clicked "بله، تغییر می‌دهم" button.');
      await page.waitForTimeout(2000);
    } else {
      console.log('ℹ️ No city change prompt found.');
    }

    // تلاش برای پیدا کردن و کلیک روی دکمه "بستن نقشه" که یک div با کلاس خاص و متن "بستن نقشه" است
    const fabClicked = await page.evaluate((selector) => {
      // پیدا کردن همه divهای با کلاس مورد نظر
      const btns = Array.from(document.querySelectorAll(selector));
      // دکمه‌ای که دقیقا متن "بستن نقشه" (بدون فاصله اضافی) دارد را پیدا کن
      const btn = btns.find(el => {
        // متن فقط باید دقیقا "بستن نقشه" باشد (آیکون داخل تگ i است)
        return el.childNodes.length &&
          Array.from(el.childNodes).some(node =>
            node.nodeType === Node.TEXT_NODE &&
            node.textContent.trim() === "بستن نقشه"
          );
      });
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    }, mapCloseButtonSelector);

    if (fabClicked) {
      console.log(`✅ [${item.displayName}] FAB (بستن نقشه) button found and clicked.`);
    } else {
      console.log(`❌ [${item.displayName}] FAB (بستن نقشه) button not found on the page.`);
    }

    await new Promise(r => setTimeout(r, 5000));

    // Now start scrolling and collecting ads
    console.log(`\n🔄 Starting to scroll and collect ads for ${item.displayName}...`);
    const ads = await autoScrollUntilButton(page, 120000, 1000, item.city, item.adType); // 2 minutes timeout
    
    console.log(`📋 Found ${ads.length} ads for ${item.displayName}`);
    
    // Save basic ad information (title and link) to database immediately
    console.log(`💾 Saving basic ad information to database...`);
    await saveBasicAdsToDatabase(ads, item.city, item.adType);
    
    // Also save basic ads to backup file
    await saveBasicAdsToFile(ads, item.city, item.adType);
    
    // Extract details from all ads - DISABLED FOR NOW
    // TODO: Re-enable when details extraction is needed
    console.log(`⏸️ Ad details extraction is currently disabled`);
    console.log(`📋 Only basic information (title + link) will be saved`);
    
    // Update ads in database (without details)
    await updateAdsWithDetails(ads, item.city, item.adType);
    
    // Get final statistics for this city/adType combination
    const { getDatabaseStats } = require('./services/databaseService');
    const stats = await getDatabaseStats();
    
    const crawlEndTime = new Date();
    const crawlingDuration = Math.round((crawlEndTime - crawlStartTime) / 1000); // seconds
    
    console.log(`\n📊 Final Summary for ${item.displayName}:`);
    console.log(`   Total ads in database: ${stats.totalAds}`);
    console.log(`   New ads added this run: ${ads.length}`);
    console.log(`   City: ${item.city}`);
    console.log(`   Ad Type: ${item.adType}`);
    console.log(`   Crawling duration: ${crawlingDuration} seconds`);
    
    // Send email report for this city/adType
    try {
      console.log(`📧 Sending email report for ${item.displayName}...`);
      await sendCrawlingReport({
        city: item.city,
        adType: item.adType,
        displayName: item.displayName,
        totalAdsFound: ads.length,
        newAdsAdded: ads.length, // Assuming all ads are new for now
        skippedAds: 0, // This would need to be calculated from saveResult
        crawlingDuration: `${crawlingDuration} seconds`,
        startTime: crawlStartTime.toLocaleString('fa-IR'),
        endTime: crawlEndTime.toLocaleString('fa-IR'),
        databaseStats: stats
      });
      console.log(`✅ Email report sent successfully for ${item.displayName}`);
    } catch (error) {
      console.error(`❌ Failed to send email report for ${item.displayName}:`, error.message);
    }
    
    console.log(`\n✅ Completed processing for ${item.displayName}`);
    console.log(`⏳ Waiting 10 seconds before next city...`);

    await new Promise(r => setTimeout(r, 10000));
  }

  // در صورت نیاز می‌توانید close را فعال کنید
  await browser.close();
  
  // Final summary
  const { getDatabaseStats } = require('./services/databaseService');
  const finalStats = await getDatabaseStats();
  
  console.log('\n🎯 FINAL CRAWLING SUMMARY:');
  console.log('='.repeat(50));
  console.log(`📊 Total cities in database: ${finalStats.totalCities}`);
  console.log(`📊 Total ads in database: ${finalStats.totalAds}`);
  console.log(`📊 Total ad details in database: ${finalStats.totalDetails}`);
  console.log('='.repeat(50));
  
  // Send final summary email
  try {
    console.log('📧 Sending final summary email...');
    await sendFinalSummaryEmail(finalStats);
    console.log('✅ Final summary email sent successfully!');
  } catch (error) {
    console.error('❌ Failed to send final summary email:', error.message);
  }
  
  console.log('✅ Database operations completed.');
  
  console.log('\n🎉 Done. All ads saved to database and backup files.');
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
