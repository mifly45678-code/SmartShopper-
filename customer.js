// Firebase Database Link Connected Automatically
const FIREBASE_BASE_URL = "https://smart-shopper-432ad-default-rtdb.firebaseio.com/"; 

// Firebase-ல் இருந்து பொருள்களை எடுத்து கஸ்டமருக்கு காட்டுதல்
function loadProducts() {
    const productsDisplay = document.getElementById('productsDisplay');
    
    // இந்த வரி இப்போ 100% சரி செய்யப்பட்டுள்ளது
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
                productsDisplay.innerHTML += `
                    <div class="product-card">
                        <img src="${product.image || 'https://via.placeholder.com/150'}" alt="${product.name}">
                        <h4>${product.name}</h4>
                        <p class="prod-id">ID: ${product.id || 'N/A'}</p>
                        <p class="prod-price">Rs. ${product.price || '0'}</p>
                        <p class="prod-desc">${product.description || ''}</p>
                        <button class="buy-now-btn" onclick="quickSelect('${product.id || ''}')">Select to Buy</button>
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

// Quick select product ID for the form
function quickSelect(id) {
    document.getElementById('productSelect').value = id;
    document.getElementById('order-section').scrollIntoView({ behavior: 'smooth' });
}

// Search filter function
function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const title = card.querySelector('h4').innerText.toLowerCase();
        const desc = card.querySelector('.prod-desc').innerText.toLowerCase();
        if (title.includes(query) || desc.includes(query)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

// கஸ்டமர் ஆர்டரை ஆன்லைன் டேட்டாபேஸுக்கு அனுப்புதல்
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

// Theme toggler logic (Light / Dark mode)
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    const themeBtn = document.getElementById('theme-toggle-btn');

    if (body.classList.contains('light-theme')) {
        body.classList.replace('light-theme', 'dark-theme');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        themeBtn.innerHTML = `<i id="theme-icon" class="fa-solid fa-sun"></i> Light Mode`;
    } else {
        body.classList.replace('dark-theme', 'light-theme');
        themeIcon.classList.replace('fa-sun', 'fa-moon');
        themeBtn.innerHTML = `<i id="theme-icon" class="fa-solid fa-moon"></i> Dark Mode`;
    }
}

window.onload = loadProducts;
