# 🚀 راهنمای نصب سرویس Systemd برای کراول خودکار

## 🎯 **هدف**
نصب کراول خودکار دیوار به عنوان سرویس سیستم که به طور خودکار در بوت سیستم شروع می‌شود.

## 📋 **پیش‌نیازها**

### **1. سیستم عامل**:
- Ubuntu 18.04+ / Debian 9+
- CentOS 7+ / RHEL 7+
- سایر توزیع‌های Linux با systemd

### **2. نرم‌افزارهای مورد نیاز**:
- Node.js 16+
- PostgreSQL
- Google Chrome
- Git

### **3. دسترسی‌ها**:
- دسترسی sudo
- دسترسی به دایرکتوری پروژه

## 🔧 **مراحل نصب**

### **مرحله 1: کپی فایل سرویس**
```bash
# کپی فایل سرویس به systemd
sudo cp divar-auto-crawler.service /etc/systemd/system/

# یا برای محیط توسعه
sudo cp divar-auto-crawler.service /etc/systemd/system/divar-auto-crawler-dev.service
```

### **مرحله 2: تنظیم مجوزها**
```bash
# تنظیم مجوزهای مناسب
sudo chmod 644 /etc/systemd/system/divar-auto-crawler.service

# مالکیت فایل
sudo chown root:root /etc/systemd/system/divar-auto-crawler.service
```

### **مرحله 3: تنظیم متغیرهای محیطی**
```bash
# ویرایش فایل سرویس
sudo nano /etc/systemd/system/divar-auto-crawler.service

# تغییر مقادیر زیر:
Environment=DB_HOST=localhost
Environment=DB_PORT=5432
Environment=DB_NAME=divar_crawler_db
Environment=DB_USER=your_db_user
Environment=DB_PASS=your_db_password
Environment=NODE_ENV=production
```

### **مرحله 4: تنظیم مسیرها**
```bash
# تغییر مسیرهای زیر در فایل سرویس:
WorkingDirectory=/path/to/your/project
ExecStart=/usr/bin/node /path/to/your/project/src/auto-crawler.js
ReadWritePaths=/path/to/your/project/output
ReadWritePaths=/path/to/your/project/backups
```

### **مرحله 5: بارگذاری مجدد systemd**
```bash
# بارگذاری مجدد systemd
sudo systemctl daemon-reload

# فعال‌سازی سرویس
sudo systemctl enable divar-auto-crawler.service

# شروع سرویس
sudo systemctl start divar-auto-crawler.service
```

## 🚀 **مدیریت سرویس**

### **دستورات اصلی**:
```bash
# شروع سرویس
sudo systemctl start divar-auto-crawler.service

# توقف سرویس
sudo systemctl stop divar-auto-crawler.service

# راه‌اندازی مجدد سرویس
sudo systemctl restart divar-auto-crawler.service

# بررسی وضعیت سرویس
sudo systemctl status divar-auto-crawler.service

# فعال‌سازی سرویس (شروع خودکار در بوت)
sudo systemctl enable divar-auto-crawler.service

# غیرفعال‌سازی سرویس
sudo systemctl disable divar-auto-crawler.service
```

### **مشاهده لاگ‌ها**:
```bash
# مشاهده لاگ‌های سرویس
sudo journalctl -u divar-auto-crawler.service -f

# مشاهده لاگ‌های اخیر
sudo journalctl -u divar-auto-crawler.service -n 100

# مشاهده لاگ‌های امروز
sudo journalctl -u divar-auto-crawler.service --since today

# مشاهده لاگ‌های با خطا
sudo journalctl -u divar-auto-crawler.service -p err
```

## ⚙️ **تنظیمات پیشرفته**

### **1. تنظیم مجدد منابع**:
```bash
# ویرایش فایل سرویس
sudo nano /etc/systemd/system/divar-auto-crawler.service

# تنظیم محدودیت حافظه
MemoryMax=2G

# تنظیم محدودیت CPU
CPUQuota=50%

# تنظیم محدودیت فایل‌های باز
LimitNOFILE=65536
```

### **2. تنظیمات امنیتی**:
```bash
# محدودیت دسترسی‌ها
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true

# مسیرهای قابل نوشتن
ReadWritePaths=/path/to/output
ReadWritePaths=/path/to/backups
```

### **3. تنظیمات شبکه**:
```bash
# وابستگی به سرویس‌های شبکه
After=network.target postgresql.service
Wants=postgresql.service

# تنظیمات فایروال (در صورت نیاز)
# sudo ufw allow from 127.0.0.1 to any port 5432
```

## 🔍 **عیب‌یابی**

### **مشکلات رایج**:

#### **1. سرویس شروع نمی‌شود**:
```bash
# بررسی وضعیت
sudo systemctl status divar-auto-crawler.service

# بررسی لاگ‌ها
sudo journalctl -u divar-auto-crawler.service -n 50

# بررسی مجوزها
ls -la /etc/systemd/system/divar-auto-crawler.service
```

