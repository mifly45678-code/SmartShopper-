// Firebase Database Link Connected Automatically
const FIREBASE_BASE_URL = "https://smart-shopper-432ad-default-rtdb.firebaseio.com/"; 

// Products Fetch & Display with Premium Design Badges
function loadProducts() {
    const productsDisplay = document.getElementById('productsDisplay');
    
    fetch(FIREBASE_BASE_URL + "products.json")
    .then(res => res.json())
    .then(data => {
        if (!data) {
            productsDisplay.innerHTML = `<p class="no-products">No products available at the moment. Admin is updating stock!</p>`;
            return;
        }

        productsDisplay.innerHTML = '';
        Object.keys(data).forEach(key => {
            const product = data[key];
            if (product && product.name) {
                const isSoldOut = product.status === 'Sold Out';
                
                // UX Overhaul elements
                const cardStyle = isSoldOut ? 'style="opacity: 0.55; border-color: #ef4444;"' : '';
                const actionButton = isSoldOut 
                    ? `<button class="buy-now-btn" style="background:#64748b; cursor:not-allowed; box-shadow:none;" disabled>🔴 Out of Stock</button>`
                    : `<button class="buy-now-btn" onclick="quickSelect('${product.id || ''}')">Select to Buy</button>`;
                
                const soldOutBadge = isSoldOut ? `<span style="background:#ef4444; color:white; padding:4px 10px; font-size:11px; font-weight:bold; position:absolute; top:15px; left:15px; border-radius:30px; z-index:10; box-shadow:0 2px 8px rgba(239,68,68,0.4);">SOLD OUT</span>` : '';
                const offerBadge = !isSoldOut ? `<span style="background:#f59e0b; color:white; padding:4px 10px; font-size:11px; font-weight:bold; position:absolute; top:15px; right:15px; border-radius:30px; z-index:10;">Group Offer 🔥</span>` : '';

                productsDisplay.innerHTML += `
                    <div class="product-card" ${cardStyle}>
                        ${soldOutBadge}
                        ${offerBadge}
                        <img src="${product.image || 'https://via.placeholder.com/150'}" alt="${product.name}">
                        <h4>${product.name}</h4>
                        <p class="prod-id">ID: ${product.id || 'N/A'}</p>
                        <p class="prod-price">Rs. ${product.price || '0'}</p>
                        <p class="prod-desc">${product.description || ''}</p>
                        ${actionButton}
                    </div>
                `;
            }
        });
    })
    .catch(err => {
        console.error("Error loading products:", err);
        productsDisplay.innerHTML = `<p class="no-products">Error connecting to online database.</p>`;
    });
}

// Auto Scroll to Form & Auto Fill ID
function quickSelect(id) {
    document.getElementById('productSelect').value = id;
    document.getElementById('order-section').scrollIntoView({ behavior: 'smooth' });
    
    // Add real-time micro pulse focus effect
    const inputField = document.getElementById('productSelect');
    inputField.focus();
}

// Live instant keyup filter for high-efficiency search
function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const title = card.querySelector('h4').innerText.toLowerCase();
        const desc = card.querySelector('.prod-desc').innerText.toLowerCase();
        const prodId = card.querySelector('.prod-id').innerText.toLowerCase();
        
        if (title.includes(query) || desc.includes(query) || prodId.includes(query)) {
            card.style.display = "block";
            card.style.animation = "fadeIn 0.4s ease-in";
        } else {
            card.style.display = "none";
        }
    });
}

// Order Submission
function handleOrderSubmit(e) {
    e.preventDefault();
    
    const order = {
        orderId: 'ORD' + Date.now(),
        name: document.getElementById('custName').value,
        address: document.getElementById('custAddress').value,
        phone: document.getElementById('custPhone').value,
        productId: document.getElementById('productSelect').value,
        status: 'Pending',
        date: new Date().toLocaleDateString()
    };

    fetch(FIREBASE_BASE_URL + "orders.json", {
        method: "POST",
        body: JSON.stringify(order)
    })
    .then(res => res.json())
    .then(data => {
        alert(`✨ Order Submitted Online Successfully!\nYour Order ID is: ${order.orderId}`);
        document.getElementById('customerOrderForm').reset();
    })
    .catch(err => alert("Failed to submit order. Try again. Error: " + err));
}

// Enhanced UI Theme Toggler
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    const themeBtn = document.getElementById('theme-toggle-btn');

    if (body.classList.contains('light-theme')) {
        body.classList.replace('light-theme', 'dark-theme');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        themeBtn.innerHTML = `<i id="theme-icon" class="fa-solid fa-sun" style="color:#f59e0b;"></i> Light Mode`;
    } else {
        body.classList.replace('dark-theme', 'light-theme');
        themeIcon.classList.replace('fa-sun', 'fa-moon');
        themeBtn.innerHTML = `<i id="theme-icon" class="fa-solid fa-moon"></i> Dark Mode`;
    }
}

window.onload = loadProducts;
