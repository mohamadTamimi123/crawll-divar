// Dashboard JavaScript functionality

class Dashboard {
    constructor() {
        this.currentPage = 1;
        this.currentLimit = 50;
        this.currentFilters = {
            city: '',
            adType: ''
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCities();
        this.loadAds();
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 1000);
    }

    setupEventListeners() {
        document.getElementById('apply-filters').addEventListener('click', () => {
            this.currentPage = 1;
            this.loadAds();
        });

        document.getElementById('city-filter').addEventListener('change', (e) => {
            this.currentFilters.city = e.target.value;
        });

        document.getElementById('ad-type-filter').addEventListener('change', (e) => {
            this.currentFilters.adType = e.target.value;
        });

        document.getElementById('limit-filter').addEventListener('change', (e) => {
            this.currentLimit = parseInt(e.target.value);
            this.currentPage = 1;
            this.loadAds();
        });
    }

    async loadCities() {
        try {
            const response = await fetch('/api/cities');
            const cities = await response.json();
            
            const cityFilter = document.getElementById('city-filter');
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city.id;
                option.textContent = city.display_name;
                cityFilter.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading cities:', error);
        }
    }

    async loadAds() {
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.currentLimit,
                city: this.currentFilters.city,
                adType: this.currentFilters.adType
            });

            const response = await fetch(`/api/ads?${params}`);
            const data = await response.json();
            
            this.renderAds(data.ads);
            this.renderPagination(data.pagination);
            this.updateStats(data.pagination);
            
        } catch (error) {
            console.error('Error loading ads:', error);
            this.showError('خطا در بارگذاری آگهی‌ها');
        }
    }

    renderAds(ads) {
        const tbody = document.getElementById('ads-table-body');
        
        if (ads.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted">
                        <i class="fas fa-inbox fa-2x mb-2"></i>
                        <br>
                        آگهی‌ای یافت نشد
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = ads.map(ad => `
            <tr>
                <td class="text-center">
                    <span class="badge bg-secondary">${ad.id}</span>
                </td>
                <td>
                    <div class="fw-bold">${this.truncateText(ad.title, 50)}</div>
                    <small class="text-muted">
                        <a href="${ad.link}" target="_blank" class="text-decoration-none">
                            <i class="fas fa-external-link-alt me-1"></i>
                            مشاهده در دیوار
                        </a>
                    </small>
                </td>
                <td class="text-center">
                    <span class="badge bg-primary">${ad.city?.display_name || 'نامشخص'}</span>
                </td>
                <td class="text-center">
                    <span class="badge ${this.getAdTypeBadgeClass(ad.adType)}">
                        ${this.getAdTypeDisplayName(ad.adType)}
                    </span>
                </td>
                <td class="text-center">
                    <small>${this.formatDate(ad.createdAt)}</small>
                </td>
                <td class="text-center">
                    ${ad.details ? 
                        '<span class="badge bg-success"><i class="fas fa-check me-1"></i>دارد</span>' : 
                        '<span class="badge bg-warning"><i class="fas fa-clock me-1"></i>در انتظار</span>'
                    }
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary" onclick="dashboard.showAdDetails(${ad.id})">
                        <i class="fas fa-eye me-1"></i>
                        جزئیات
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderPagination(pagination) {
        const paginationElement = document.getElementById('pagination');
        
        if (pagination.totalPages <= 1) {
            paginationElement.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${pagination.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="dashboard.goToPage(${pagination.currentPage - 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(1, pagination.currentPage - 2);
        const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === pagination.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="dashboard.goToPage(${i})">${i}</a>
                </li>
            `;
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="dashboard.goToPage(${pagination.currentPage + 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        paginationElement.innerHTML = paginationHTML;
    }

    updateStats(pagination) {
        document.getElementById('showing-start').textContent = ((pagination.currentPage - 1) * pagination.itemsPerPage) + 1;
        document.getElementById('showing-end').textContent = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);
        document.getElementById('total-items').textContent = pagination.totalItems;
    }

    async showAdDetails(adId) {
        try {
            const response = await fetch(`/api/ads/${adId}`);
            const ad = await response.json();
            
            const modal = new bootstrap.Modal(document.getElementById('adDetailsModal'));
            const content = document.getElementById('ad-details-content');
            
            content.innerHTML = this.renderAdDetailsContent(ad);
            modal.show();
            
        } catch (error) {
            console.error('Error loading ad details:', error);
            alert('خطا در بارگذاری جزئیات آگهی');
        }
    }

    renderAdDetailsContent(ad) {
        const details = ad.details || {};
        
        return `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="fw-bold">اطلاعات اصلی</h6>
                    <table class="table table-sm">
                        <tr><td>عنوان:</td><td>${ad.title}</td></tr>
                        <tr><td>شهر:</td><td>${ad.city?.display_name || 'نامشخص'}</td></tr>
                        <tr><td>نوع:</td><td>${this.getAdTypeDisplayName(ad.adType)}</td></tr>
                        <tr><td>تاریخ ثبت:</td><td>${this.formatDate(ad.createdAt)}</td></tr>
                        <tr><td>لینک:</td><td><a href="${ad.link}" target="_blank">مشاهده در دیوار</a></td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6 class="fw-bold">جزئیات فنی</h6>
                    <table class="table table-sm">
                        <tr><td>متراژ:</td><td>${details.metraj || 'نامشخص'} متر</td></tr>
                        <tr><td>سال ساخت:</td><td>${details.sal_sakht || 'نامشخص'}</td></tr>
                        <tr><td>تعداد اتاق:</td><td>${details.otagh || 'نامشخص'}</td></tr>
                        <tr><td>طبقه:</td><td>${details.tabaghe || 'نامشخص'}</td></tr>
                        <tr><td>پارکینگ:</td><td>${details.parking ? 'دارد' : 'ندارد'}</td></tr>
                        <tr><td>آسانسور:</td><td>${details.asansor ? 'دارد' : 'ندارد'}</td></tr>
                        <tr><td>انباری:</td><td>${details.anbari ? 'دارد' : 'ندارد'}</td></tr>
                    </table>
                </div>
            </div>
            ${details.tozihat ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <h6 class="fw-bold">توضیحات</h6>
                        <p class="text-muted">${details.tozihat}</p>
                    </div>
                </div>
            ` : ''}
            ${details.location ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <h6 class="fw-bold">موقعیت</h6>
                        <p class="text-muted">${details.location}</p>
                    </div>
                </div>
            ` : ''}
        `;
    }

    goToPage(page) {
        if (page < 1) return;
        this.currentPage = page;
        this.loadAds();
    }

    showLoading() {
        const tbody = document.getElementById('ads-table-body');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    <div class="loading-spinner"></div>
                    <br>
                    در حال بارگذاری...
                </td>
            </tr>
        `;
    }

    showError(message) {
        const tbody = document.getElementById('ads-table-body');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <br>
                    ${message}
                </td>
            </tr>
        `;
    }

    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('fa-IR');
        document.getElementById('current-time').textContent = timeString;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    getAdTypeBadgeClass(adType) {
        switch (adType) {
            case 'rent-apartment': return 'bg-success';
            case 'buy-apartment': return 'bg-info';
            default: return 'bg-secondary';
        }
    }

    getAdTypeDisplayName(adType) {
        switch (adType) {
            case 'rent-apartment': return 'اجاره آپارتمان';
            case 'buy-apartment': return 'فروش آپارتمان';
            default: return adType;
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'نامشخص';
        const date = new Date(dateString);
        return date.toLocaleDateString('fa-IR');
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});
