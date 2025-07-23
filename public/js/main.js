// Main JavaScript for the Amazon Reports Dashboard

// DOM Elements
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section');
const dateRangeSelector = document.getElementById('date-range');
const customDateRange = document.getElementById('custom-date-range');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const applyDatesBtn = document.getElementById('apply-dates');
const reportTypeSelector = document.getElementById('report-type');
const generateReportBtn = document.getElementById('generate-report');
const generateAllReportsBtn = document.getElementById('generate-all-reports');

// Current date range state
let currentDateRange = {
    period: 'last30days',
    startDate: null,
    endDate: null
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default for date inputs
    const today = new Date().toISOString().split('T')[0];
    startDateInput.value = today;
    endDateInput.value = today;
    
    // Initialize navigation
    initNavigation();
    
    // Initialize date range selector
    initDateRangeSelector();
    
    // Load report types
    loadReportTypes();
    
    // Load initial dashboard data
    loadDashboardData();
});

// Initialize navigation
function initNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(item => item.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show the corresponding section
            const targetSection = this.getAttribute('data-section');
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                    // Load section-specific data
                    loadSectionData(targetSection);
                }
            });
        });
    });
}

// Initialize date range selector
function initDateRangeSelector() {
    dateRangeSelector.addEventListener('change', function() {
        const selectedValue = this.value;
        
        if (selectedValue === 'custom') {
            customDateRange.style.display = 'block';
        } else {
            customDateRange.style.display = 'none';
            
            // Update current date range
            currentDateRange.period = selectedValue;
            currentDateRange.startDate = null;
            currentDateRange.endDate = null;
            
            // Reload data for the active section
            const activeSection = document.querySelector('section.active');
            if (activeSection) {
                loadSectionData(activeSection.id);
            }
        }
    });
    
    // Apply custom date range
    applyDatesBtn.addEventListener('click', function() {
        if (startDateInput.value && endDateInput.value) {
            // Update current date range
            currentDateRange.period = 'custom';
            currentDateRange.startDate = startDateInput.value;
            currentDateRange.endDate = endDateInput.value;
            
            // Hide custom date range
            customDateRange.style.display = 'none';
            
            // Reload data for the active section
            const activeSection = document.querySelector('section.active');
            if (activeSection) {
                loadSectionData(activeSection.id);
            }
        }
    });
    
    // Initialize report date range selector
    document.getElementById('report-date-range').addEventListener('change', function() {
        const selectedValue = this.value;
        const reportCustomDateRange = document.getElementById('report-custom-date-range');
        
        if (selectedValue === 'custom') {
            reportCustomDateRange.style.display = 'block';
        } else {
            reportCustomDateRange.style.display = 'none';
        }
    });
    
    // Initialize the date inputs with reasonable defaults
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById('report-start-date').value = formatDate(thirtyDaysAgo);
    document.getElementById('report-end-date').value = formatDate(today);
    startDateInput.value = formatDate(thirtyDaysAgo);
    endDateInput.value = formatDate(today);
}

// Load report types from the API
function loadReportTypes() {
    fetch('/api/reports/types')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch report types');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.reportTypes) {
                const reportTypeSelector = document.getElementById('report-type');
                
                // Clear existing options except the first one
                while (reportTypeSelector.options.length > 1) {
                    reportTypeSelector.remove(1);
                }
                
                // Add report types
                data.reportTypes.forEach(reportType => {
                    const option = document.createElement('option');
                    option.value = reportType.id;
                    option.textContent = reportType.name;
                    reportTypeSelector.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading report types:', error);
        });
}

// Generate report
generateReportBtn.addEventListener('click', function() {
    const reportType = reportTypeSelector.value;
    const dateRangePeriod = document.getElementById('report-date-range').value;
    let startDate = null;
    let endDate = null;
    
    if (dateRangePeriod === 'custom') {
        startDate = document.getElementById('report-start-date').value;
        endDate = document.getElementById('report-end-date').value;
        
        if (!startDate || !endDate) {
            alert('Please select start and end dates');
            return;
        }
    }
    
    if (!reportType) {
        alert('Please select a report type');
        return;
    }
    
    // Show report status
    const reportStatus = document.getElementById('report-status');
    reportStatus.style.display = 'block';
    reportStatus.textContent = 'Generating report... This may take a while.';
    
    // Send request to generate report
    fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            reportType,
            period: dateRangePeriod,
            startDate,
            endDate
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to generate report');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            reportStatus.textContent = 'Report generated successfully!';
            reportStatus.style.backgroundColor = '#d4edda';
            reportStatus.style.borderLeftColor = '#28a745';
            
            // Reload reports list
            setTimeout(() => {
                reportStatus.style.display = 'none';
                // Here you'd load the reports list
            }, 3000);
        }
    })
    .catch(error => {
        console.error('Error generating report:', error);
        reportStatus.textContent = `Error: ${error.message}`;
        reportStatus.style.backgroundColor = '#f8d7da';
        reportStatus.style.borderLeftColor = '#dc3545';
    });
});

