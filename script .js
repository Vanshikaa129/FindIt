// Initialize data from localStorage or create empty arrays
let lostItems = JSON.parse(localStorage.getItem('lostItems')) || [];
let foundItems = JSON.parse(localStorage.getItem('foundItems')) || [];

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    updateStats();
    displayItems();
    setupEventListeners();
    setMaxDate();
});

// Set max date to today for date inputs
function setMaxDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('lostDate').setAttribute('max', today);
    document.getElementById('foundDate').setAttribute('max', today);
}

// Setup all event listeners
function setupEventListeners() {
    // Form submissions
    document.getElementById('reportLostForm').addEventListener('submit', handleLostSubmit);
    document.getElementById('reportFoundForm').addEventListener('submit', handleFoundSubmit);

    // Search and filters
    document.getElementById('searchInput').addEventListener('input', filterItems);
    document.getElementById('typeFilter').addEventListener('change', filterItems);
    document.getElementById('categoryFilter').addEventListener('change', filterItems);
    document.getElementById('sortFilter').addEventListener('change', filterItems);

    // Modal close
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    document.getElementById('itemModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });

    // Navigation smooth scroll
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1);
            scrollToSection(target);
            
            // Update active nav link
            document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Smooth scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Switch between Lost and Found tabs
function switchTab(type) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.tab-btn').classList.add('active');

    // Show/hide forms
    if (type === 'lost') {
        document.getElementById('lostForm').classList.add('active');
        document.getElementById('foundForm').classList.remove('active');
    } else {
        document.getElementById('lostForm').classList.remove('active');
        document.getElementById('foundForm').classList.add('active');
    }
}

// Handle Lost Item Form Submission
async function handleLostSubmit(e) {
    e.preventDefault();

    const imageFile = document.getElementById('lostImage').files[0];
    let imageData = null;

    if (imageFile) {
        // Validate file size (5MB max)
        if (imageFile.size > 5 * 1024 * 1024) {
            showNotification('Image size should be less than 5MB', 'error');
            return;
        }
        imageData = await fileToBase64(imageFile);
    }

    const item = {
        id: Date.now(),
        type: 'lost',
        name: document.getElementById('lostItemName').value,
        category: document.getElementById('lostCategory').value,
        date: document.getElementById('lostDate').value,
        location: document.getElementById('lostLocation').value,
        description: document.getElementById('lostDescription').value,
        reporterName: document.getElementById('lostReporterName').value,
        reporterContact: document.getElementById('lostReporterContact').value,
        reporterEmail: document.getElementById('lostReporterEmail').value,
        image: imageData,
        timestamp: new Date().toISOString(),
        status: 'active'
    };

    lostItems.push(item);
    localStorage.setItem('lostItems', JSON.stringify(lostItems));

    showNotification('Lost item reported successfully! We will help you find it.', 'success');
    e.target.reset();
    updateStats();
    displayItems();
    
    // Scroll to items section
    setTimeout(() => scrollToSection('items'), 1000);
}

// Handle Found Item Form Submission
async function handleFoundSubmit(e) {
    e.preventDefault();

    const imageFile = document.getElementById('foundImage').files[0];
    let imageData = null;

    if (imageFile) {
        // Validate file size (5MB max)
        if (imageFile.size > 5 * 1024 * 1024) {
            showNotification('Image size should be less than 5MB', 'error');
            return;
        }
        imageData = await fileToBase64(imageFile);
    }

    const item = {
        id: Date.now(),
        type: 'found',
        name: document.getElementById('foundItemName').value,
        category: document.getElementById('foundCategory').value,
        date: document.getElementById('foundDate').value,
        location: document.getElementById('foundLocation').value,
        description: document.getElementById('foundDescription').value,
        reporterName: document.getElementById('foundReporterName').value,
        reporterContact: document.getElementById('foundReporterContact').value,
        reporterEmail: document.getElementById('foundReporterEmail').value,
        storageLocation: document.getElementById('foundStorageLocation').value,
        image: imageData,
        timestamp: new Date().toISOString(),
        status: 'active'
    };

    foundItems.push(item);
    localStorage.setItem('foundItems', JSON.stringify(foundItems));

    showNotification('Found item reported successfully! Owner can now contact you.', 'success');
    e.target.reset();
    updateStats();
    displayItems();
    
    // Scroll to items section
    setTimeout(() => scrollToSection('items'), 1000);
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Update statistics
function updateStats() {
    const activeLost = lostItems.filter(item => item.status === 'active').length;
    const activeFound = foundItems.filter(item => item.status === 'active').length;
    const returned = lostItems.filter(item => item.status === 'returned').length + 
                     foundItems.filter(item => item.status === 'returned').length;
    
    // Get items from last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recent = [...lostItems, ...foundItems].filter(item => 
        new Date(item.timestamp) > weekAgo
    ).length;

    document.getElementById('totalLost').textContent = activeLost;
    document.getElementById('totalFound').textContent = activeFound;
    document.getElementById('totalReturned').textContent = returned;
    document.getElementById('recentItems').textContent = recent;

    updateCategoryStats();
    updateLocationStats();
    updateRecentActivity();
}