#### **2. خطای دیتابیس**:
```bash
# بررسی اتصال دیتابیس
sudo -u postgres psql -c "SELECT version();"

# بررسی متغیرهای محیطی
sudo systemctl show divar-auto-crawler.service | grep Environment
```

#### **3. خطای Chrome**:
```bash
# بررسی نصب Chrome
which google-chrome

# بررسی مجوزهای کاربر
sudo -u tmp google-chrome --version

# تنظیم مجدد مجوزها
sudo chown -R tmp:tmp /home/tmp/.config/google-chrome
```

#### **4. خطای مجوزها**:
```bash
# بررسی مجوزهای دایرکتوری
ls -la /path/to/your/project

# تنظیم مجوزهای مناسب
sudo chown -R tmp:tmp /path/to/your/project
sudo chmod -R 755 /path/to/your/project
```

## 📊 **نظارت و مانیتورینگ**

### **1. بررسی وضعیت سرویس**:
```bash
# وضعیت کلی
sudo systemctl status divar-auto-crawler.service

# آمار سرویس
sudo systemctl show divar-auto-crawler.service
```

### **2. بررسی منابع مصرفی**:
```bash
# مصرف حافظه و CPU
sudo systemctl show divar-auto-crawler.service | grep -E "(Memory|CPU)"

# مشاهده فرآیند
ps aux | grep auto-crawler
```

### **3. بررسی لاگ‌ها**:
```bash
# لاگ‌های زنده
sudo journalctl -u divar-auto-crawler.service -f

# لاگ‌های با خطا
sudo journalctl -u divar-auto-crawler.service -p err --since "1 hour ago"
```

## 🔄 **به‌روزرسانی سرویس**

### **1. توقف سرویس**:
```bash
sudo systemctl stop divar-auto-crawler.service
```

### **2. به‌روزرسانی کد**:
```bash
cd /path/to/your/project
git pull origin main
npm install
```

### **3. راه‌اندازی مجدد سرویس**:
```bash
sudo systemctl start divar-auto-crawler.service
sudo systemctl status divar-auto-crawler.service
```

## 🛡️ **امنیت**

### **1. محدودیت دسترسی‌ها**:
- سرویس فقط به دایرکتوری‌های مورد نیاز دسترسی دارد
- اجرا با کاربر غیر root
- محدودیت منابع سیستم

### **2. لاگ‌گیری**:
- تمام فعالیت‌ها در journalctl ثبت می‌شود
- امکان بررسی لاگ‌ها برای امنیت

### **3. به‌روزرسانی‌ها**:
- به‌روزرسانی منظم سیستم
- به‌روزرسانی Node.js و npm

## 📝 **نمونه فایل سرویس کامل**

```ini
[Unit]
Description=Divar Auto-Crawler Service
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=tmp
Group=tmp
WorkingDirectory=/home/tmp/Documents/divar-crawler/crawller/js/back
ExecStart=/usr/bin/node src/auto-crawler.js
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=divar-auto-crawler

Environment=NODE_ENV=production
Environment=DB_HOST=localhost
Environment=DB_PORT=5432
Environment=DB_NAME=divar_crawler_db
Environment=DB_USER=your_user
Environment=DB_PASS=your_password

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/home/tmp/Documents/divar-crawler/crawller/js/back/output
ReadWritePaths=/home/tmp/Documents/divar-crawler/crawller/js/back/backups

LimitNOFILE=65536
LimitNPROC=4096
MemoryMax=2G
CPUQuota=50%

[Install]
WantedBy=multi-user.target
```

## ✅ **تست نهایی**

### **1. بررسی وضعیت سرویس**:
```bash
sudo systemctl status divar-auto-crawler.service
```

### **2. بررسی لاگ‌ها**:
```bash
sudo journalctl -u divar-auto-crawler.service -f
```

### **3. تست عملکرد**:
```bash
# بررسی آگهی‌های جدید در دیتابیس
# بررسی ایمیل‌های ارسالی
# بررسی فایل‌های پشتیبان
```

## 🎉 **نتیجه‌گیری**

سرویس کراول خودکار دیوار:
- ✅ **خودکار** در بوت سیستم شروع می‌شود
- ✅ **پایدار** و قابل اعتماد است
- ✅ **امن** و محدود شده است
- ✅ **قابل نظارت** و مدیریت است
- ✅ **قابل به‌روزرسانی** است

## 🚀 **آماده استفاده!**

```bash
sudo systemctl start divar-auto-crawler.service
sudo systemctl enable divar-auto-crawler.service
```

سرویس شروع به کار می‌کند و هر ساعت آگهی‌های جدید را کراول می‌کند! 🎯
