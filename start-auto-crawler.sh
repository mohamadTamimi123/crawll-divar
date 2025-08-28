#!/bin/bash

# Divar Auto-Crawler Startup Script
# این اسکریپت کراول خودکار را در سرور راه‌اندازی می‌کند

set -e

# رنگ‌ها برای خروجی
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# متغیرهای محیطی
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
LOG_FILE="$PROJECT_DIR/auto-crawler.log"
PID_FILE="$PROJECT_DIR/auto-crawler.pid"
NODE_BIN="$(which node)"
NPM_BIN="$(which npm)"

# توابع کمکی
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# بررسی پیش‌نیازها
check_prerequisites() {
    log_info "بررسی پیش‌نیازها..."
    
    # بررسی Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js نصب نشده است!"
        exit 1
    fi
    
    # بررسی npm
    if ! command -v npm &> /dev/null; then
        log_error "npm نصب نشده است!"
        exit 1
    fi
    
    # بررسی Chrome
    if ! command -v google-chrome &> /dev/null; then
        log_error "Google Chrome نصب نشده است!"
        exit 1
    fi
    
    # بررسی PostgreSQL
    if ! command -v psql &> /dev/null; then
        log_error "PostgreSQL نصب نشده است!"
        exit 1
    fi
    
    # بررسی دایرکتوری پروژه
    if [ ! -f "$PROJECT_DIR/package.json" ]; then
        log_error "فایل package.json یافت نشد!"
        exit 1
    fi
    
    log_success "همه پیش‌نیازها آماده است"
}

# نصب وابستگی‌ها
install_dependencies() {
    log_info "نصب وابستگی‌ها..."
    
    cd "$PROJECT_DIR"
    
    if [ ! -d "node_modules" ]; then
        log_info "نصب npm packages..."
        npm install
    else
        log_info "بررسی به‌روزرسانی npm packages..."
        npm update
    fi
    
    log_success "وابستگی‌ها نصب شدند"
}

# تنظیم دیتابیس
setup_database() {
    log_info "تنظیم دیتابیس..."
    
    cd "$PROJECT_DIR"
    
    # اجرای migrations
    log_info "اجرای database migrations..."
    npm run db:migrate
    
    # اجرای seeders
    log_info "اجرای database seeders..."
    npm run db:seed
    
    log_success "دیتابیس تنظیم شد"
}

# بررسی وضعیت سرویس
check_service_status() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0 # سرویس در حال اجرا است
        else
            rm -f "$PID_FILE"
            return 1 # سرویس متوقف شده است
        fi
    fi
    return 1 # فایل PID وجود ندارد
}

# شروع سرویس
start_service() {
    log_info "شروع کراول خودکار..."
    
    if check_service_status; then
        log_warning "سرویس قبلاً در حال اجرا است (PID: $(cat $PID_FILE))"
        return 0
    fi
    
    cd "$PROJECT_DIR"
    
    # شروع سرویس در پس‌زمینه
    nohup "$NODE_BIN" src/auto-crawler.js > "$LOG_FILE" 2>&1 &
    local pid=$!
    
    # ذخیره PID
    echo "$pid" > "$PID_FILE"
    
    # انتظار برای شروع
    sleep 3
    
    # بررسی وضعیت
    if kill -0 "$pid" 2>/dev/null; then
        log_success "کراول خودکار با موفقیت شروع شد (PID: $pid)"
        log_info "لاگ‌ها در فایل: $LOG_FILE"
        log_info "برای مشاهده لاگ‌ها: tail -f $LOG_FILE"
    else
        log_error "شروع سرویس ناموفق بود"
        rm -f "$PID_FILE"
        exit 1
    fi
}

