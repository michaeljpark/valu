
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the portfolio page
    if (document.getElementById('history-chart')) {
        // renderChart(); // Pie chart removed
        renderHistoryChart();
        initStatsCarousel();
        initAssetHistory(); // Initialize Asset History
        
        // Re-render chart on resize
        window.addEventListener('resize', () => {
            renderHistoryChart();
            // Re-render current asset chart if visible
            const currentAsset = myAssets[currentAssetIndex];
            if (loadedAssets.has(currentAssetIndex)) {
                const chartContainer = document.getElementById(`asset-mini-chart-${currentAsset.id}`);
                if (chartContainer) {
                    chartContainer.innerHTML = ''; // Clear
                    renderAssetMiniChart(currentAsset, `asset-mini-chart-${currentAsset.id}`);
                }
            }
        });
    }
    // Check if we are on the marketplace page
    if (document.getElementById('marketplace-container')) {
        renderMarketplace();
        setupMarketplaceFilters();
        setupSortListener();
    }
});

let marketplaceItems = JSON.parse(localStorage.getItem('marketplaceItems')) || [];

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

    // X Axis (Minimal) - Optimized for Mobile
    const isMobile = window.innerWidth <= 768;
    const xAxis = d3.axisBottom(x)
        .ticks(isMobile ? 3 : 5) // Fewer ticks on mobile
        .tickSize(0)
        .tickPadding(10)
        .tickFormat(d3.timeFormat(isMobile ? "%b" : "%b %d")); // Short format on mobile

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

    // Data from the image - Green Gradient Palette (Emerald/Green)
    const data = [
        { label: 'Collectibles', value: 2580, color: '#064E3B' }, // Emerald 900 (Deepest Green)
        { label: 'Fashion', value: 1350, color: '#065F46' },      // Emerald 800
        { label: 'Art', value: 520, color: '#059669' },           // Emerald 600
        { label: 'Jewelry', value: 9200, color: '#10B981' },      // Emerald 500
        { label: 'Music', value: 1250, color: '#34D399' },        // Emerald 400
        { label: 'Furniture', value: 1950, color: '#6EE7B7' }     // Emerald 300 (Lightest Green)
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
    renderMobileLegend(data);
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

function renderMobileLegend(data) {
    const container = document.getElementById('mobile-legend-container');
    if (!container) return;

    container.innerHTML = data.map(item => `
        <div class="mobile-legend-item">
            <div class="mobile-legend-label">
                <div class="mobile-legend-dot" style="background-color: ${item.color}"></div>
                <span>${item.label}</span>
            </div>
            <div class="mobile-legend-value">$${item.value.toLocaleString()}</div>
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
        localStorage.setItem('marketplaceItems', JSON.stringify(marketplaceItems));
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
                <div class="card-badge ${item.isNew ? 'new' : ''}">
                    <i class="fa-solid fa-tag"></i> ${item.isNew ? 'NEW' : item.badge}
                </div>
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

    // Mock Transaction Data (Reverse chronological)
    const transactions = [
        { title: 'Vintage Camera Collection', type: 'Appreciation', amount: 150, date: 'Today', icon: '<i class="fa-solid fa-arrow-trend-up"></i>' },
        { title: 'Luxury Watch Service', type: 'Maintenance', amount: -200, date: 'Yesterday', icon: '<i class="fa-solid fa-wrench"></i>' },
        { title: 'Limited Edition Sneakers', type: 'New Asset', amount: 1800, date: 'Oct 24', icon: '<i class="fa-solid fa-plus"></i>' },
        { title: 'Modern Art Piece', type: 'Appreciation', amount: 320, date: 'Oct 15', icon: '<i class="fa-solid fa-arrow-trend-up"></i>' },
        { title: 'Designer Handbag', type: 'Sold', amount: 2400, date: 'Sep 30', icon: '<i class="fa-solid fa-sack-dollar"></i>' }
    ];

    container.innerHTML = transactions.map(tx => `
        <div class="history-item">
            <div class="history-item-left">
                <div class="history-icon">
                    ${tx.icon}
                </div>
                <div class="history-details">
                    <h4>${tx.title}</h4>
                    <p>${tx.type} · ${tx.date}</p>
                </div>
            </div>
            <div class="history-amount ${tx.amount > 0 ? 'amount-plus' : 'amount-minus'}">
                ${tx.amount > 0 ? '+' : ''}$${Math.abs(tx.amount).toLocaleString()}
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



function initStatsCarousel() {
 const slides = document.querySelectorAll('.stat-slide');
 const dots = document.querySelectorAll('.stat-dot');
 const container = document.querySelector('.stats-single-card');
 const prevBtn = document.getElementById('stats-prev-btn');
 const nextBtn = document.getElementById('stats-next-btn');
 const counter = document.getElementById('stats-counter');
 
 if (!slides.length || !container) return;

 let currentSlide = 0;
 let intervalId;
 let isPaused = false;
 let startY = 0;
 let isDragging = false;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
        
        // Update Counter
        if(counter) counter.textContent = `${index + 1} / ${slides.length}`;
    } function nextSlide() {
 let next = (currentSlide + 1) % slides.length;
 showSlide(next);
 }

 function prevSlide() {
 let prev = (currentSlide - 1 + slides.length) % slides.length;
 showSlide(prev);
 }

 function startAutoRotate() {
 if (intervalId) clearInterval(intervalId);
 intervalId = setInterval(() => {
 if (!isPaused) {
 nextSlide();
 }
 }, 4000);
 }

 function stopAutoRotate() {
 if (intervalId) clearInterval(intervalId);
 }

 // Event Listeners
 container.addEventListener('mouseenter', () => {
 isPaused = true;
 stopAutoRotate();
 });

 container.addEventListener('mouseleave', () => {
 isPaused = false;
 startAutoRotate();
 });

 // Mouse Wheel Support
 let lastScrollTime = 0;
 const scrollCooldown = 800; // 800ms cooldown

 container.addEventListener('wheel', (e) => {
 e.preventDefault(); // Prevent page scrolling
 
 const now = Date.now();
 if (now - lastScrollTime < scrollCooldown) return;

 if (e.deltaY > 0) {
 nextSlide();
 } else {
 prevSlide();
 }
 
 lastScrollTime = now;
 stopAutoRotate();
 }, { passive: false });

 // Touch/Drag Support (Vertical)
 container.addEventListener('touchstart', (e) => {
 startY = e.touches[0].clientY;
 isPaused = true;
 stopAutoRotate();
 });

 container.addEventListener('touchmove', (e) => {
 // Prevent scrolling while swiping the card
 // e.preventDefault(); 
 });

 container.addEventListener('touchend', (e) => {
 const endY = e.changedTouches[0].clientY;
 handleSwipe(startY, endY);
 isPaused = false;
 startAutoRotate();
 });

 container.addEventListener('mousedown', (e) => {
 startY = e.clientY;
 isDragging = true;
 isPaused = true;
 stopAutoRotate();
 container.style.cursor = 'grabbing';
 });

 container.addEventListener('mouseup', (e) => {
 if (!isDragging) return;
 const endY = e.clientY;
 handleSwipe(startY, endY);
 isDragging = false;
 isPaused = false;
 startAutoRotate();
 container.style.cursor = 'grab';
 });

 container.addEventListener('mouseleave', () => {
 if (isDragging) {
 isDragging = false;
 isPaused = false;
 startAutoRotate();
 container.style.cursor = 'grab';
 }
 });

 function handleSwipe(start, end) {
 const threshold = 50;
 if (start - end > threshold) {
 nextSlide(); // Swipe Up -> Next
 } else if (end - start > threshold) {
 prevSlide(); // Swipe Down -> Prev
 }
 }

 // Click on dots
 dots.forEach((dot, index) => {
 dot.addEventListener('click', () => {
 showSlide(index);
 stopAutoRotate();
 startAutoRotate(); // Reset timer
 });
 });
 
 // Button Controls
 if(prevBtn) {
     prevBtn.addEventListener('click', (e) => {
         e.stopPropagation(); // Prevent card click/drag
         prevSlide();
         stopAutoRotate();
         startAutoRotate();
     });
 }
 
 if(nextBtn) {
     nextBtn.addEventListener('click', (e) => {
         e.stopPropagation();
         nextSlide();
         stopAutoRotate();
         startAutoRotate();
     });
 }

 // Start
 startAutoRotate();
}



// --- Asset History Manager ---
let myAssets = JSON.parse(localStorage.getItem('myAssets'));

if (!myAssets || myAssets.length === 0) {
    myAssets = [
    { 
        id: 1, 
        title: 'Limited Edition Sneakers', 
        category: 'Fashion', 
        icon: '<img src="valu text.svg" class="asset-icon-img" alt="Valu">',
        purchasePrice: 1800, 
        currentValue: 2200, 
        change: '+22.2%',
        aiDesc: 'High demand in secondary markets driven by recent celebrity endorsements and limited supply.',
        chartData: [1800, 1850, 1900, 2000, 2100, 2150, 2200]
    },
    { 
        id: 2, 
        title: 'Vintage Camera Collection', 
        category: 'Collectibles', 
        icon: '<img src="valu text.svg" class="asset-icon-img" alt="Valu">',
        purchasePrice: 2100, 
        currentValue: 2200, 
        change: '-12.00%',
        aiDesc: 'Market saturation for 1980s models has slightly depressed prices, but pristine condition maintains value.',
        chartData: [2500, 2450, 2400, 2350, 2300, 2250, 2200]
    },
    { 
        id: 3, 
        title: 'Abstract Art Painting', 
        category: 'Art', 
        icon: '<img src="valu text.svg" class="asset-icon-img" alt="Valu">',
        purchasePrice: 850, 
        currentValue: 1200, 
        change: '+41.2%',
        aiDesc: 'Artist\'s recent gallery exhibition has increased visibility and collector interest significantly.',
        chartData: [850, 900, 950, 1000, 1100, 1150, 1200]
    },
    { 
        id: 4, 
        title: 'Designer Watch', 
        category: 'Jewelry', 
        icon: '<img src="valu text.svg" class="asset-icon-img" alt="Valu">',
        purchasePrice: 4500, 
        currentValue: 5000, 
        change: '+11.1%',
        aiDesc: 'Steady appreciation due to brand heritage and annual price increases for new models.',
        chartData: [4500, 4600, 4700, 4800, 4850, 4900, 5000]
    },
    { 
        id: 5, 
        title: 'Rare Vinyl Records', 
        category: 'Music', 
        icon: '<img src="valu text.svg" class="asset-icon-img" alt="Valu">',
        purchasePrice: 1250, 
        currentValue: 1400, 
        change: '+12.0%',
        aiDesc: 'Niche collector interest remains strong for first pressings in near-mint condition.',
        chartData: [1250, 1280, 1300, 1320, 1350, 1380, 1400]
    },
    { 
        id: 6, 
        title: 'Mid-Century Chair', 
        category: 'Furniture', 
        icon: '<img src="valu text.svg" class="asset-icon-img" alt="Valu">',
        purchasePrice: 1950, 
        currentValue: 2100, 
        change: '+7.7%',
        aiDesc: 'Mid-century modern furniture continues to trend, supporting stable value growth.',
        chartData: [1950, 1980, 2000, 2020, 2050, 2080, 2100]
    }
    ];
    localStorage.setItem('myAssets', JSON.stringify(myAssets));
}

let currentAssetIndex = 1; // Start from 2nd item
// const loadedAssets = new Set(); // Removed: Bulk loading simulated

function initAssetHistory() {
    const container = document.getElementById('asset-history-card');
    const prevBtn = document.getElementById('asset-prev-btn');
    const nextBtn = document.getElementById('asset-next-btn');
    const indicatorsContainer = document.getElementById('asset-indicators');
    
    if (!container) return;

    // Generate Indicators
    if (indicatorsContainer) {
        indicatorsContainer.innerHTML = myAssets.map((_, i) => 
            `<span class="asset-dot ${i === currentAssetIndex ? 'active' : ''}" data-index="${i}"></span>`
        ).join('');

        // Indicator Click
        document.querySelectorAll('.asset-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                currentAssetIndex = index;
                loadAsset(currentAssetIndex);
            });
        });
    }

    // Initial Render
    loadAsset(currentAssetIndex);
    
    // Auto-rotate for Asset History
    let assetInterval;
    function startAssetAutoRotate() {
        if (assetInterval) clearInterval(assetInterval);
        assetInterval = setInterval(() => {
            currentAssetIndex = (currentAssetIndex + 1) % myAssets.length;
            loadAsset(currentAssetIndex);
        }, 5000); // 5 seconds
    }
    
    function stopAssetAutoRotate() {
        if (assetInterval) clearInterval(assetInterval);
    }
    
    startAssetAutoRotate();
    
    container.addEventListener('mouseenter', stopAssetAutoRotate);
    container.addEventListener('mouseleave', startAssetAutoRotate);
    container.addEventListener('touchstart', stopAssetAutoRotate);

    // Event Listeners
    prevBtn.addEventListener('click', () => {
        stopAssetAutoRotate();
        currentAssetIndex = (currentAssetIndex - 1 + myAssets.length) % myAssets.length;
        loadAsset(currentAssetIndex);
        startAssetAutoRotate();
    });

    nextBtn.addEventListener('click', () => {
        stopAssetAutoRotate();
        currentAssetIndex = (currentAssetIndex + 1) % myAssets.length;
        loadAsset(currentAssetIndex);
        startAssetAutoRotate();
    });

    // Swipe Support (Touch)
    let startX = 0;
    container.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });

    container.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        const threshold = 50;
        if (startX - endX > threshold) {
            // Swipe Left -> Next
            currentAssetIndex = (currentAssetIndex + 1) % myAssets.length;
            loadAsset(currentAssetIndex);
        } else if (endX - startX > threshold) {
            // Swipe Right -> Prev
            currentAssetIndex = (currentAssetIndex - 1 + myAssets.length) % myAssets.length;
            loadAsset(currentAssetIndex);
        }
        startAssetAutoRotate();
    });

    // Mouse Wheel Support (Hover + Scroll)
    let lastScrollTime = 0;
    const scrollCooldown = 800;

    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const now = Date.now();
        if (now - lastScrollTime < scrollCooldown) return;

        if (e.deltaY > 0) {
            // Scroll Down -> Next
            currentAssetIndex = (currentAssetIndex + 1) % myAssets.length;
        } else {
            // Scroll Up -> Prev
            currentAssetIndex = (currentAssetIndex - 1 + myAssets.length) % myAssets.length;
        }
        loadAsset(currentAssetIndex);
        lastScrollTime = now;
    }, { passive: false });
}