// Generate all reports
generateAllReportsBtn.addEventListener('click', function() {
    const dateRangePeriod = document.getElementById('report-date-range').value;
    let startDate = null;
    let endDate = null;
    
    if (dateRangePeriod === 'custom') {
        startDate = document.getElementById('report-start-date').value;
        endDate = document.getElementById('report-end-date').value;
        
        if (!startDate || !endDate) {
            alert('Please select start and end dates');
            return;
        }
    }
    
    // Confirm generation
    if (!confirm('This will generate all report types and may take a significant amount of time. Continue?')) {
        return;
    }
    
    // Show report status
    const reportStatus = document.getElementById('report-status');
    reportStatus.style.display = 'block';
    reportStatus.textContent = 'Generating all reports... This may take a significant amount of time.';
    
    // Send request to generate all reports
    fetch('/api/reports/generate-all', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            period: dateRangePeriod,
            startDate,
            endDate
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to initiate report generation');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            reportStatus.textContent = 'Report generation started. This may take a while.';
            reportStatus.style.backgroundColor = '#fff3cd';
            reportStatus.style.borderLeftColor = '#ffc107';
        }
    })
    .catch(error => {
        console.error('Error generating reports:', error);
        reportStatus.textContent = `Error: ${error.message}`;
        reportStatus.style.backgroundColor = '#f8d7da';
        reportStatus.style.borderLeftColor = '#dc3545';
    });
});

// Load section-specific data
function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'sales':
            loadSalesData();
            break;
        case 'inventory':
            loadInventoryData();
            break;
        case 'finance':
            loadFinanceData();
            break;
        case 'returns':
            loadReturnsData();
            break;
        case 'reports':
            // Nothing to load here
            break;
    }
}

// Load dashboard data
function loadDashboardData() {
    // Load financial summary
    fetch(`/api/finance/summary?period=${currentDateRange.period}&startDate=${currentDateRange.startDate || ''}&endDate=${currentDateRange.endDate || ''}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch financial summary');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.summary) {
                document.getElementById('total-sales').textContent = formatCurrency(data.summary.revenue);
                document.getElementById('net-profit').textContent = formatCurrency(data.summary.netProfit);
                document.getElementById('total-returns').textContent = data.summary.returns;
            }
        })
        .catch(error => {
            console.error('Error loading financial summary:', error);
        });
    
    // Load sales data for chart
    fetch(`/api/sales/by-day?period=${currentDateRange.period}&startDate=${currentDateRange.startDate || ''}&endDate=${currentDateRange.endDate || ''}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch sales data');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.dailySales) {
                updateSalesChart(data.dailySales);
                
                // Count total orders
                let totalOrders = 0;
                data.dailySales.forEach(day => {
                    totalOrders += day.orders;
                });
                document.getElementById('total-orders').textContent = totalOrders;
            }
        })
        .catch(error => {
            console.error('Error loading sales data:', error);
        });
    
    // Load top products data for chart
    fetch(`/api/sales/by-product?period=${currentDateRange.period}&startDate=${currentDateRange.startDate || ''}&endDate=${currentDateRange.endDate || ''}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch product data');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.products) {
                updateProductsChart(data.products);
            }
        })
        .catch(error => {
            console.error('Error loading product data:', error);
        });
}

// Load sales data
function loadSalesData() {
    // Load daily sales
    fetch(`/api/sales/by-day?period=${currentDateRange.period}&startDate=${currentDateRange.startDate || ''}&endDate=${currentDateRange.endDate || ''}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch daily sales data');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.dailySales) {
                updateDailySalesChart(data.dailySales);
            }
        })
        .catch(error => {
            console.error('Error loading daily sales data:', error);
        });
    
    // Load top products
    fetch(`/api/sales/by-product?period=${currentDateRange.period}&startDate=${currentDateRange.startDate || ''}&endDate=${currentDateRange.endDate || ''}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch product data');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.products) {
                updateTopProductsTable(data.products);
            }
        })
        .catch(error => {
            console.error('Error loading product data:', error);
        });
}

// Load inventory data
function loadInventoryData() {
    // Load inventory summary
    fetch('/api/inventory/summary')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch inventory summary');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.summary) {
                document.getElementById('total-units').textContent = data.summary.totalUnits;
                document.getElementById('inventory-value').textContent = formatCurrency(data.summary.totalValue);
                document.getElementById('unique-skus').textContent = data.summary.uniqueSkus;
            }
        })
        .catch(error => {
            console.error('Error loading inventory summary:', error);
        });
    
    // Load low stock items
    fetch('/api/inventory/low-stock?threshold=5')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch low stock items');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.lowStockItems) {
                updateLowStockTable(data.lowStockItems);
                document.getElementById('low-stock-count').textContent = data.lowStockItems.length;
            }
        })
        .catch(error => {
            console.error('Error loading low stock items:', error);
        });
}

// Load finance data
function loadFinanceData() {
    // Load profit and loss data
    fetch(`/api/finance/profit-loss?period=${currentDateRange.period}&startDate=${currentDateRange.startDate || ''}&endDate=${currentDateRange.endDate || ''}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch profit and loss data');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.report && data.report.summary) {
                const summary = data.report.summary;
                document.getElementById('total-revenue').textContent = formatCurrency(summary.totalRevenue);
                document.getElementById('total-fees').textContent = formatCurrency(summary.totalFees);
                document.getElementById('finance-profit').textContent = formatCurrency(summary.netProfit);
                document.getElementById('profit-margin').textContent = summary.profitMargin;
                
                updatePLChart(summary);
            }
        })
        .catch(error => {
            console.error('Error loading profit and loss data:', error);
        });
}

