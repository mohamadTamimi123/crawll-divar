# 📧 راهنمای تنظیم سرویس ایمیل

## 🔧 تنظیمات SMTP

### **فایل کانفیگ**: `src/config/email.js`

```javascript
module.exports = {
    smtp: {
        host: 'sandbox.smtp.mailtrap.io',      // سرور SMTP
        port: 2525,                            // پورت SMTP
        secure: false,                         // امنیت (false برای پورت 2525)
        auth: {
            user: '5553cdd649cb3e',            // نام کاربری SMTP
            pass: 'cf627578b4736b'             // رمز عبور SMTP
        }
    },
    email: {
        from: 'Divar Crawler',                 // نام فرستنده
        to: 'your-email@example.com'           // ایمیل گیرنده
    }
};
```

## 📋 مراحل تنظیم

### **1. تنظیم SMTP**:
- **Host**: آدرس سرور SMTP
- **Port**: پورت SMTP (معمولاً 587 یا 465)
- **Secure**: `true` برای پورت 465، `false` برای سایر پورت‌ها
- **User**: نام کاربری SMTP
- **Pass**: رمز عبور SMTP

### **2. تنظیم ایمیل**:
- **From**: نام نمایشی فرستنده
- **To**: ایمیل گیرنده (ایمیل شما)

## 🚀 سرویس‌های SMTP رایج

### **Gmail**:
```javascript
smtp: {
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password'  // رمز اپلیکیشن، نه رمز اصلی
    }
}
```

### **Outlook/Hotmail**:
```javascript
smtp: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
        user: 'your-email@outlook.com',
        pass: 'your-password'
    }
}
```

### **Yahoo**:
```javascript
smtp: {
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
    auth: {
        user: 'your-email@yahoo.com',
        pass: 'your-app-password'
    }
}
```

### **Mailtrap (برای تست)**:
```javascript
smtp: {
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    secure: false,
    auth: {
        user: 'your-mailtrap-user',
        pass: 'your-mailtrap-pass'
    }
}
```

## 🔒 نکات امنیتی

### **1. رمزهای اپلیکیشن**:
- برای Gmail از **رمز اپلیکیشن** استفاده کنید
- رمز اصلی حساب را وارد نکنید

### **2. پورت‌های امن**:
- **465**: SSL/TLS (secure: true)
- **587**: STARTTLS (secure: false)
- **2525**: معمولی (secure: false)

### **3. تست ایمیل**:
```bash
node src/test-email.js
```

## 📧 انواع ایمیل‌های ارسالی

### **1. ایمیل گزارش کراول**:
- بعد از هر شهر/نوع آگهی
- شامل: آمار کراول، مدت زمان، آگهی‌های جدید

### **2. ایمیل خلاصه نهایی**:
- بعد از اتمام تمام کراول‌ها
- شامل: آمار کلی، وضعیت نهایی

## 🛠️ عیب‌یابی

### **خطای "Authentication failed"**:
- نام کاربری و رمز عبور را چک کنید
- برای Gmail، رمز اپلیکیشن استفاده کنید

### **خطای "Connection timeout"**:
- پورت و host را چک کنید
- فایروال و آنتی‌ویروس را بررسی کنید

### **خطای "No recipients defined"**:
- ایمیل گیرنده را در کانفیگ تنظیم کنید

## 📝 مثال کامل

```javascript
// src/config/email.js
module.exports = {
    smtp: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'your-email@gmail.com',
            pass: 'your-app-password'
        }
    },
    email: {
        from: 'Divar Crawler System',
        to: 'your-email@gmail.com'
    }
};
```

## ✅ تست نهایی

بعد از تنظیم، سرویس را تست کنید:

```bash
node src/test-email.js
```

اگر پیام‌های موفقیت‌آمیز دریافت کردید، تنظیمات درست است! 🎉