function loadAsset(index) {
    const container = document.getElementById('asset-history-card');
    const counter = document.getElementById('asset-counter');
    const asset = myAssets[index];

    // Update Counter
    counter.textContent = `${index + 1} / ${myAssets.length}`;

    // Update Indicators
    document.querySelectorAll('.asset-dot').forEach((dot, i) => {
        if (i === index) dot.classList.add('active');
        else dot.classList.remove('active');
    });

    // Direct Render (Bulk Loaded from Backend)
    renderAssetContent(asset);
}

function renderAssetContent(asset) {
    const container = document.getElementById('asset-history-card');
    
    // Determine badge class
    const badgeMap = {
        'Fashion': 'badge-fashion',
        'Collectibles': 'badge-collectibles',
        'Art': 'badge-art',
        'Jewelry': 'badge-jewelry',
        'Music': 'badge-music',
        'Furniture': 'badge-furniture'
    };
    const badgeClass = badgeMap[asset.category] || 'badge';
    container.innerHTML = `
        <div class="asset-content-grid" onclick="window.location.href='post.html?title=${encodeURIComponent(asset.title)}'" style="cursor: pointer;">
            <div class="asset-info-col">
                <div class="asset-header">
                    <div class="asset-icon-large">
                        ${asset.icon}
                    </div>
                    <div class="asset-title-group">
                        <h3>${asset.title}</h3>
                        <span class="badge ${badgeClass}" style="margin-left:6px;">${asset.category}</span>
                    </div>
                </div>
                <div class="asset-stats-row">
                    <div class="asset-stat-item">
                        <label>Purchase Price</label>
                        <div class="value">$${asset.purchasePrice.toLocaleString()}</div>
                    </div>
                    <div class="asset-stat-item">
                        <label>Market Value</label>
                        <div class="value" style="color: ${asset.currentValue >= asset.purchasePrice ? '#10B981' : '#EF4444'}">${asset.currentValue >= asset.purchasePrice ? '▲' : '▼'} $${asset.currentValue.toLocaleString()}</div>
                    </div>
                </div>
                <div class="ai-label" style="margin-bottom: 4px; padding-left: 4px;">Valu Insight</div>
                <div class="asset-ai-desc">
                    <p class="ai-text">${asset.aiDesc}</p>
                </div>
            </div>
            <div class="asset-chart-col" id="asset-mini-chart-${asset.id}"></div>
        </div>
    `;

    // Render Mini Chart
    renderAssetMiniChart(asset, `asset-mini-chart-${asset.id}`);
}

