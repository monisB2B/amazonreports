// Chart.js configurations and functions

// Sales chart
let salesChart = null;

function updateSalesChart(dailySales) {
    const ctx = document.getElementById('sales-chart').getContext('2d');
    
    // Sort by date
    dailySales.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Prepare data
    const labels = dailySales.map(day => formatDate(day.date));
    const revenues = dailySales.map(day => parseFloat(day.revenue));
    const orders = dailySales.map(day => day.orders);
    
    // Destroy previous chart if it exists
    if (salesChart) {
        salesChart.destroy();
    }
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Revenue',
                    data: revenues,
                    borderColor: 'rgba(255, 153, 0, 1)',
                    backgroundColor: 'rgba(255, 153, 0, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Orders',
                    data: orders,
                    borderColor: 'rgba(52, 152, 219, 1)',
                    backgroundColor: 'rgba(52, 152, 219, 0)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Revenue ($)'
                    },
                    beginAtZero: true
                },
                y1: {
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Orders'
                    },
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.datasetIndex === 0) {
                                label += '$' + context.raw.toFixed(2);
                            } else {
                                label += context.raw;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Products chart
let productsChart = null;

function updateProductsChart(products) {
    const ctx = document.getElementById('products-chart').getContext('2d');
    
    // Sort by revenue
    products.sort((a, b) => b.revenue - a.revenue);
    
    // Take top 5
    const topProducts = products.slice(0, 5);
    
    // Prepare data
    const labels = topProducts.map(product => {
        // Truncate long names
        let name = product.title || product.sku;
        return name.length > 20 ? name.substring(0, 20) + '...' : name;
    });
    const revenues = topProducts.map(product => parseFloat(product.revenue));
    
    // Destroy previous chart if it exists
    if (productsChart) {
        productsChart.destroy();
    }
    
    productsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Revenue',
                    data: revenues,
                    backgroundColor: [
                        'rgba(255, 153, 0, 0.8)',
                        'rgba(52, 152, 219, 0.8)',
                        'rgba(46, 204, 113, 0.8)',
                        'rgba(155, 89, 182, 0.8)',
                        'rgba(231, 76, 60, 0.8)'
                    ],
                    borderWidth: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Revenue ($)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += '$' + context.raw.toFixed(2);
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Daily sales chart
let dailySalesChart = null;

function updateDailySalesChart(dailySales) {
    const ctx = document.getElementById('daily-sales-chart').getContext('2d');
    
    // Sort by date
    dailySales.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Prepare data
    const labels = dailySales.map(day => formatDate(day.date));
    const revenues = dailySales.map(day => parseFloat(day.revenue));
    const units = dailySales.map(day => day.units);
    
    // Destroy previous chart if it exists
    if (dailySalesChart) {
        dailySalesChart.destroy();
    }
    
    dailySalesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Revenue',
                    data: revenues,
                    backgroundColor: 'rgba(255, 153, 0, 0.8)',
                    borderColor: 'rgba(255, 153, 0, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Units',
                    data: units,
                    type: 'line',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    backgroundColor: 'rgba(52, 152, 219, 0)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Revenue ($)'
                    },
                    beginAtZero: true
                },
                y1: {
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Units'
                    },
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.datasetIndex === 0) {
                                label += '$' + context.raw.toFixed(2);
                            } else {
                                label += context.raw;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// P&L Chart
let plChart = null;

function updatePLChart(summary) {
    const ctx = document.getElementById('pl-chart').getContext('2d');
    
    // Prepare data
    const revenue = parseFloat(summary.totalRevenue);
    const fees = parseFloat(summary.totalFees);
    const refunds = parseFloat(summary.totalRefunds);
    const other = parseFloat(summary.totalOtherTransactions);
    const profit = parseFloat(summary.netProfit);
    
    // Destroy previous chart if it exists
    if (plChart) {
        plChart.destroy();
    }
    
    plChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Fees', 'Refunds', 'Other', 'Net Profit'],
            datasets: [
                {
                    data: [fees, refunds, other, profit],
                    backgroundColor: [
                        'rgba(231, 76, 60, 0.8)',
                        'rgba(241, 196, 15, 0.8)',
                        'rgba(52, 152, 219, 0.8)',
                        'rgba(46, 204, 113, 0.8)'
                    ],
                    borderWidth: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Total Revenue: $${revenue.toFixed(2)}`
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += '$' + context.raw.toFixed(2);
                            const percentage = (context.raw / revenue * 100).toFixed(1);
                            label += ` (${percentage}%)`;
                            return label;
                        }
                    }
                }
            }
        }
    });
    
    // Fake data for profit trend chart
    // In a real app, this would come from the API
    updateProfitTrendChart();
}

// Profit trend chart (for demo purposes with fake data)
let profitTrendChart = null;

function updateProfitTrendChart() {
    const ctx = document.getElementById('profit-trend-chart').getContext('2d');
    
    // Fake data for demonstration
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const profits = [2500, 3200, 2800, 3500, 4200, 3800];
    const margins = [15, 18, 16, 19, 22, 20];
    
    // Destroy previous chart if it exists
    if (profitTrendChart) {
        profitTrendChart.destroy();
    }
    
    profitTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Profit',
                    data: profits,
                    borderColor: 'rgba(46, 204, 113, 1)',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Margin %',
                    data: margins,
                    borderColor: 'rgba(52, 152, 219, 1)',
                    backgroundColor: 'rgba(52, 152, 219, 0)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Profit ($)'
                    },
                    beginAtZero: true
                },
                y1: {
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Margin (%)'
                    },
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.datasetIndex === 0) {
                                label += '$' + context.raw.toFixed(2);
                            } else {
                                label += context.raw + '%';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Helper function to format date
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
