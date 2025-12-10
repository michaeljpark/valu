
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the portfolio page
    if (document.getElementById('portfolio-chart')) {
        renderChart();
        renderHistoryChart();
    }
    // Check if we are on the marketplace page
    if (document.getElementById('marketplace-container')) {
        renderMarketplace();
        setupMarketplaceFilters();
        setupSortListener();
    }
});

let marketplaceItems = [];

function setupSortListener() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            const activeBtn = document.querySelector('.filter-btn.active');
            const category = activeBtn ? activeBtn.getAttribute('data-category') : 'All';
            renderMarketplace(category);
        });
    }
}

function setupMarketplaceFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.getAttribute('data-category');
            renderMarketplace(category);
        });
    });
}

function renderHistoryChart() {
    const container = document.getElementById('history-chart');
    if (!container) return;

    // Mock Data: Portfolio Value over time (7 points for 7 assets)
    const data = [
        { date: new Date('2023-01-15'), value: 4500 },  // Initial
        { date: new Date('2023-02-20'), value: 6800 },  // + Asset 2
        { date: new Date('2023-04-10'), value: 8200 },  // + Asset 3
        { date: new Date('2023-05-05'), value: 13200 }, // + Asset 4 (Watch)
        { date: new Date('2023-06-20'), value: 14600 }, // + Asset 5
        { date: new Date('2023-08-15'), value: 16100 }, // + Asset 6
        { date: new Date('2023-09-28'), value: 16850 }  // + Asset 7 (Current)
    ];

    renderHistoryLog(data);

    // Determine Trend
    const startValue = data[0].value;
    const endValue = data[data.length - 1].value;
    const isUpward = endValue >= startValue;

    const color = isUpward ? '#10B981' : '#EF4444'; // Green or Red
    const gradientId = 'chartGradient';

    // Dimensions
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    // Clear previous
    container.innerHTML = '';

    // SVG
    const svg = d3.select('#history-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define Gradient
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", gradientId)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", color)
        .attr("stop-opacity", 0.2);

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color)
        .attr("stop-opacity", 0);

    // Scales
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.value) * 0.9, d3.max(data, d => d.value) * 1.05])
        .range([height, 0]);

    // Area Generator (Curved)
    const area = d3.area()
        .x(d => x(d.date))
        .y0(height)
        .y1(d => y(d.value))
        .curve(d3.curveMonotoneX); // Smooth curve

    // Line Generator (Curved)
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX); // Smooth curve

    // Add Area
    svg.append("path")
        .datum(data)
        .attr("fill", `url(#${gradientId})`)
        .attr("d", area);

    // Add Line
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 3)
        .attr("d", line);

    // Add End Marker (Dot)
    const lastPoint = data[data.length - 1];
    svg.append("circle")
        .attr("cx", x(lastPoint.date))
        .attr("cy", y(lastPoint.value))
        .attr("r", 6)
        .attr("fill", "#FFFFFF")
        .attr("stroke", color)
        .attr("stroke-width", 3);

    // Custom Grid Lines (Horizontal only)
    const yAxis = d3.axisLeft(y)
        .ticks(5)
        .tickSize(-width) // Full width grid lines
        .tickFormat(d => '$' + d.toLocaleString());

    const yAxisGroup = svg.append("g")
        .call(yAxis);

    // Style the grid lines
    yAxisGroup.select(".domain").remove(); // Remove vertical axis line
    yAxisGroup.selectAll(".tick line")
        .attr("stroke", "#E2E8F0")
        .attr("stroke-dasharray", "4,4"); // Dashed lines
    yAxisGroup.selectAll(".tick text")
        .attr("x", -10)
        .attr("dy", 4)
        .style("color", "#94A3B8")
        .style("font-size", "12px")
        .style("font-family", "Inter, sans-serif");

    // X Axis (Minimal)
    const xAxis = d3.axisBottom(x)
        .ticks(5)
        .tickSize(0)
        .tickPadding(10);

    const xAxisGroup = svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    xAxisGroup.select(".domain").attr("stroke", "#E2E8F0");
    xAxisGroup.selectAll(".tick text")
        .style("color", "#94A3B8")
        .style("font-size", "12px")
        .style("font-family", "Inter, sans-serif");
}

