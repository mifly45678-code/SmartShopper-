const FIREBASE_BASE_URL = "https://smart-shopper-432ad-default-rtdb.firebaseio.com/"; 
let cart = [];
let gameScore = 0;

function loadProducts() {
    const productsDisplay = document.getElementById('productsDisplay');
    const offersDisplay = document.getElementById('offersDisplay');
    
    fetch(FIREBASE_BASE_URL + "products.json")
    .then(res => res.json())
    .then(data => {
        if (!data) {
            productsDisplay.innerHTML = `<p class="no-products">Inventory is being updated by Admin!</p>`;
            offersDisplay.innerHTML = `<p class="no-products">No special offers today.</p>`;
            return;
        }

        productsDisplay.innerHTML = '';
        offersDisplay.innerHTML = '';
        let hasOffers = false;

        Object.keys(data).forEach(key => {
            const product = data[key];
            if (product && product.name) {
                const isSoldOut = product.status === 'Sold Out';
                const isOffer = product.isOffer === true || product.offerPrice;
                
                const cardStyle = isSoldOut ? 'style="opacity: 0.55; border-color: #ef4444;"' : '';
                
                let priceHTML = `<p class="prod-price">Rs. ${product.price || '0'}</p>`;
                if(isOffer && product.offerPrice) {
                    priceHTML = `<p class="prod-price"><span class="slashed-price">Rs. ${product.price}</span> Rs. ${product.offerPrice}</p>`;
                }

                const actionButton = isSoldOut 
                    ? `<button class="buy-now-btn" style="background:#64748b; cursor:not-allowed;" disabled>🔴 Out of Stock</button>`
                    : `<button class="buy-now-btn" onclick="addToCart('${key}', '${product.name}', ${isOffer ? product.offerPrice : product.price}, '${product.image}')"><i class="fa-solid fa-cart-plus"></i> Add to Luxury Cart</button>`;
                
                const badge = isSoldOut 
                    ? `<span class="badge badge-danger">SOLD OUT</span>` 
                    : (isOffer ? `<span class="badge badge-warning">TODAY OFFER 🔥</span>` : `<span class="badge badge-success">Group Offer 💎</span>`);

                const productCardTemplate = `
                    <div class="product-card" ${cardStyle}>
                        ${badge}
                        <img src="${product.image || 'https://via.placeholder.com/150'}" alt="${product.name}">
                        <h4>${product.name}</h4>
                        <p class="prod-id">ID: ${product.id || 'N/A'}</p>
                        ${priceHTML}
                        <p class="prod-desc">${product.description || ''}</p>
                        ${actionButton}
                    </div>
                `;

                if (isOffer && !isSoldOut) {
                    offersDisplay.innerHTML += productCardTemplate;
                    hasOffers = true;
                } else {
                    productsDisplay.innerHTML += productCardTemplate;
                }
            }
        });

        if(!hasOffers) {
            offersDisplay.innerHTML = `<p class="no-products" style="grid-column: 1/-1;">Check back later for exclusive flash sales!</p>`;
        }
    })
    .catch(err => console.error("Database connection issue:", err));
}

function addToCart(key, name, price, image) {
    const existingItem = cart.find(item => item.key === key);
    if(existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ key, name, price, image, quantity: 1 });
    }
    updateCartUI();
    
    // Smooth iOS Touch Pulse Feedback
    const countBadge = document.getElementById('cart-count');
    countBadge.style.transform = 'scale(1.4)';
    setTimeout(() => countBadge.style.transform = 'scale(1)', 300);
}