// Update category statistics
function updateCategoryStats() {
    const allItems = [...lostItems, ...foundItems];
    const categories = {};
    
    allItems.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + 1;
    });

    const sortedCategories = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const maxCount = sortedCategories[0] ? sortedCategories[0][1] : 1;
    
    const html = sortedCategories.map(([category, count]) => `
        <div class="stat-bar">
            <span class="stat-label">${category}</span>
            <div class="stat-progress">
                <div class="stat-progress-bar" style="width: ${(count/maxCount)*100}%">
                    ${count}
                </div>
            </div>
        </div>
    `).join('');

    document.getElementById('categoryStats').innerHTML = html || '<p>No data available</p>';
}

// Update location statistics
function updateLocationStats() {
    const allItems = [...lostItems, ...foundItems];
    const locations = {};
    
    allItems.forEach(item => {
        locations[item.location] = (locations[item.location] || 0) + 1;
    });

    const sortedLocations = Object.entries(locations)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const maxCount = sortedLocations[0] ? sortedLocations[0][1] : 1;
    
    const html = sortedLocations.map(([location, count]) => `
        <div class="stat-bar">
            <span class="stat-label">${location}</span>
            <div class="stat-progress">
                <div class="stat-progress-bar" style="width: ${(count/maxCount)*100}%">
                    ${count}
                </div>
            </div>
        </div>
    `).join('');

    document.getElementById('locationStats').innerHTML = html || '<p>No data available</p>';
}

// Update recent activity
function updateRecentActivity() {
    const allItems = [...lostItems, ...foundItems]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);

    const html = allItems.map(item => {
        const date = new Date(item.timestamp).toLocaleDateString('en-IN');
        const type = item.type === 'lost' ? 'Lost' : 'Found';
        return `
            <div class="activity-item">
                <strong>${type}:</strong> ${item.name} - ${item.location} (${date})
            </div>
        `;
    }).join('');

    document.getElementById('recentActivity').innerHTML = html || '<p>No recent activity</p>';
}

// Display items in grid
function displayItems() {
    let items = getFilteredItems();
    const grid = document.getElementById('itemsGrid');
    const noItemsMessage = document.getElementById('noItemsMessage');

    if (items.length === 0) {
        grid.innerHTML = '';
        noItemsMessage.style.display = 'block';
        return;
    }

    noItemsMessage.style.display = 'none';
    
    const html = items.map(item => createItemCard(item)).join('');
    grid.innerHTML = html;

    // Add click listeners to cards
    document.querySelectorAll('.item-card').forEach(card => {
        card.addEventListener('click', function() {
            const itemId = parseInt(this.dataset.id);
            const itemType = this.dataset.type;
            showItemDetail(itemId, itemType);
        });
    });
}

