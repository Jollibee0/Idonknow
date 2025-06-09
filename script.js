// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const lastUpdated = document.getElementById('last-updated');
const weatherContainer = document.getElementById('weather-container');
const inventoryContainer = document.getElementById('inventory-container');
const categoryTabs = document.getElementById('category-tabs');
const categorySelect = document.getElementById('category-select');
const searchInput = document.getElementById('search-input');

// Chart instances
let valueChart, categoryChart;

// Theme toggle
themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
});

// Check for saved theme preference
if (localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
}

// API Endpoints
const API_ENDPOINTS = {
    stocks: 'https://kenlie.top/api/gag/stocks/',
    weather: 'https://kenlie.top/api/gag/weather/'
};

// Fetch data from API
async function fetchData(endpoint) {
    try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// Format timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString();
}

// Update last updated time
function updateLastUpdated() {
    const now = new Date();
    lastUpdated.textContent = now.toLocaleString();
}

// Render weather data
function renderWeather(data) {
    if (!data) {
        weatherContainer.innerHTML = '<div class="text-red-500">Failed to load weather data</div>';
        return;
    }

    let html = '';
    
    // Sort weather conditions by active status (active first)
    const sortedWeather = [...data].sort((a, b) => (b.active === a.active) ? 0 : b.active ? -1 : 1);
    
    sortedWeather.forEach(condition => {
        const isActive = condition.active;
        const lastSeen = formatTimestamp(condition.lastSeen);
        
        html += `
            <div class="flex items-center justify-between p-3 rounded-lg ${isActive ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'}">
                <div class="flex items-center space-x-3">
                    <div class="text-2xl ${isActive ? 'text-blue-500' : 'text-gray-400'}">
                        ${getWeatherIcon(condition.name)}
                    </div>
                    <div>
                        <h3 class="font-medium capitalize">${condition.name.replace(/([A-Z])/g, ' $1').trim()}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Last seen: ${lastSeen}</p>
                    </div>
                </div>
                <span class="px-2 py-1 text-xs rounded-full ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}">
                    ${isActive ? 'Active' : 'Inactive'}
                </span>
            </div>
        `;
    });
    
    weatherContainer.innerHTML = html || '<div class="text-gray-500">No weather data available</div>';
}

// Get weather icon based on condition name
function getWeatherIcon(conditionName) {
    const icons = {
        rain: 'fa-cloud-rain',
        frost: 'fa-snowflake',
        thunderstorm: 'fa-bolt',
        sunny: 'fa-sun',
        cloudy: 'fa-cloud',
        windy: 'fa-wind',
        fog: 'fa-smog'
    };
    
    for (const [key, icon] of Object.entries(icons)) {
        if (conditionName.toLowerCase().includes(key)) {
            return `<i class="fas ${icon}"></i>`;
        }
    }
    
    return '<i class="fas fa-question"></i>';
}

