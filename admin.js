// Firebase Database Link Connected Automatically for smart-shopper-432ad
const FIREBASE_BASE_URL = "https://smart-shopper-432ad-default-rtdb.firebaseio.com/"; 
const SECRET_PASSWORD = "AdminSmartShopper2026"; 

// Admin Password Access Validation
function checkAdminPassword() {
    const input = document.getElementById('adminPass').value;
    if(input === SECRET_PASSWORD) {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-main-content').style.display = 'block';
        loadAdminDashboard();
    } else {
        alert("❌ Incorrect Access Password! Access Denied.");
    }
}

// Secure Logout Function
function logoutAdmin() {
    document.getElementById('adminPass').value = '';
    document.getElementById('admin-login').style.display = 'block';
    document.getElementById('admin-main-content').style.display = 'none';
}

// புதிய பொருளை அப்லோட் செய்து Firebase Online Database-ல் சேமித்தல்
function adminAddProduct(e) {
    e.preventDefault();
    
    const newProduct = {
        id: 'PROD' + Math.floor(Math.random() * 9000 + 1000),
        name: document.getElementById('prodName').value,
        price: document.getElementById('prodPrice').value,
        image: document.getElementById('prodImg').value,
        description: document.getElementById('prodDesc').value
    };

    // Firebase URL syntax fixed perfectly
    fetch(FIREBASE_BASE_URL + "products.json", {
        method: "POST",
        body: JSON.stringify(newProduct)
    })
    .then(res => res.json())
    .then(data => {
        alert(`✅ Product Uploaded Online Successfully!`);
        document.getElementById('uploadProductForm').reset();
    })
    .catch(err => alert("Upload failed: " + err));
}

// கஸ்டமர்கள் அனுப்பிய ஆர்டர்களை Firebase-ல் இருந்து எடுத்து அட்மின் டேபிளில் காட்டுதல்
function loadAdminDashboard() {
    const ordersDisplay = document.getElementById('adminOrdersDisplay');
    
    fetch(FIREBASE_BASE_URL + "orders.json")
    .then(res => res.json())
    .then(data => {
        if(!data) {
            ordersDisplay.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:15px;">No orders received yet.</td></tr>`;
            return;
        }

        ordersDisplay.innerHTML = '';
        // Firebase Online டேட்டாவை லூப் செய்து டேபிளில் அடுக்குதல்
        Object.keys(data).forEach(key => {
            const order = data[key];
            ordersDisplay.innerHTML += `
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 10px; font-weight:bold;">${order.orderId || 'N/A'}</td>
                    <td style="padding: 10px;">${order.name || 'N/A'}</td>
                    <td style="padding: 10px;">${order.address || 'N/A'}</td>
                    <td style="padding: 10px;">${order.phone || 'N/A'}</td>
                    <td style="padding: 10px; color:#1a9391;">${order.productId || 'N/A'}</td>
                    <td style="padding: 10px;">${order.date || 'N/A'}</td>
                    <td style="padding: 10px;">
                        <span style="background:orange; padding:3px 8px; border-radius:4px; color:white; font-size:12px;">${order.status || 'Pending'}</span>
                        <button onclick="deleteOrder('${key}')" style="background:red; color:white; border:none; padding:3px 7px; margin-left:5px; cursor:pointer; border-radius:3px;">Remove</button>
                    </td>
                </tr>
            `;
        });
    })
    .catch(err => console.error("Error loading dashboard:", err));
}

// Firebase Online Database-ல் இருந்து ஆர்டர் ரெக்கார்டை நீக்குதல்
function deleteOrder(firebaseKey) {
    if(confirm("Are you sure you want to remove this order record from Database?")) {
        fetch(FIREBASE_BASE_URL + `orders/${firebaseKey}.json`, {
            method: "DELETE"
        })
        .then(() => {
            alert("Order deleted from Database successfully.");
            loadAdminDashboard(); // Refresh current table view
        })
        .catch(err => alert("Error deleting: " + err));
    }
}