// Create item card HTML
function createItemCard(item) {
    const typeClass = item.type === 'lost' ? 'lost' : 'found';
    const typeBadge = item.type === 'lost' ? 'Lost Item' : 'Found Item';
    const icon = getCategoryIcon(item.category);
    const formattedDate = new Date(item.date).toLocaleDateString('en-IN');
    const daysAgo = Math.floor((new Date() - new Date(item.timestamp)) / (1000 * 60 * 60 * 24));

    return `
        <div class="item-card ${typeClass}" data-id="${item.id}" data-type="${item.type}">
            ${item.image ? 
                `<img src="${item.image}" alt="${item.name}" class="item-image">` : 
                `<div class="item-image placeholder"><i class="${icon}"></i></div>`
            }
            <div class="item-content">
                <span class="item-badge ${typeClass}">${typeBadge}</span>
                <h3 class="item-title">${item.name}</h3>
                <div class="item-category">
                    <i class="${icon}"></i>
                    <span>${item.category}</span>
                </div>
                <div class="item-info">
                    <div class="item-info-row">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${item.location}</span>
                    </div>
                    <div class="item-info-row">
                        <i class="fas fa-calendar"></i>
                        <span>${formattedDate}</span>
                    </div>
                </div>
                <p class="item-description">${item.description}</p>
                <div class="item-footer">
                    <span class="item-date">${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago</span>
                    <button class="contact-btn" onclick="event.stopPropagation(); showItemDetail(${item.id}, '${item.type}')">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Get category icon
function getCategoryIcon(category) {
    const icons = {
        'Electronics': 'fas fa-laptop',
        'Books': 'fas fa-book',
        'Clothing': 'fas fa-tshirt',
        'ID Cards': 'fas fa-id-card',
        'Keys': 'fas fa-key',
        'Bags': 'fas fa-briefcase',
        'Sports': 'fas fa-basketball-ball',
        'Jewelry': 'fas fa-gem',
        'Other': 'fas fa-box'
    };
    return icons[category] || 'fas fa-box';
}

// Filter items based on search and filters
function getFilteredItems() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;

    let items = [...lostItems, ...foundItems];

    // Apply filters
    if (typeFilter !== 'all') {
        items = items.filter(item => item.type === typeFilter);
    }

    if (categoryFilter !== 'all') {
        items = items.filter(item => item.category === categoryFilter);
    }

    if (searchTerm) {
        items = items.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.location.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm)
        );
    }

    // Apply sorting
    items.sort((a, b) => {
        if (sortFilter === 'newest') {
            return new Date(b.timestamp) - new Date(a.timestamp);
        } else if (sortFilter === 'oldest') {
            return new Date(a.timestamp) - new Date(b.timestamp);
        } else if (sortFilter === 'name') {
            return a.name.localeCompare(b.name);
        }
        return 0;
    });

    return items;
}

// Filter items (called on search/filter change)
function filterItems() {
    displayItems();
}

// Show item detail in modal
function showItemDetail(itemId, itemType) {
    const items = itemType === 'lost' ? lostItems : foundItems;
    const item = items.find(i => i.id === itemId);

    if (!item) return;

    const icon = getCategoryIcon(item.category);
    const formattedDate = new Date(item.date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const html = `
        ${item.image ? `<img src="${item.image}" alt="${item.name}" class="modal-image">` : ''}
        <h2 class="modal-title">
            <i class="${icon}"></i> ${item.name}
        </h2>
        <span class="item-badge ${item.type}">${item.type === 'lost' ? 'Lost Item' : 'Found Item'}</span>
        
        <div class="modal-info">
            <div class="modal-info-row">
                <i class="fas fa-list"></i>
                <strong>Category:</strong>
                <span>${item.category}</span>
            </div>
            <div class="modal-info-row">
                <i class="fas fa-calendar"></i>
                <strong>Date ${item.type === 'lost' ? 'Lost' : 'Found'}:</strong>
                <span>${formattedDate}</span>
            </div>
            <div class="modal-info-row">
                <i class="fas fa-map-marker-alt"></i>
                <strong>Location:</strong>
                <span>${item.location}</span>
            </div>
            ${item.storageLocation ? `
            <div class="modal-info-row">
                <i class="fas fa-warehouse"></i>
                <strong>Stored At:</strong>
                <span>${item.storageLocation}</span>
            </div>
            ` : ''}
            <div class="modal-info-row">
                <i class="fas fa-align-left"></i>
                <strong>Description:</strong>
                <span>${item.description}</span>
            </div>
        </div>

        <div class="modal-contact">
            <h4><i class="fas fa-user-circle"></i> Contact Information</h4>
            <div class="contact-details">
                <p><i class="fas fa-user"></i> <strong>Name:</strong> ${item.reporterName}</p>
                <p><i class="fas fa-phone"></i> <strong>Phone:</strong> <a href="tel:${item.reporterContact}">${item.reporterContact}</a></p>
                ${item.reporterEmail ? `<p><i class="fas fa-envelope"></i> <strong>Email:</strong> <a href="mailto:${item.reporterEmail}">${item.reporterEmail}</a></p>` : ''}
            </div>
        </div>

        <div style="margin-top: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="contactReporter('${item.reporterContact}', '${item.reporterName}')">
                <i class="fas fa-phone"></i> Call Now
            </button>
            ${item.reporterEmail ? `
            <button class="btn btn-secondary" onclick="emailReporter('${item.reporterEmail}', '${item.name}')">
                <i class="fas fa-envelope"></i> Send Email
            </button>
            ` : ''}
            <button class="btn btn-submit" onclick="markAsReturned(${item.id}, '${item.type}')">
                <i class="fas fa-check"></i> Mark as Returned
            </button>
        </div>
    `;

    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('itemModal').classList.add('show');
}

// Close modal
function closeModal() {
    document.getElementById('itemModal').classList.remove('show');
}

// Contact reporter
function contactReporter(phone, name) {
    window.location.href = `tel:${phone}`;
    showNotification(`Calling ${name}...`, 'info');
}

// Email reporter
function emailReporter(email, itemName) {
    const subject = encodeURIComponent(`Regarding: ${itemName}`);
    const body = encodeURIComponent(`Hi,\n\nI am contacting you regarding the item "${itemName}" that you reported.\n\nThank you.`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    showNotification('Opening email client...', 'info');
}

// Mark item as returned
function markAsReturned(itemId, itemType) {
    if (!confirm('Are you sure this item has been returned to its owner?')) {
        return;
    }

    const items = itemType === 'lost' ? lostItems : foundItems;
    const item = items.find(i => i.id === itemId);
    
    if (item) {
        item.status = 'returned';
        if (itemType === 'lost') {
            localStorage.setItem('lostItems', JSON.stringify(lostItems));
        } else {
            localStorage.setItem('foundItems', JSON.stringify(foundItems));
        }
        
        showNotification('Item marked as returned! Thank you for helping.', 'success');
        closeModal();
        updateStats();
        displayItems();
    }
}

// Show notification toast
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Demo data for testing (optional - remove in production)
function loadDemoData() {
    if (lostItems.length === 0 && foundItems.length === 0) {
        // Add some demo lost items
        const demoLost = [
            {
                id: 1,
                type: 'lost',
                name: 'Black Leather Wallet',
                category: 'Other',
                date: '2024-11-20',
                location: 'Library 2nd Floor',
                description: 'Black leather wallet with college ID card inside. Has a small scratch on the back.',
                reporterName: 'Rahul Kumar',
                reporterContact: '9876543210',
                reporterEmail: 'rahul@college.edu',
                image: null,
                timestamp: new Date('2024-11-20').toISOString(),
                status: 'active'
            },
            {
                id: 2,
                type: 'lost',
                name: 'iPhone 13 Pro',
                category: 'Electronics',
                date: '2024-11-22',
                location: 'Canteen',
                description: 'Space gray iPhone 13 Pro with black case. Cracked screen protector.',
                reporterName: 'Priya Sharma',
                reporterContact: '9876543211',
                reporterEmail: 'priya@college.edu',
                image: null,
                timestamp: new Date('2024-11-22').toISOString(),
                status: 'active'
            }
        ];

        // Add some demo found items
        const demoFound = [
            {
                id: 3,
                type: 'found',
                name: 'Blue Water Bottle',
                category: 'Other',
                date: '2024-11-23',
                location: 'Basketball Court',
                description: 'Milton blue water bottle, 1 liter capacity with some stickers.',
                reporterName: 'Amit Patel',
                reporterContact: '9876543212',
                reporterEmail: 'amit@college.edu',
                storageLocation: 'Sports Room',
                image: null,
                timestamp: new Date('2024-11-23').toISOString(),
                status: 'active'
            },
            {
                id: 4,
                type: 'found',
                name: 'Engineering Mathematics Book',
                category: 'Books',
                date: '2024-11-24',
                location: 'Lab 3',
                description: 'Higher Engineering Mathematics by B.S. Grewal, has owner name on first page.',
                reporterName: 'Neha Singh',
                reporterContact: '9876543213',
                reporterEmail: 'neha@college.edu',
                storageLocation: 'Department Office',
                image: null,
                timestamp: new Date('2024-11-24').toISOString(),
                status: 'active'
            }
        ];

        lostItems = demoLost;
        foundItems = demoFound;
        localStorage.setItem('lostItems', JSON.stringify(lostItems));
        localStorage.setItem('foundItems', JSON.stringify(foundItems));
        
        updateStats();
        displayItems();
    }
}

// Uncomment the line below to load demo data on first visit
// loadDemoData();