function renderAssetMiniChart(asset, containerId) {
 const container = document.getElementById(containerId);
 if (!container) return;

 // Use a default width if clientWidth is 0 (e.g. hidden) or very small, 
 // but we want the coordinate system to be large enough for good resolution.
 // We will scale it down with CSS.
 const width = container.clientWidth || 600; 
 const height = container.clientHeight || 200;
 const margin = { top: 20, right: 20, bottom: 20, left: 20 };

 const svg = d3.select(`#${containerId}`)
 .append('svg')
 .attr('viewBox', `0 0 ${width} ${height}`)
 // Removed preserveAspectRatio to prevent distortion (squashing)
 .style('width', '100%')
 .style('height', 'auto') // Let height adjust to maintain aspect ratio
 .style('display', 'block');

 const data = asset.chartData.map((val, i) => ({ i, value: val }));

 const x = d3.scaleLinear()
 .domain([0, data.length - 1])
 .range([margin.left, width - margin.right]);

 const y = d3.scaleLinear()
 .domain([d3.min(data, d => d.value) * 0.95, d3.max(data, d => d.value) * 1.05])
 .range([height - margin.bottom, margin.top]);

 const line = d3.line()
 .x(d => x(d.i))
 .y(d => y(d.value))
 .curve(d3.curveMonotoneX);

 const area = d3.area()
 .x(d => x(d.i))
 .y0(height - margin.bottom)
 .y1(d => y(d.value))
 .curve(d3.curveMonotoneX);

 const color = asset.currentValue >= asset.purchasePrice ? '#10B981' : '#EF4444';

    // Gradient
    const defs = svg.append("defs");
    const gradientId = `grad-${asset.id}`;
    const gradient = defs.append("linearGradient")
        .attr("id", gradientId)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", color).attr("stop-opacity", 0.2);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", color).attr("stop-opacity", 0);

    svg.append("path")
        .datum(data)
        .attr("fill", `url(#${gradientId})`)
        .attr("d", area);

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 3)
        .attr("d", line);
        
    // Add dots
    svg.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.i))
        .attr("cy", d => y(d.value))
        .attr("r", 4)
        .attr("fill", "white")
        .attr("stroke", color)
        .attr("stroke-width", 2);
}