// Group inventory items by category
function groupByCategory(items) {
    return items.reduce((acc, item) => {
        const category = item.category || 'other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {});
}

// Render inventory data
function renderInventory(data) {
    if (!data) {
        inventoryContainer.innerHTML = '<div class="text-red-500">Failed to load inventory data</div>';
        return;
    }

    // Group items by category
    const groupedItems = groupByCategory(data);
    const categories = Object.keys(groupedItems);
    
    // Update category tabs
    renderCategoryTabs(categories);
    
    // Update category dropdown
    renderCategorySelect(categories);
    
    // Filter items based on search and category filter
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categorySelect.value;
    
    let filteredItems = data;
    if (searchTerm) {
        filteredItems = filteredItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm)
        );
    }
    if (selectedCategory !== 'all') {
        filteredItems = filteredItems.filter(item => 
            (item.category || 'other') === selectedCategory
        );
    }
    
    // Re-group filtered items
    const filteredGroupedItems = groupByCategory(filteredItems);
    
    // Render items
    let html = '';
    
    if (filteredItems.length === 0) {
        html = '<div class="text-center py-8 text-gray-500">No items found matching your criteria</div>';
    } else {
        for (const [category, items] of Object.entries(filteredGroupedItems)) {
            html += `<h3 class="text-lg font-medium mt-4 mb-2 capitalize">${category.replace(/([A-Z])/g, ' $1').trim()}</h3>`;
            html += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">';
            
            items.forEach(item => {
                const isLowStock = item.value <= 2;
                
                html += `
                    <div class="border rounded-lg p-3 ${isLowStock ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'}">
                        <div class="flex justify-between items-start">
                            <div class="flex items-center space-x-3">
                                <div class="text-2xl">${item.emoji || '📦'}</div>
                                <div>
                                    <h4 class="font-medium">${item.name}</h4>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">Last seen: ${formatTimestamp(item.lastSeen)}</p>
                                </div>
                            </div>
                            <span class="px-2 py-1 text-xs rounded-full ${isLowStock ? 'bg-red-500 text-white' : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'}">
                                Value: ${item.value}
                            </span>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }
    }
    
    inventoryContainer.innerHTML = html;
    
    // Update charts
    updateCharts(data, categories);
}

// Render category tabs
function renderCategoryTabs(categories) {
    let html = '';
    
    categories.forEach(category => {
        const displayName = category.replace(/([A-Z])/g, ' $1').trim();
        html += `
            <li class="mr-2">
                <button data-category="${category}" class="category-tab inline-block p-2 border-b-2 rounded-t-lg capitalize ${category === categories[0] ? 'border-blue-500 text-blue-500' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}">
                    ${displayName}
                </button>
            </li>
        `;
    });
    
    // Add "All" tab
    html = `
        <li class="mr-2">
            <button data-category="all" class="category-tab inline-block p-2 border-b-2 rounded-t-lg border-blue-500 text-blue-500">
                All
            </button>
        </li>
    ` + html;
    
    categoryTabs.innerHTML = html;
    
    // Add event listeners to tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            document.querySelectorAll('.category-tab').forEach(t => {
                t.classList.remove('border-blue-500', 'text-blue-500');
                t.classList.add('border-transparent');
            });
            tab.classList.add('border-blue-500', 'text-blue-500');
            tab.classList.remove('border-transparent');
            
            // Update dropdown to match
            categorySelect.value = tab.dataset.category;
            
            // Re-render inventory
            renderInventory(window.inventoryData);
        });
    });
}

// Render category select dropdown
function renderCategorySelect(categories) {
    let html = '<option value="all">All Categories</option>';
    
    categories.forEach(category => {
        const displayName = category.replace(/([A-Z])/g, ' $1').trim();
        html += `<option value="${category}">${displayName}</option>`;
    });
    
    categorySelect.innerHTML = html;
    
    // Add event listener
    categorySelect.addEventListener('change', () => {
        // Update active tab to match
        const selectedCategory = categorySelect.value;
        document.querySelectorAll('.category-tab').forEach(tab => {
            if (tab.dataset.category === selectedCategory) {
                tab.classList.add('border-blue-500', 'text-blue-500');
                tab.classList.remove('border-transparent');
            } else {
                tab.classList.remove('border-blue-500', 'text-blue-500');
                tab.classList.add('border-transparent');
            }
        });
        
        // Re-render inventory
        renderInventory(window.inventoryData);
    });
}

// Update charts
function updateCharts(data, categories) {
    // Value distribution chart
    const valueCounts = {
        '0-2': 0,
        '3-5': 0,
        '6-10': 0,
        '11+': 0
    };
    
    data.forEach(item => {
        if (item.value <= 2) valueCounts['0-2']++;
        else if (item.value <= 5) valueCounts['3-5']++;
        else if (item.value <= 10) valueCounts['6-10']++;
        else valueCounts['11+']++;
    });
    
    if (valueChart) valueChart.destroy();
    const valueCtx = document.getElementById('value-chart').getContext('2d');
    valueChart = new Chart(valueCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(valueCounts).map(k => k === '11+' ? '11+' : k),
            datasets: [{
                label: 'Number of Items',
                data: Object.values(valueCounts),
                backgroundColor: [
                    'rgba(239, 68, 68, 0.7)',  // red for 0-2
                    'rgba(234, 179, 8, 0.7)',   // yellow for 3-5
                    'rgba(34, 197, 94, 0.7)',   // green for 6-10
                    'rgba(59, 130, 246, 0.7)'   // blue for 11+
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(234, 179, 8, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(59, 130, 246, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
    
    // Category distribution chart
    const groupedItems = groupByCategory(data);
    const categoryLabels = Object.keys(groupedItems).map(c => c.replace(/([A-Z])/g, ' $1').trim());
    const categoryData = Object.values(groupedItems).map(items => items.length);
    
    if (categoryChart) categoryChart.destroy();
    const categoryCtx = document.getElementById('category-chart').getContext('2d');
    categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: categoryLabels,
            datasets: [{
                data: categoryData,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(139, 92, 246, 0.7)',
                    'rgba(236, 72, 153, 0.7)',
                    'rgba(20, 184, 166, 0.7)',
                    'rgba(249, 115, 22, 0.7)'
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(236, 72, 153, 1)',
                    'rgba(20, 184, 166, 1)',
                    'rgba(249, 115, 22, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Initialize and fetch data
async function init() {
    // Add event listener for search
    searchInput.addEventListener('input', () => {
        renderInventory(window.inventoryData);
    });
    
    // Initial data fetch
    await fetchAllData();
    
    // Set up periodic refresh (every 45 seconds)
    setInterval(fetchAllData, 45000);
}

// Fetch all data
async function fetchAllData() {
    const [stocks, weather] = await Promise.all([
        fetchData(API_ENDPOINTS.stocks),
        fetchData(API_ENDPOINTS.weather)
    ]);
    
    window.inventoryData = stocks;
    window.weatherData = weather;
    
    renderWeather(weather);
    renderInventory(stocks);
    updateLastUpdated();
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', init);