function updateCartUI() {
    document.getElementById('cart-count').innerText = cart.reduce((total, item) => total + item.quantity, 0);
    const cartList = document.getElementById('cartItemsList');
    
    if(cart.length === 0) {
        cartList.innerHTML = `<p style="text-align:center; padding:20px; color:#64748b;">Your cart is empty. Treat yourself today!</p>`;
        document.getElementById('cartTotalCost').innerText = "Rs. 0";
        return;
    }

    cartList.innerHTML = '';
    let total = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        cartList.innerHTML += `
            <div class="cart-item">
                <img src="${item.image}" width="40" height="40" style="border-radius:6px; object-fit:cover;">
                <div style="flex:1; margin-left:10px;">
                    <h5 style="margin:0; font-size:14px;">${item.name}</h5>
                    <small style="color:var(--primary-teal); font-weight:600;">Rs. ${item.price} x ${item.quantity}</small>
                </div>
                <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#ef4444; cursor:pointer;"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
    });
    document.getElementById('cartTotalCost').innerText = "Rs. " + total;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function handleOrderSubmit(e) {
    e.preventDefault();
    if(cart.length === 0) { return alert("Your luxury cart is empty!"); }

    const orderId = 'ORD' + Date.now();
    const custName = document.getElementById('custName').value;
    const custAddress = document.getElementById('custAddress').value;
    const custPhone = document.getElementById('custPhone').value;
    const totalAmount = document.getElementById('cartTotalCost').innerText;

    const orderPayload = {
        orderId: orderId,
        name: custName,
        address: custAddress,
        phone: custPhone,
        items: cart,
        total: totalAmount,
        date: new Date().toLocaleDateString(),
        status: 'Pending'
    };

    fetch(FIREBASE_BASE_URL + "orders.json", {
        method: "POST",
        body: JSON.stringify(orderPayload)
    })
    .then(res => res.json())
    .then(() => {
        // Trigger automated Email structure for Gmail application protocol
        let emailBody = `New Order Received!\n\nOrder ID: ${orderId}\nCustomer Name: ${custName}\nPhone: ${custPhone}\nAddress: ${custAddress}\nTotal Amount: ${totalAmount}\n\nOrdered Products:\n`;
        cart.forEach(i => { emailBody += `- ${i.name} (Qty: ${i.quantity}) - Price: Rs.${i.price}\n`; });
        
        const mailtoUrl = `mailto:smartshopperindustry@gmail.com?subject=NEW ORDER ${orderId} - ${custName}&body=${encodeURIComponent(emailBody)}`;
        window.location.href = mailtoUrl;

        // Generate Invoice Data mapping
        document.getElementById('rOrderId').innerText = orderId;
        document.getElementById('rName').innerText = custName;
        document.getElementById('rPhone').innerText = custPhone;
        document.getElementById('rDate').innerText = orderPayload.date;
        
        let itemsHtml = '';
        cart.forEach(i => { itemsHtml += `<p>${i.name} x ${i.quantity} <span style="float:right;">Rs. ${i.price * i.quantity}</span></p>`; });
        document.getElementById('rItems').innerHTML = itemsHtml;
        document.getElementById('rTotal').innerText = totalAmount;

        alert(`✨ Order Transmitted successfully!\nOpening Invoice Receipt...`);
        cart = [];
        updateCartUI();
        document.getElementById('customerOrderForm').reset();
        toggleCartModal();
        toggleReceiptModal();
    })
    .catch(err => alert("Submission failed: " + err));
}

// Search Algorithm
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

// Modals Toggle Actions
function toggleCartModal() { const m = document.getElementById('cartModal'); m.style.display = m.style.display === 'block' ? 'none' : 'block'; }
function toggleGameModal() { const m = document.getElementById('gameModal'); m.style.display = m.style.display === 'block' ? 'none' : 'block'; moveTarget(); }
function toggleAboutModal() { const m = document.getElementById('aboutModal'); m.style.display = m.style.display === 'block' ? 'none' : 'block'; }
function toggleReceiptModal() { const m = document.getElementById('receiptModal'); m.style.display = m.style.display === 'block' ? 'none' : 'block'; }

// Embedded Mini Game Engine 
function moveTarget() {
    const target = document.getElementById('targetBulb');
    if(!target) return;
    const x = Math.floor(Math.random() * 200) - 100;
    const y = Math.floor(Math.random() * 200) - 100;
    target.style.transform = `translate(${x}px, ${y}px)`;
}
function hitTarget() {
    gameScore++;
    document.getElementById('gameScore').innerText = gameScore;
    if(gameScore === 5) { alert("🎉 Magnificent! You got game style! Enjoy your luxury purchase."); gameScore = 0; toggleGameModal(); }
    moveTarget();
}

// Light & Dark Modern Engine
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (body.classList.contains('light-theme')) {
        body.classList.replace('light-theme', 'dark-theme');
        themeIcon.className = "fa-solid fa-sun";
        themeBtn.innerHTML = `<i class="fa-solid fa-sun" style="color:#f59e0b;"></i> <span>Light Mode</span>`;
    } else {
        body.classList.replace('dark-theme', 'light-theme');
        themeIcon.className = "fa-solid fa-moon";
        themeBtn.innerHTML = `<i class="fa-solid fa-moon"></i> <span>Dark Mode</span>`;
    }
}

window.onload = loadProducts;