/* --- AI Chatbot Logic --- */
function initChatbot() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const messagesContainer = document.getElementById('chat-messages');
    const countSpan = document.getElementById('chat-asset-count');

    if (!chatInput || !messagesContainer) return;

    // Update Asset Count
    if (countSpan && typeof myAssets !== 'undefined') {
        countSpan.textContent = myAssets.length;
    }

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.innerHTML = `
            <div class="message-content">
                ${text}
            </div>
        `;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        // 1. User Message
        addMessage(text, 'user');
        chatInput.value = '';

        // 2. AI Processing (Simulated Backend)
        setTimeout(() => {
            const response = generateAIResponse(text);
            addMessage(response, 'ai');
        }, 600);
    }

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
}

function generateAIResponse(userText) {
    const lowerText = userText.toLowerCase();
    
    // Context: myAssets
    const assets = typeof myAssets !== 'undefined' ? myAssets : [];
    const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);
    
    // 1. Total Value Query
    if (lowerText.includes('total') || lowerText.includes('worth') || lowerText.includes('portfolio')) {
        return `Your current portfolio consists of ${assets.length} assets with a total market value of <strong>$${totalValue.toLocaleString()}</strong>. It's a solid foundation.`;
    }

    // 2. Selling Advice
    if (lowerText.includes('sell') || lowerText.includes('selling')) {
        // Find highest gainer
        const bestAsset = [...assets].sort((a, b) => b.currentValue - a.currentValue)[0];
        if (bestAsset) {
            return `Based on current market trends, your <strong>${bestAsset.title}</strong> is valued highly at $${bestAsset.currentValue.toLocaleString()}. If you're looking for liquidity, this would be your strongest exit right now.`;
        }
        return "To give you the best selling advice, I'd need to analyze the specific market conditions for each item. Generally, look for assets with high demand and low supply.";
    }

    // 3. Specific Asset Query
    const foundAsset = assets.find(a => lowerText.includes(a.title.toLowerCase()) || lowerText.includes(a.category.toLowerCase()));
    if (foundAsset) {
        const isProfit = foundAsset.currentValue >= foundAsset.purchasePrice;
        return `<strong>${foundAsset.title}</strong> is currently valued at $${foundAsset.currentValue.toLocaleString()}. ${isProfit ? 'It has appreciated nicely.' : 'It is currently below purchase price.'} ${foundAsset.aiDesc}`;
    }

    // 4. General / Identity
    if (lowerText.includes('who are you') || lowerText.includes('help')) {
        return "I am your dedicated Valu Financial Analyst. I monitor market trends to help you manage your physical asset portfolio. Ask me about your total value, specific items, or selling strategies.";
    }

    // Default
    return "That's an interesting point. As your portfolio manager, I suggest we keep an eye on market trends for your collectibles. Is there a specific asset you'd like me to re-evaluate?";
}

// Initialize Chatbot if on page
document.addEventListener('DOMContentLoaded', initChatbot);

