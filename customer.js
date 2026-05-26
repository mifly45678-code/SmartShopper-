const FIREBASE_BASE_URL = "https://smart-shopper-432ad-default-rtdb.firebaseio.com/"; 
let cart = [];
let gameScore = 0;

function loadProducts() {
    const productsDisplay = document.getElementById('productsDisplay');
    const offersDisplay = document.getElementById('offersDisplay');
    
    // Auto sync Live WhatsApp Group Link configured from Admin
    fetch(FIREBASE_BASE_URL + "settings/whatsapp.json")
    .then(res => res.json())
    .then(link => {
        if (link) {
            document.getElementById('uiWhatsappLink').href = link;
        }
    });

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
                const isOffer = product.isOffer === true;
                const cardStyle = isSoldOut ? 'style="opacity: 0.55; border-color: #ef4444;"' : '';
                
                // Build dynamic variant system layout (AliExpress-style selection buttons)
                let selectorHTML = '';
                let initialImage = 'https://via.placeholder.com/150';
                let initialPriceHTML = '';
                
                if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
                    initialImage = product.variants[0].image;
                    
                    let basePrice = product.variants[0].price;
                    let baseOffer = product.variants[0].offerPrice;
                    if(baseOffer) {
                        initialPriceHTML = `<p class="prod-price" id="price_box_${key}"><span class="slashed-price">Rs. ${basePrice}</span> Rs. ${baseOffer}</p>`;
                    } else {
                        initialPriceHTML = `<p class="prod-price" id="price_box_${key}">Rs. ${basePrice}</p>`;
                    }

                    selectorHTML += `<div class="variant-selector-pane" style="margin: 10px 0; display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">`;
                    product.variants.forEach((v, idx) => {
                        const activeBorder = idx === 0 ? 'border: 2px solid var(--primary-teal);' : 'border: 1px solid #cbd5e1;';
                        selectorHTML += `
                            <img src="${v.image}" class="var-thumb-${key}" onclick="changeProductVariantView('${key}', '${v.image}', '${v.name}', ${v.price}, ${v.offerPrice || 'null'}, this)" 
                            style="width:36px; height:36px; object-fit:cover; border-radius:6px; cursor:pointer; ${activeBorder}" title="${v.name}">
                        `;
                    });
                    selectorHTML += `</div>`;
                }

                // Storage container tracking state values inside HTML element references
                const actionButton = isSoldOut 
                    ? `<button class="buy-now-btn" style="background:#64748b; cursor:not-allowed;" disabled>Out of Stock</button>`
                    : `<button class="buy-now-btn" id="btn_${key}" onclick="addActiveVariantToCart('${key}', '${product.name}')"><i class="fa-solid fa-cart-plus"></i> Add to Luxury Cart</button>`;
                
                const badge = isSoldOut 
                    ? `<span class="badge badge-danger">SOLD OUT</span>` 
                    : (isOffer ? `<span class="badge badge-warning">TODAY OFFER 🔥</span>` : `<span class="badge badge-success">Group Offer 📦</span>`);

                // Initial dataset injection attached safely to DOM node elements
                const firstVar = product.variants ? product.variants[0] : {name: 'Base', price: product.price, image: ''};
                const productCardTemplate = `
                    <div class="product-card" ${cardStyle} id="card_${key}" 
                         data-selected-name="${firstVar.name}" 
                         data-selected-price="${firstVar.offerPrice || firstVar.price}" 
                         data-selected-image="${initialImage}">
                        ${badge}
                        <img id="img_main_${key}" src="${initialImage}" alt="${product.name}" style="width:100%; height:230px; object-fit:cover; border-radius:20px;">
                        <h4>${product.name}</h4>
                        <p class="prod-id" id="variant_title_${key}" style="font-weight:700; color:#64748b; font-size:12px; margin:2px 0;">Model: ${firstVar.name}</p>
                        ${selectorHTML}
                        ${initialPriceHTML}
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

// Interactive Realtime Selection Engine
function changeProductVariantView(productKey, img, varName, price, offerPrice, thumbElement) {
    document.getElementById('img_main_' + productKey).src = img;
    document.getElementById('variant_title_' + productKey).innerText = "Model: " + varName;
    
    let priceBox = document.getElementById('price_box_' + productKey);
    let absoluteFinalPrice = price;
    
    if(offerPrice) {
        priceBox.innerHTML = `<span class="slashed-price">Rs. ${price}</span> Rs. ${offerPrice}`;
        absoluteFinalPrice = offerPrice;
    } else {
        priceBox.innerHTML = `Rs. ${price}`;
    }
    
    // Save selections directly to Card layout Node dataset attributes
    const card = document.getElementById('card_' + productKey);
    card.setAttribute('data-selected-name', varName);
    card.setAttribute('data-selected-price', absoluteFinalPrice);
    card.setAttribute('data-selected-image', img);

    // Reset visual boundaries highlighting active thumb state
    document.querySelectorAll('.var-thumb-' + productKey).forEach(el => el.style.border = '1px solid #cbd5e1');
    thumbElement.style.border = '2px solid var(--primary-teal)';
}

function addActiveVariantToCart(productKey, mainName) {
    const card = document.getElementById('card_' + productKey);
    const varName = card.getAttribute('data-selected-name');
    const finalPrice = parseFloat(card.getAttribute('data-selected-price'));
    const img = card.getAttribute('data-selected-image');
    
    const trackingCartKey = productKey + '_' + varName.replace(/\s+/g, '');
    
    const existingItem = cart.find(item => item.cartKey === trackingCartKey);
    if(existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ 
            cartKey: trackingCartKey, 
            key: productKey, 
            name: mainName, 
            variantName: varName, 
            price: finalPrice, 
            image: img, 
            quantity: 1 
        });
    }
    updateCartUI();
    
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
                    <small style="color:var(--primary-teal); font-weight:600; display:block;">Model: ${item.variantName}</small>
                    <small style="color:#64748b; font-weight:600;">Rs. ${item.price} x ${item.quantity}</small>
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
        let emailBody = `New Order Received!\n\nOrder ID: ${orderId}\nCustomer Name: ${custName}\nPhone: ${custPhone}\nAddress: ${custAddress}\nTotal Amount: ${totalAmount}\n\nOrdered Products:\n`;
        cart.forEach(i => { emailBody += `- ${i.name} [Model: ${i.variantName}] (Qty: ${i.quantity}) - Price: Rs.${i.price}\n`; });
        
        const mailtoUrl = `mailto:smartshopperindustry@gmail.com?subject=NEW ORDER ${orderId} - ${custName}&body=${encodeURIComponent(emailBody)}`;
        window.location.href = mailtoUrl;

        // Generate Invoice Data mapping
        document.getElementById('rOrderId').innerText = orderId;
        document.getElementById('rName').innerText = custName;
        document.getElementById('rPhone').innerText = custPhone;
        document.getElementById('rDate').innerText = orderPayload.date;
        
        let itemsHtml = '';
        cart.forEach(i => { itemsHtml += `<p>${i.name} (${i.variantName}) x ${i.quantity} <span style="float:right;">Rs. ${i.price * i.quantity}</span></p>`; });
        document.getElementById('rItems').innerHTML = itemsHtml;
        document.getElementById('rTotal').innerText = totalAmount;

        alert(`Order Transmitted successfully!\nOpening Invoice Receipt...`);
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

function toggleCartModal() { const m = document.getElementById('cartModal'); m.style.display = m.style.display === 'block' ? 'none' : 'block'; }
function toggleGameModal() { const m = document.getElementById('gameModal'); m.style.display = m.style.display === 'block' ? 'none' : 'block'; moveTarget(); }
function toggleAboutModal() { const m = document.getElementById('aboutModal'); m.style.display = m.style.display === 'block' ? 'none' : 'block'; }
function toggleReceiptModal() { const m = document.getElementById('receiptModal'); m.style.display = m.style.display === 'block' ? 'none' : 'block'; }

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
    if(gameScore === 5) { alert("Magnificent! You got game style! Enjoy your luxury purchase."); gameScore = 0; toggleGameModal(); }
    moveTarget();
}

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