function renderChart() {
    const container = document.getElementById('portfolio-chart');
    if (!container) return;

    // Data from the image - Bank Aesthetic Colors
    const data = [
        { label: 'Collectibles', value: 2580, color: '#1E293B' }, // Slate 800 (Dark Navy)
        { label: 'Fashion', value: 1350, color: '#9F1239' },      // Rose 800 (Burgundy)
        { label: 'Art', value: 520, color: '#1D4ED8' },           // Blue 700 (Corporate Blue)
        { label: 'Jewelry', value: 9200, color: '#B45309' },      // Amber 700 (Gold/Bronze)
        { label: 'Music', value: 1250, color: '#047857' },        // Emerald 700 (Deep Green)
        { label: 'Furniture', value: 1950, color: '#374151' }     // Gray 700 (Charcoal)
    ];

    const width = 300;
    const height = 300;
    const margin = 20;
    const radius = Math.min(width, height) / 2 - margin;
    const innerRadius = radius * 0.85; // Thinner Ring style

    // Clear previous
    container.innerHTML = '';

    // Create SVG
    const svg = d3.select('#portfolio-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

    // Compute the position of each group on the pie
    const pie = d3.pie()
        .value(d => d.value)
        .sort(null); // Keep order

    const data_ready = pie(data);

    // Shape helper to build arcs
    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(radius)
        .cornerRadius(10);

    // Build the pie chart
    svg
        .selectAll('path')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => d.data.color)
        .attr('stroke', 'white')
        .style('stroke-width', '2px')
        .style('opacity', 1)
        .transition()
        .duration(1000)
        .attrTween('d', function (d) {
            var i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
            return function (t) {
                d.endAngle = i(t);
                return arc(d);
            }
        });

    // Add labels (optional, but image shows legend on right, not on chart)
    renderLegend(data);
}

function renderLegend(data) {
    const legendContainer = document.getElementById('chart-legend');
    if (!legendContainer) return;

    legendContainer.innerHTML = data.map(item => `
        <div class="legend-item">
            <div class="legend-label">
                <div class="legend-color" style="background-color: ${item.color}"></div>
                <span>${item.label}</span>
            </div>
            <div class="legend-value">$${item.value.toLocaleString()}</div>
        </div>
    `).join('');
}

