const FIREBASE_BASE_URL = "https://smart-shopper-432ad-default-rtdb.firebaseio.com/"; 
let cart = [];
let localGlobalProducts = {};
let blitzScore = 0;

window.onload = function() {
    loadProducts();
    if(typeof navigateTo === 'function') navigateTo('home');
}

// ROUTING MATRIX
function navigateTo(pageId) {
    document.querySelectorAll('.app-page').forEach(page => page.classList.remove('active-page'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    const targetPage = document.getElementById(`page-${pageId}`);
    if(targetPage) targetPage.classList.add('active-page');
    
    const targetTab = document.getElementById(`tab-${pageId}`);
    if(targetTab) targetTab.classList.add('active');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ASYNC CORE SYSTEM LOADER
function loadProducts() {
    const productsDisplay = document.getElementById('productsDisplay');
    const offersDisplay = document.getElementById('offersDisplay');

    fetch(FIREBASE_BASE_URL + "settings/whatsapp.json").then(res => res.json()).then(link => {
        if (link) {
            if(document.getElementById('uiWhatsappLink')) document.getElementById('uiWhatsappLink').href = link;
            if(document.getElementById('footerGroupLink')) document.getElementById('footerGroupLink').href = link;
        }
    });

    fetch(FIREBASE_BASE_URL + "products.json").then(res => res.json()).then(data => {
        if (!data) {
            if(productsDisplay) productsDisplay.innerHTML = `<p style='grid-column:1/-1; text-align:center; color:#94a3b8;'>Inventory Empty!</p>`;
            if(offersDisplay) offersDisplay.innerHTML = `<p style='grid-column:1/-1; text-align:center; color:#94a3b8;'>No Offers Active.</p>`;
            return;
        }
        localGlobalProducts = data;
        renderProductGrids(data);
    }).catch(err => console.error("Error loading products:", err));
}

function renderProductGrids(data) {
    const pDisplay = document.getElementById('productsDisplay');
    const oDisplay = document.getElementById('offersDisplay');
    if(pDisplay) pDisplay.innerHTML = ''; 
    if(oDisplay) oDisplay.innerHTML = '';
    
    Object.keys(data).forEach(key => {
        const product = data[key];
        if (!product || !product.name) return;
        
        const isSoldOut = product.status === 'Sold Out';
        const cardStyle = isSoldOut ? 'style="opacity: 0.6;"' : '';
        const imgList = product.images && product.images.length > 0 ? product.images : ['https://via.placeholder.com/300'];
        
        // Dynamic Variant Integration Dropdown Matrix
        let selectorHTML = '';
        if (product.variants && product.variants.length > 0) {
            selectorHTML = `<div class="variant-box" style="margin: 10px 0;">
            <label style="font-size:11px; font-weight:700; color:var(--primary-teal); display:block; margin-bottom:4px;">SELECT VARIANT</label>
            <select class="variant-selector" id="sel-${key}" onchange="handleVariantChange('${key}')" style="width:100%; padding:6px; border-radius:6px; border:1px solid #cbd5e1; background:transparent; color:inherit;">`;
            product.variants.forEach((v, idx) => {
                selectorHTML += `<option value="${idx}">${v.name} - LKR ${Number(v.price).toLocaleString()}</option>`;
            });
            selectorHTML += `</select></div>`;
        } else {
            selectorHTML = `<div class="variant-box" style="margin: 10px 0;"><p style="margin:0; font-weight:700; font-size:14px; color:var(--primary-teal);">LKR ${Number(product.price || 0).toLocaleString()}</p></div>`;
        }

        const cardContent = `
            <div class="product-card" ${cardStyle} style="background:var(--card-light); padding:15px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:15px;">
                <div class="card-img-container" onclick="openProductView('${key}')" style="cursor:pointer; text-align:center; height:180px; display:flex; align-items:center; justify-content:center; overflow:hidden; background:#f8fafc; border-radius:8px;">
                    <img id="img-${key}" src="${imgList[0]}" alt="Product Image" style="max-width:100%; max-height:100%; object-fit:contain;">
                </div>
                <div class="thumbnail-bar" style="display:flex; gap:5px; margin-top:8px; overflow-x:auto; padding-bottom:4px;">
                    ${imgList.map((imgUrl, idx) => `<img class="thumb-img ${idx===0?'active':''}" src="${imgUrl}" onclick="swapCardImage('${key}', '${imgUrl}', this)" style="width:35px; height:35px; object-fit:cover; border-radius:4px; border:1px solid #cbd5e1; cursor:pointer;">`).join('')}
                </div>
                <div style="margin-top:10px;" onclick="openProductView('${key}')" style="cursor:pointer;">
                    <h4 style="margin:0 0 4px 0; font-size:15px; font-weight:700;">${product.name}</h4>
                    <span style="background:${isSoldOut?'#ef4444':'#10b981'}; color:white; padding:2px 6px; border-radius:8px; font-size:9px; font-weight:bold;">${product.status || 'Available'}</span>
                </div>
                
                ${selectorHTML}
                
                <div class="qty-control" style="display:flex; align-items:center; justify-content:center; gap:15px; margin: 10px 0;">
                    <button class="qty-btn" onclick="adjustCardQty('${key}', -1)" style="width:28px; height:28px; border-radius:5px; border:1px solid #cbd5e1; background:transparent; cursor:pointer; color:inherit;">-</button>
                    <span class="qty-val" id="qty-${key}" style="font-weight:700;">1</span>
                    <button class="qty-btn" onclick="adjustCardQty('${key}', 1)" style="width:28px; height:28px; border-radius:5px; border:1px solid #cbd5e1; background:transparent; cursor:pointer; color:inherit;">+</button>
                </div>

                <div class="action-row" style="display:flex; gap:8px;">
                    <button class="smart-btn-secondary" onclick="addToCartEngine('${key}', false)" style="flex:1; padding:8px; font-size:12px; border-radius:6px; cursor:pointer; border:1px solid var(--primary-teal); background:transparent; color:var(--primary-teal); font-weight:700;"><i class="fa-solid fa-cart-plus"></i> + Cart</button>
                    <button class="smart-btn-primary" onclick="addToCartEngine('${key}', true)" style="flex:1; padding:8px; font-size:12px; border-radius:6px; cursor:pointer; background:var(--primary-teal); color:white; border:none; font-weight:700;"><i class="fa-solid fa-bag-shopping"></i> Buy Now</button>
                </div>
            </div>
        `;

        if (product.isOffer) {
            if(oDisplay) oDisplay.innerHTML += cardContent;
        } else {
            if(pDisplay) pDisplay.innerHTML += cardContent;
        }
        
        setTimeout(() => { handleVariantChange(key); }, 100);
    });
}

function handleVariantChange(key) {
    const prod = localGlobalProducts[key];
    const selectEl = document.getElementById(`sel-${key}`);
    if (!prod || !selectEl) return;

    const selectedIdx = parseInt(selectEl.value);
    const chosenVariant = prod.variants[selectedIdx];

    if (chosenVariant && chosenVariant.image) {
        const mainImg = document.getElementById(`img-${key}`);
        if (mainImg) mainImg.src = chosenVariant.image;
    }
}

function swapCardImage(key, url, el) {
    const mainImg = document.getElementById(`img-${key}`);
    if(mainImg) mainImg.src = url;
    const thumbs = el.parentElement.querySelectorAll('.thumb-img');
    thumbs.forEach(t => t.classList.remove('active'));
    el.classList.add('active');
}

function adjustCardQty(key, amt) {
    const el = document.getElementById(`qty-${key}`);
    if(!el) return;
    let val = parseInt(el.innerText) + amt;
    if (val < 1) val = 1;
    el.innerText = val;
}

function addToCartEngine(key, launchDirectCheckout) {
    const prod = localGlobalProducts[key];
    if(!prod) return;
    if(prod.status === 'Sold Out') { alert("Out of stock!"); return; }

    const qtyEl = document.getElementById(`qty-${key}`);
    const qty = qtyEl ? parseInt(qtyEl.innerText) : 1;
    let finalName = prod.name;
    let finalPrice = parseFloat(prod.price || 0);
    let finalImg = prod.images ? prod.images[0] : 'https://via.placeholder.com/150';

    const selectEl = document.getElementById(`sel-${key}`);
    if (selectEl) {
        const selectedIdx = parseInt(selectEl.value);
        const chosenVariant = prod.variants[selectedIdx];
        if(chosenVariant) {
            finalName += ` (${chosenVariant.name})`;
            finalPrice = parseFloat(chosenVariant.price);
            if (chosenVariant.image) finalImg = chosenVariant.image;
        }
    }

    const cartItem = {
        productId: key, 
        name: finalName,
        price: finalPrice,
        qty: qty,
        img: finalImg
    };

    cart.push(cartItem);
    updateCartUIState();

    if (launchDirectCheckout) navigateTo('cart');
    else alert(`✅ Added ${qty}x ${finalName} to cart suite.`);
}

function updateCartUIState() {
    if(document.getElementById('cartBadgeCount')) document.getElementById('cartBadgeCount').innerText = cart.length;
    const container = document.getElementById('cartItemsContainer');
    const totalEl = document.getElementById('cartSubtotalValue');
    
    if (!container) return;
    if (cart.length === 0) {
        container.innerHTML = `<p style="color:#94a3b8; text-align:center; padding:20px; font-size:14px;">Cart Suite Empty.</p>`;
        if(totalEl) totalEl.innerText = "LKR 0.00";
        return;
    }

    container.innerHTML = '';
    let totalSum = 0;
    cart.forEach((item, index) => {
        totalSum += (item.price * item.qty);
        container.innerHTML += `
            <div class="cart-item-row" style="display:flex; align-items:center; gap:10px; border-bottom:1px solid #e2e8f0; padding:10px 0;">
                <img src="${item.img}" style="width:45px; height:45px; object-fit:cover; border-radius:6px;">
                <div style="flex:1;">
                    <h4 style="margin:0; font-size:14px;">${item.name}</h4>
                    <span style="font-size:11px; color:#64748b; display:block;">ID: ${item.productId}</span>
                    <p style="margin:2px 0; font-size:12px; color:var(--primary-teal); font-weight:700;">LKR ${item.price.toLocaleString()} x ${item.qty}</p>
                </div>
                <div style="text-align:right;">
                    <button onclick="removeCartItem(${index})" style="background:none; border:none; color:#ef4444; cursor:pointer;"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;
    });
    if(totalEl) totalEl.innerText = `LKR ${totalSum.toLocaleString()}`;
}

function removeCartItem(idx) {
    cart.splice(idx, 1);
    updateCartUIState();
}

// CHECKOUT CART (WITH ORIGINAL MESSAGING & EMOJIS REDIRECTED TO YOUR NUMBER)
function checkoutCart() {
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();

    if(!name || !phone || !address) { alert("Please complete checkout forms accurately."); return; }
    if(cart.length === 0) { alert("Cart Suite is completely empty!"); return; }

    const generatedOrderId = "SS-" + Math.floor(Math.random()*90000 + 10000);
    const currentDate = new Date().toLocaleDateString();

    let finalTotal = 0;
    let itemsStructure = [];
    
    // Exact Original Text Format with all original Emojis preserved
    let orderMsg = `🧾 *OFFICIAL ORDER RECEIPT - Smart Shopper* 🧾\n\n`;
    orderMsg += `🆔 *Order ID Reference:* ${generatedOrderId}\n`;
    orderMsg += `📅 *Date Logged:* ${currentDate}\n\n`;
    orderMsg += `👤 *Customer Name:* ${name}\n`;
    orderMsg += `📞 *WhatsApp Contact:* ${phone}\n`;
    orderMsg += `📍 *Delivery Location:* ${address}\n\n`;
    orderMsg += `📦 *Purchased Items Statement:*\n`;

    cart.forEach(item => {
        const itemSum = item.price * item.qty;
        finalTotal += itemSum;
        orderMsg += `- [ID: ${item.productId}] ${item.name} (x${item.qty}) -> LKR ${itemSum.toLocaleString()}\n`;
        
        itemsStructure.push({
            productId: item.productId, 
            name: item.name,           
            qty: item.qty,
            price: item.price
        });
    });
    orderMsg += `\n💰 *Total Price Amount:* LKR ${finalTotal.toLocaleString()}\n\n`;
    orderMsg += `🚀 *Thank you for placing order with Smart Shopper Ecosystem!*`;

    const orderPayload = {
        orderId: generatedOrderId,
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        date: currentDate,
        items: itemsStructure,
        totalCost: finalTotal
    };

    fetch(FIREBASE_BASE_URL + "orders.json", {
        method: "POST",
        body: JSON.stringify(orderPayload)
    }).then(() => {
        if(document.getElementById('rOrderId')) document.getElementById('rOrderId').innerText = generatedOrderId;
        if(document.getElementById('rName')) document.getElementById('rName').innerText = name;
        if(document.getElementById('rPhone')) document.getElementById('rPhone').innerText = phone;
        if(document.getElementById('rDate')) document.getElementById('rDate').innerText = currentDate;
        if(document.getElementById('rItems')) {
            document.getElementById('rItems').innerHTML = cart.map(i => `<p>[ID: ${i.productId}] ${i.name} x ${i.qty} - <strong>LKR ${(i.price*i.qty).toLocaleString()}</strong></p>`).join('');
        }
        if(document.getElementById('rTotal')) document.getElementById('rTotal').innerText = `LKR ${finalTotal.toLocaleString()}`;

        if(document.getElementById('receiptModal')) document.getElementById('receiptModal').style.display = 'block';

        // Redirects directly to your own shop number +94758487089
        setTimeout(() => {
            const shopWhatsAppNumber = "94758487089";
            const customerWhatsAppInvoiceUrl = `https://wa.me/${shopWhatsAppNumber}?text=${encodeURIComponent(orderMsg)}`;
            window.open(customerWhatsAppInvoiceUrl, '_blank');
            cart = [];
            updateCartUIState();
        }, 1800);
    }).catch(err => {
        alert("Database transaction failed. Please retry submission.");
    });
}

function searchProducts() {
    const input = document.getElementById('searchInput');
    if(!input) return;
    const query = input.value.toLowerCase().trim();
    document.querySelectorAll('.product-card').forEach(card => {
        const title = card.querySelector('h4').innerText.toLowerCase();
        card.style.display = title.includes(query) ? "block" : "none";
    });
}

function spinPremiumWheel() {
    const wheel = document.getElementById('wheelGraphic');
    if(!wheel) return;
    const randomDegreeMatrix = Math.floor(Math.random() * 360) + 1440;
    wheel.style.transform = `rotate(${randomDegreeMatrix}deg)`;
    setTimeout(() => { alert("🎉 Coupon Selected! Share with support for reward processing."); }, 2600);
}

function registerBlitzHit() {
    blitzScore++;
    if(document.getElementById('blitzScore')) document.getElementById('blitzScore').innerText = blitzScore;
    if (blitzScore >= 10) {
        alert("🥇 Score threshold hit! Contact administration matrix for reward points.");
        blitzScore = 0;
        if(document.getElementById('blitzScore')) document.getElementById('blitzScore').innerText = blitzScore;
    }
    const target = document.getElementById('blitzTarget');
    if(target) {
        target.style.top = `${Math.floor(Math.random() * 70) + 10}%`;
        target.style.left = `${Math.floor(Math.random() * 80) + 10}%`;
    }
}

function toggleTheme() { document.body.classList.toggle('dark-theme'); }
function toggleReceiptModal() { 
    const m = document.getElementById('receiptModal'); 
    if(m) m.style.display = m.style.display === 'block' ? 'none' : 'block'; 
}