# توقف سرویس
stop_service() {
    log_info "توقف کراول خودکار..."
    
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        
        if kill -0 "$pid" 2>/dev/null; then
            log_info "ارسال سیگنال توقف به PID: $pid"
            kill "$pid"
            
            # انتظار برای توقف
            local count=0
            while kill -0 "$pid" 2>/dev/null && [ $count -lt 30 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            # بررسی نهایی
            if kill -0 "$pid" 2>/dev/null; then
                log_warning "سرویس متوقف نشد، ارسال SIGKILL..."
                kill -9 "$pid"
            fi
            
            rm -f "$PID_FILE"
            log_success "سرویس متوقف شد"
        else
            log_warning "سرویس قبلاً متوقف شده است"
            rm -f "$PID_FILE"
        fi
    else
        log_warning "فایل PID یافت نشد"
    fi
}

# راه‌اندازی مجدد سرویس
restart_service() {
    log_info "راه‌اندازی مجدد کراول خودکار..."
    stop_service
    sleep 2
    start_service
}

# نمایش وضعیت
show_status() {
    log_info "وضعیت کراول خودکار:"
    echo "========================"
    
    if check_service_status; then
        local pid=$(cat "$PID_FILE")
        echo "✅ Status: Running"
        echo "🆔 PID: $pid"
        echo "📁 PID File: $PID_FILE"
        echo "📋 Log File: $LOG_FILE"
        
        # نمایش اطلاعات فرآیند
        if ps -p "$pid" > /dev/null; then
            echo "⏱️ Uptime: $(ps -o etime= -p $pid)"
            echo "💾 Memory: $(ps -o rss= -p $pid | awk '{print $1/1024 " MB"}')"
        fi
        
        # نمایش لاگ‌های اخیر
        if [ -f "$LOG_FILE" ]; then
            echo ""
            echo "📋 Recent logs (last 5 lines):"
            echo "----------------------------"
            tail -5 "$LOG_FILE" 2>/dev/null || echo "No logs available"
        fi
    else
        echo "❌ Status: Stopped"
        echo "📁 PID File: $PID_FILE"
        echo "📋 Log File: $LOG_FILE"
    fi
    
    echo "========================"
}

# نمایش لاگ‌ها
show_logs() {
    local lines=${1:-20}
    
    if [ -f "$LOG_FILE" ]; then
        log_info "نمایش $lines خط آخر لاگ‌ها:"
        echo "========================"
        tail -n "$lines" "$LOG_FILE"
        echo "========================"
    else
        log_warning "فایل لاگ یافت نشد"
    fi
}

# تست سرویس
test_service() {
    log_info "تست کراول خودکار (اجرای یکباره)..."
    
    cd "$PROJECT_DIR"
    
    # اجرای تست
    "$NODE_BIN" -e "
        require('./src/auto-crawler').performCrawl()
            .then(result => {
                console.log('✅ Test completed successfully!');
                console.log('Result:', result);
                process.exit(0);
            })
            .catch(error => {
                console.error('❌ Test failed:', error);
                process.exit(1);
            });
    "
}

# نمایش راهنما
show_help() {
    echo "🤖 Divar Auto-Crawler Management Script"
    echo "======================================"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  start     Start the auto-crawler service"
    echo "  stop      Stop the auto-crawler service"
    echo "  restart   Restart the auto-crawler service"
    echo "  status    Show service status"
    echo "  logs [n]  Show recent logs (default: 20 lines)"
    echo "  test      Test the auto-crawler (single run)"
    echo "  setup     Setup database and dependencies"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 status"
    echo "  $0 logs 50"
    echo "  $0 test"
    echo "  $0 setup"
    echo ""
    echo "Log file: $LOG_FILE"
    echo "PID file: $PID_FILE"
}

# تابع اصلی
main() {
    local command="${1:-help}"
    
    case "$command" in
        start)
            check_prerequisites
            install_dependencies
            start_service
            ;;
        stop)
            stop_service
            ;;
        restart)
            check_prerequisites
            restart_service
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2"
            ;;
        test)
            check_prerequisites
            install_dependencies
            test_service
            ;;
        setup)
            check_prerequisites
            install_dependencies
            setup_database
            log_success "Setup completed successfully!"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# اجرای تابع اصلی
main "$@"