// Marketplace Data Generation
const baseItems = [
    { title: 'Apple Watch SE', category: 'Electronics', price: 279, est: 299, img: 'assets/applewatch se.png', badge: 'Electronics', user: 'TechGuru92', potential: '+7.2%' },
    { title: 'Abstract Art Painting', category: 'Art', price: 850, est: 1200, img: 'assets/art.png', badge: 'Art', user: 'ArtCollector', potential: '+41.2%' },
    { title: 'Burberry Trench Coat', category: 'Fashion', price: 1890, est: 2100, img: 'assets/burberry coat.png', badge: 'Fashion', user: 'FashionIcon', potential: '+11.1%' },
    { title: 'Vintage Camera Collection', category: 'Collectibles', price: 2500, est: 2800, img: 'assets/camera.png', badge: 'Collectibles', user: 'PhotoPro' },
    { title: 'Chanel Classic Bag', category: 'Fashion', price: 5800, est: 6200, img: 'assets/channelbag.png', badge: 'Fashion', user: 'LuxuryLover', potential: '+6.9%' },
    { title: 'Designer Ergonomic Chair', category: 'Furniture', price: 680, est: 720, img: 'assets/designer chair.png', badge: 'Furniture', user: 'OfficeSetup' },
    { title: 'Luxury Designer Dress', category: 'Fashion', price: 2200, est: 2400, img: 'assets/designerdress.png', badge: 'Fashion', user: 'Fashionista' },
    { title: 'Samsung Smart Fridge', category: 'Appliances', price: 3200, est: 3100, img: 'assets/fridge.png', badge: 'Appliances', user: 'HomeUpgrade' },
    { title: 'Custom Gaming PC', category: 'Electronics', price: 2800, est: 2900, img: 'assets/gamingpc.png', badge: 'Electronics', user: 'GamerX', potential: '+3.6%' },
    { title: 'Gucci Leather Wallet', category: 'Fashion', price: 420, est: 450, img: 'assets/gucci wallet.jpg', badge: 'Fashion', user: 'StyleMaster' },
    { title: 'iPad Pro 12.9"', category: 'Electronics', price: 1099, est: 1150, img: 'assets/ipad.png', badge: 'Electronics', user: 'AppleFan88' },
    { title: 'iPhone 15 Pro Max', category: 'Electronics', price: 1199, est: 1250, img: 'assets/iphone.jpg', badge: 'Electronics', user: 'MobileTech', potential: '+4.3%' },
    { title: 'Mazda CX-5 SUV', category: 'Vehicles', price: 28500, est: 29000, img: 'assets/mazda suv.png', badge: 'Vehicles', user: 'CarDealer', potential: '+1.8%' },
    { title: 'Robot Vacuum Cleaner', category: 'Appliances', price: 450, est: 480, img: 'assets/robotcleaner.png', badge: 'Appliances', user: 'SmartHome' },
    { title: 'Limited Edition Sneakers', category: 'Fashion', price: 380, est: 450, img: 'assets/sneakers.png', badge: 'Fashion', user: 'SneakerHead', potential: '+18.4%' },
    { title: 'Modern Velvet Sofa', category: 'Furniture', price: 1950, est: 2100, img: 'assets/sofa.png', badge: 'Furniture', user: 'InteriorDesign', potential: '+7.7%' },
    { title: 'Dining Table Set', category: 'Furniture', price: 890, est: 920, img: 'assets/table.png', badge: 'Furniture', user: 'HomeDecor' },
    { title: '65" OLED Smart TV', category: 'Electronics', price: 1899, est: 1950, img: 'assets/tv.png', badge: 'Electronics', user: 'EntertainmentHub' },
    { title: 'Rare Vinyl Records', category: 'Music', price: 1250, est: 1400, img: 'assets/vinyl.png', badge: 'Music', user: 'VinylCollector', potential: '+12.0%' },
    { title: 'Luxury Designer Watch', category: 'Jewelry', price: 4500, est: 5000, img: 'assets/watch.png', badge: 'Jewelry', user: 'WatchEnthusiast', potential: '+11.1%' }
];

function generateMarketplaceItems(count) {
    const items = [];
    for (let i = 0; i < count; i++) {
        const base = baseItems[i % baseItems.length];
        // Add some variation
        const variation = Math.floor(Math.random() * 500) - 250;
        const newPrice = Math.max(100, base.price + variation);
        const newEst = Math.max(100, base.est + variation);

        items.push({
            ...base,
            id: i,
            price: newPrice,
            est: newEst,
            title: base.title
        });
    }
    return items;
}

function getLikedItems() {
    return JSON.parse(localStorage.getItem('likedItems') || '[]');
}

function toggleLike(event, title) {
    event.stopPropagation();
    const likedItems = getLikedItems();
    const index = likedItems.indexOf(title);
    
    if (index === -1) {
        likedItems.push(title);
    } else {
        likedItems.splice(index, 1);
    }
    
    localStorage.setItem('likedItems', JSON.stringify(likedItems));
    
    // Update UI
    const btn = event.currentTarget;
    btn.classList.toggle('active');
}

