// ============ AUTHENTICATION CHECK ============
function checkAuth() {
    const token = localStorage.getItem("authToken");
    const username = localStorage.getItem("username");

    if (!token) {
        window.location.href = "login.html";
        return false;
    }

    document.getElementById("userDisplay").innerText = username || "Staff";
    return true;
}

// ============ LOGOUT FUNCTION ============
async function logout() {
    const token = localStorage.getItem("authToken");
    
    try {
        await fetch("http://localhost:3000/api/logout", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error("Logout error:", error);
    }

    localStorage.clear();
    window.location.href = "login.html";
}

// ============ AUTO-CALCULATE TOTAL AMOUNT ============
document.getElementById("qty").addEventListener("input", calculateTotal);
document.getElementById("price").addEventListener("input", calculateTotal);

function calculateTotal() {
    const qty = parseFloat(document.getElementById("qty").value) || 0;
    const price = parseFloat(document.getElementById("price").value) || 0;
    const total = qty * price;

    document.getElementById("totalAmount").value = total > 0 ? "₹" + total.toFixed(2) : "₹0";
}

// ============ SUBMIT BILLING FORM ============
document.getElementById("billingForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const product = document.getElementById("product").value.trim();
    const qty = parseFloat(document.getElementById("qty").value);
    const price = parseFloat(document.getElementById("price").value);
    const paymentMode = document.getElementById("paymentMode").value;
    const token = localStorage.getItem("authToken");

    // Validation
    if (!product || !qty || !price || !paymentMode) {
        showMessage("❌ Please fill in all fields", "error-msg");
        return;
    }

    if (qty <= 0 || price <= 0) {
        showMessage("❌ Quantity and Price must be greater than 0", "error-msg");
        return;
    }

    try {
        showMessage("⏳ Processing sale...", "info-msg");

        const response = await fetch("http://localhost:3000/api/addSale", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                product: product,
                qty: qty,
                price: price,
                paymentMode: paymentMode
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to record sale");
        }

        // Success!
        showMessage(
            `✅ ${data.message}\n💾 Transaction ID: #${data.transaction.id}\n💰 Amount: ₹${data.transaction.amount}\n🔐 Hash: ${data.transaction.hash}`,
            "success-msg"
        );

        // Clear form
        document.getElementById("billingForm").reset();
        document.getElementById("totalAmount").value = "₹0";

        // Reload stats
        setTimeout(() => {
            loadStats();
            loadTransactions();
        }, 1000);

    } catch (error) {
        showMessage("❌ Error: " + error.message, "error-msg");
        console.error("Billing error:", error);
    }
});

// ============ LOAD DASHBOARD STATS ============
async function loadStats() {
    const token = localStorage.getItem("authToken");

    try {
        const response = await fetch("http://localhost:3000/api/dashboard", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        document.getElementById("todaysSales").innerText = "₹" + data.totalSales.toLocaleString();
        document.getElementById("txCount").innerText = data.transactionCount;
        
        const avgAmount = data.transactionCount > 0 
            ? (data.totalSales / data.transactionCount).toFixed(0)
            : 0;
        document.getElementById("avgAmount").innerText = "₹" + parseInt(avgAmount).toLocaleString();

    } catch (error) {
        console.error("Stats error:", error);
    }
}

// ============ LOAD RECENT TRANSACTIONS ============
async function loadTransactions() {
    const token = localStorage.getItem("authToken");

    try {
        const response = await fetch("http://localhost:3000/api/transactions", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const transactions = await response.json();

        const transactionList = document.getElementById("transactionList");

        if (transactions.length === 0) {
            transactionList.innerHTML = `
            <p style="padding: 20px; text-align: center; color: #999;">
                No transactions yet. Record your first sale above.
            </p>
            `;
            return;
        }

        let html = `
        <table style="width: 100%; margin: 0;">
        <thead style="position: sticky; top: 0; background: #4a76d4; color: white;">
        <tr>
        <th style="padding: 10px; text-align: left;">ID</th>
        <th style="padding: 10px; text-align: left;">Product</th>
        <th style="padding: 10px; text-align: right;">Amount</th>
        <th style="padding: 10px; text-align: left;">Mode</th>
        <th style="padding: 10px; text-align: left;">Time</th>
        <th style="padding: 10px; text-align: left;">Status</th>
        </tr>
        </thead>
        <tbody>
        `;

        // Show latest 10 transactions
        transactions.slice(-10).reverse().forEach(tx => {
            const isVoided = tx.is_voided;
            html += `
            <tr style="border-bottom: 1px solid #eee; background: ${isVoided ? '#ffeaea' : 'white'};">
            <td style="padding: 10px; font-weight: bold;">#${tx.id}</td>
            <td style="padding: 10px;">${tx.product}</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; color: #4a76d4;">₹${tx.amount}</td>
            <td style="padding: 10px;">${tx.payment_mode}</td>
            <td style="padding: 10px; font-size: 12px; color: #666;">${tx.timestamp}</td>
            <td style="padding: 10px;">
            <span class="badge ${isVoided ? 'danger' : 'success'}">
            ${isVoided ? '⚠️ VOIDED' : '✔️ VALID'}
            </span>
            </td>
            </tr>
            `;
        });

        html += `</tbody></table>`;
        transactionList.innerHTML = html;

    } catch (error) {
        console.error("Transaction error:", error);
        document.getElementById("transactionList").innerHTML = `
        <p style="padding: 20px; color: #c33;">
            ❌ Error loading transactions: ${error.message}
        </p>
        `;
    }
}

// ============ UTILITY: SHOW MESSAGE ============
function showMessage(message, className) {
    const msgDiv = document.getElementById("msg");
    msgDiv.innerHTML = message.replace(/\n/g, "<br>");
    msgDiv.className = className;
    msgDiv.style.display = "block";

    // Auto-hide success/info messages
    if (!className.includes("error")) {
        setTimeout(() => {
            msgDiv.style.display = "none";
        }, 5000);
    }
}

// ============ INITIALIZE ON PAGE LOAD ============
window.addEventListener("load", () => {
    if (checkAuth()) {
        loadStats();
        loadTransactions();
        // Auto-refresh every 10 seconds
        setInterval(loadStats, 10000);
        setInterval(loadTransactions, 10000);
    }
});