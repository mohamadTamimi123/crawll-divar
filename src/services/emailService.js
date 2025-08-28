const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

// Email configuration from config file
const smtpConfig = emailConfig.smtp;
const emailSettings = emailConfig.email;

// Create transporter
const transporter = nodemailer.createTransport(smtpConfig);

// Function to send crawling report email
async function sendCrawlingReport(crawlingData) {
    try {
        const {
            city,
            adType,
            displayName,
            totalAdsFound,
            newAdsAdded,
            skippedAds,
            crawlingDuration,
            startTime,
            endTime,
            databaseStats
        } = crawlingData;

        // Create email content
        const emailSubject = `🔄 گزارش کراول ${displayName} - ${new Date().toLocaleDateString('fa-IR')}`;
        
        const emailBody = `
            <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">🔄 گزارش کراول دیوار</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">${displayName}</p>
                </div>
                
                <div style="background: white; padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
                    <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">📊 خلاصه کراول</h2>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                            <h3 style="margin: 0 0 10px 0; color: #28a745;">✅ آگهی‌های جدید</h3>
                            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #28a745;">${newAdsAdded}</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                            <h3 style="margin: 0 0 10px 0; color: #ffc107;">⚠️ آگهی‌های تکراری</h3>
                            <p style="font-size: 24px; font-weight: bold; margin: 0; color: #ffc107;">${skippedAds}</p>
                        </div>
                    </div>
                    
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #1976d2;">📋 جزئیات کراول</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>شهر:</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${city}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>نوع آگهی:</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${adType === 'rent-apartment' ? 'اجاره آپارتمان' : 'فروش آپارتمان'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>کل آگهی‌های یافت شده:</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${totalAdsFound}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>مدت زمان کراول:</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${crawlingDuration}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>زمان شروع:</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${startTime}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>زمان پایان:</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${endTime}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #7b1fa2;">🗄️ وضعیت دیتابیس</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>کل آگهی‌ها:</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${databaseStats.totalAds}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>کل شهرها:</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${databaseStats.totalCities}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>کل جزئیات:</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${databaseStats.totalDetails}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="text-align: center; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <p style="margin: 0; color: #666;">
                            🎉 کراول با موفقیت به پایان رسید!<br>
                            تمام آگهی‌ها در دیتابیس ذخیره شدند.
                        </p>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; color: #666; font-size: 12px;">
                    <p style="margin: 0;">
                        این ایمیل به صورت خودکار توسط سیستم کراول دیوار ارسال شده است.<br>
                        تاریخ: ${new Date().toLocaleDateString('fa-IR')} - ساعت: ${new Date().toLocaleTimeString('fa-IR')}
                    </p>
                </div>
            </div>
        `;

        // Send email
        const mailOptions = {
            from: `"${emailSettings.from}" <${smtpConfig.auth.user}>`,
            to: emailSettings.to,
            subject: emailSubject,
            html: emailBody
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent successfully to ${emailSettings.to}`);
        console.log(`📧 Message ID: ${result.messageId}`);
        
        return result;
        
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        throw error;
    }
}

// Function to send final summary email
async function sendFinalSummaryEmail(finalStats) {
    try {
        const emailSubject = `🎯 خلاصه نهایی کراول دیوار - ${new Date().toLocaleDateString('fa-IR')}`;
        
        const emailBody = `
            <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">🎯 کراول دیوار تکمیل شد!</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">خلاصه نهایی تمام شهرها و نوع آگهی‌ها</p>
                </div>
                
                <div style="background: white; padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
                    <h2 style="color: #333; border-bottom: 2px solid #28a745; padding-bottom: 10px;">📊 آمار کلی</h2>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                            <h3 style="margin: 0 0 10px 0; color: #28a745;">🏙️ شهرها</h3>
                            <p style="font-size: 20px; font-weight: bold; margin: 0; color: #28a745;">${finalStats.totalCities}</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                            <h3 style="margin: 0 0 10px 0; color: #007bff;">📋 آگهی‌ها</h3>
                            <p style="font-size: 20px; font-weight: bold; margin: 0; color: #007bff;">${finalStats.totalAds}</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                            <h3 style="margin: 0 0 10px 0; color: #6f42c1;">🔍 جزئیات</h3>
                            <p style="font-size: 20px; font-weight: bold; margin: 0; color: #6f42c1;">${finalStats.totalDetails}</p>
                        </div>
                    </div>
                    
                    <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #155724;">✅ وضعیت نهایی</h3>
                        <p style="margin: 0; color: #155724;">
                            🎉 تمام شهرها و نوع آگهی‌ها با موفقیت کراول شدند!<br>
                            📊 داده‌ها در دیتابیس ذخیره شدند<br>
                            💾 نسخه پشتیبان تهیه شد<br>
                            📧 گزارش‌های تفصیلی ارسال شدند
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <p style="margin: 0; color: #666;">
                            🚀 سیستم کراول آماده اجرای بعدی است!<br>
                            می‌توانید دوباره اجرا کنید یا منتظر زمان‌بندی خودکار باشید.
                        </p>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 0 0 10px 10px; text-align: center; color: #666; font-size: 12px;">
                    <p style="margin: 0;">
                        این ایمیل خلاصه نهایی کراول دیوار است.<br>
                        تاریخ: ${new Date().toLocaleDateString('fa-IR')} - ساعت: ${new Date().toLocaleTimeString('fa-IR')}
                    </p>
                </div>
            </div>
        `;

        const mailOptions = {
            from: `"${emailSettings.from}" <${smtpConfig.auth.user}>`,
            to: emailSettings.to,
            subject: emailSubject,
            html: emailBody
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`📧 Final summary email sent successfully!`);
        
        return result;
        
    } catch (error) {
        console.error('❌ Error sending final summary email:', error.message);
        throw error;
    }
}

module.exports = {
    sendCrawlingReport,
    sendFinalSummaryEmail
};