function renderMarketplace(category = 'All') {
    const container = document.getElementById('marketplace-container');
    if (!container) return;

    if (marketplaceItems.length === 0) {
        marketplaceItems = generateMarketplaceItems(20); // Generate 20 items once
    }

    let filteredItems = category === 'All'
        ? [...marketplaceItems]
        : marketplaceItems.filter(item => item.category === category);

    // Sort items
    const sortSelect = document.getElementById('sort-select');
    const sortValue = sortSelect ? sortSelect.value : 'newest';

    if (sortValue === 'price-asc') {
        filteredItems.sort((a, b) => a.est - b.est);
    } else if (sortValue === 'price-desc') {
        filteredItems.sort((a, b) => b.est - a.est);
    } else if (sortValue === 'potential') {
        filteredItems.sort((a, b) => {
            const potA = a.potential ? parseFloat(a.potential.replace('+', '').replace('%', '')) : 0;
            const potB = b.potential ? parseFloat(b.potential.replace('+', '').replace('%', '')) : 0;
            return potB - potA;
        });
    }

    // Update listing count
    const countElement = document.getElementById('listing-count');
    if (countElement) {
        countElement.textContent = filteredItems.length;
    }

    const likedItems = getLikedItems();

    container.innerHTML = filteredItems.map(item => {
        const isLiked = likedItems.includes(item.title);
        return `
        <div class="market-card" onclick="window.location.href='listing.html?title=${encodeURIComponent(item.title)}&price=${item.price}&est=${item.est}&img=${encodeURIComponent(item.img)}'" style="cursor: pointer;">
            <div class="card-image-container">
                <img src="valu text.svg" alt="Placeholder" class="card-placeholder-icon">
                <div class="card-badge"><i class="fa-solid fa-tag"></i> ${item.badge}</div>
                <div class="card-like-btn ${isLiked ? 'active' : ''}" onclick="toggleLike(event, '${item.title.replace(/'/g, "\\'")}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>
                </div>
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.title}</h3>
                <div class="card-stats">
                    <div class="stat-pair">
                        <span class="stat-label">Original Value</span>
                        <span class="stat-val" style="color: #9CA3AF; font-weight: 500;">$${item.price.toLocaleString()}</span>
                    </div>
                    <div class="stat-pair" style="text-align: right;">
                        <span class="stat-label">Est. Value</span>
                        <span class="stat-val" style="font-size: 36px; color: #111827; line-height: 1.1; font-weight: 700;">$${item.est.toLocaleString()}</span>
                    </div>
                </div>
                ${item.potential ? `
                <div class="potential-badge">
                    <i class="fa-solid fa-arrow-trend-up"></i> ${item.potential} potential value
                </div>` : ''}
            </div>
        </div>
    `;
    }).join('');
}

function renderHistoryLog(data) {
    const container = document.getElementById('history-log');
    if (!container) return;

    // Calculate changes
    const logData = data.map((item, index) => {
        const prev = index > 0 ? data[index - 1].value : item.value;
        const change = item.value - prev;
        const percent = index > 0 ? ((change / prev) * 100).toFixed(1) : '0.0';
        return { ...item, change, percent };
    }).reverse(); // Newest first

    container.innerHTML = logData.map(item => `
        <div class="log-item">
            <div class="log-date">${item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div class="log-info" style="text-align: right;">
                <div class="log-value">$${item.value.toLocaleString()}</div>
                ${item.change !== 0 ? `
                <div class="log-change ${item.change > 0 ? 'positive' : 'negative'}">
                    ${item.change > 0 ? '+' : ''}${item.change.toLocaleString()} (${item.change > 0 ? '+' : ''}${item.percent}%)
                </div>` : '<div class="log-change" style="background:#F3F4F6; color:#6B7280;">Initial</div>'}
            </div>
        </div>
    `).join('');
}

function getLikedItems() {
    return JSON.parse(localStorage.getItem('likedItems') || '[]');
}

function toggleLike(event, title) {
    event.stopPropagation();
    const likedItems = getLikedItems();
    const index = likedItems.indexOf(title);
    
    if (index === -1) {
        likedItems.push(title);
    } else {
        likedItems.splice(index, 1);
    }
    
    localStorage.setItem('likedItems', JSON.stringify(likedItems));
    
    // Update UI
    const btn = event.currentTarget;
    btn.classList.toggle('active');
}