// Load returns data
function loadReturnsData() {
    // Load returns and reimbursements data
    fetch(`/api/finance/returns-reimbursements?period=${currentDateRange.period}&startDate=${currentDateRange.startDate || ''}&endDate=${currentDateRange.endDate || ''}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch returns data');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.report && data.report.summary) {
                const summary = data.report.summary;
                document.getElementById('returns-count').textContent = summary.totalReturns;
                document.getElementById('returns-value').textContent = formatCurrency(summary.totalReturnValue);
                document.getElementById('reimbursements-count').textContent = summary.totalReimbursements;
                document.getElementById('reimbursements-value').textContent = formatCurrency(summary.totalReimbursementValue);
                
                if (data.report.data) {
                    updateReturnsTable(data.report.data);
                }
            }
        })
        .catch(error => {
            console.error('Error loading returns data:', error);
        });
}

// Update low stock table
function updateLowStockTable(items) {
    const table = document.getElementById('low-stock-items');
    const tbody = table.querySelector('tbody');
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    if (items.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.setAttribute('colspan', '5');
        cell.textContent = 'No low stock items found';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }
    
    // Add items to table
    items.forEach(item => {
        const row = document.createElement('tr');
        
        const skuCell = document.createElement('td');
        skuCell.textContent = item.sku;
        row.appendChild(skuCell);
        
        const asinCell = document.createElement('td');
        asinCell.textContent = item.asin;
        row.appendChild(asinCell);
        
        const titleCell = document.createElement('td');
        titleCell.textContent = item.title;
        row.appendChild(titleCell);
        
        const quantityCell = document.createElement('td');
        quantityCell.textContent = item.quantity;
        row.appendChild(quantityCell);
        
        const priceCell = document.createElement('td');
        priceCell.textContent = formatCurrency(item.price);
        row.appendChild(priceCell);
        
        tbody.appendChild(row);
    });
}

// Update top products table
function updateTopProductsTable(products) {
    const table = document.getElementById('top-products');
    const tbody = table.querySelector('tbody');
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    if (products.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.setAttribute('colspan', '4');
        cell.textContent = 'No product data found';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }
    
    // Add products to table
    products.forEach(product => {
        const row = document.createElement('tr');
        
        const skuCell = document.createElement('td');
        skuCell.textContent = product.sku;
        row.appendChild(skuCell);
        
        const titleCell = document.createElement('td');
        titleCell.textContent = product.title;
        row.appendChild(titleCell);
        
        const unitsCell = document.createElement('td');
        unitsCell.textContent = product.units;
        row.appendChild(unitsCell);
        
        const revenueCell = document.createElement('td');
        revenueCell.textContent = formatCurrency(product.revenue);
        row.appendChild(revenueCell);
        
        tbody.appendChild(row);
    });
}

// Update returns table
function updateReturnsTable(returns) {
    const table = document.getElementById('recent-returns');
    const tbody = table.querySelector('tbody');
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    if (returns.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.setAttribute('colspan', '5');
        cell.textContent = 'No returns data found';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }
    
    // Add returns to table (max 10)
    returns.slice(0, 10).forEach(item => {
        const row = document.createElement('tr');
        
        const orderCell = document.createElement('td');
        orderCell.textContent = item['order-id'] || 'N/A';
        row.appendChild(orderCell);
        
        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate(new Date(item['return-date'] || item['date']));
        row.appendChild(dateCell);
        
        const skuCell = document.createElement('td');
        skuCell.textContent = item['sku'] || 'N/A';
        row.appendChild(skuCell);
        
        const reasonCell = document.createElement('td');
        reasonCell.textContent = item['return-reason'] || 'N/A';
        row.appendChild(reasonCell);
        
        const amountCell = document.createElement('td');
        amountCell.textContent = formatCurrency(item['item-price'] || 0);
        row.appendChild(amountCell);
        
        tbody.appendChild(row);
    });
}

// Helper function to format currency
function formatCurrency(value) {
    return '$' + parseFloat(value).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Helper function to format date
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Helper function to get Y-M-D date string
function formatDateYMD(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}
