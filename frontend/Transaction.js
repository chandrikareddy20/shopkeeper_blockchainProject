// ============ AUTHENTICATION CHECK ============
function checkAuth() {
    const token = localStorage.getItem("authToken");
    const username = localStorage.getItem("username");

    if (!token) {
        window.location.href = "login.html";
        return false;
    }

    document.getElementById("userDisplay").innerText = username || "User";
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

// ============ LOAD ALL TRANSACTIONS ============
let allTransactions = [];

async function loadTransactions() {
    const token = localStorage.getItem("authToken");

    try {
        const response = await fetch("http://localhost:3000/api/transactions", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        allTransactions = await response.json();
        displayTransactions(allTransactions);
        updateStats();

    } catch (error) {
        console.error("Error loading transactions:", error);
        document.getElementById("transactionTable").innerHTML = `
        <tr>
        <td colspan="9" style="text-align: center; padding: 30px; color: #c33;">
        ❌ Error loading transactions: ${error.message}
        </td>
        </tr>
        `;
    }
}

// ============ DISPLAY TRANSACTIONS ============
function displayTransactions(transactions) {
    const tableBody = document.getElementById("transactionTable");

    if (transactions.length === 0) {
        tableBody.innerHTML = `
        <tr>
        <td colspan="9" style="text-align: center; padding: 30px; color: #999;">
        📭 No transactions found
        </td>
        </tr>
        `;
        return;
    }

    let html = "";

    transactions.forEach(tx => {
        const isVoided = tx.is_voided;
        const statusBadge = `<span class="badge ${isVoided ? 'danger' : 'success'}">${tx.status}</span>`;

        html += `
        <tr style="background: ${isVoided ? '#ffeaea' : 'white'};">
        <td style="font-weight: bold;">#${tx.id}</td>
        <td>${tx.product}</td>
        <td>${tx.qty}</td>
        <td>₹${tx.price}</td>
        <td style="font-weight: bold; color: #4a76d4;">₹${tx.amount}</td>
        <td>${tx.payment_mode}</td>
        <td style="font-size: 12px;">${tx.timestamp}</td>
        <td style="font-family: monospace; font-size: 11px; cursor: pointer; color: #4a76d4;" 
            onclick="showFullHash('${tx.full_hash}', '${tx.id}')"
            title="Click to view full hash">
            ${tx.current_hash}
        </td>
        <td>${statusBadge}</td>
        </tr>
        `;
    });

    tableBody.innerHTML = html;
}

// ============ UPDATE STATISTICS ============
function updateStats() {
    const totalCount = allTransactions.length;
    const totalAmount = allTransactions
        .filter(tx => !tx.is_voided)
        .reduce((sum, tx) => sum + tx.amount, 0);
    const validCount = allTransactions.filter(tx => !tx.is_voided).length;
    const voidedCount = allTransactions.filter(tx => tx.is_voided).length;

    document.getElementById("totalCount").innerText = totalCount;
    document.getElementById("totalAmount").innerText = "₹" + totalAmount.toLocaleString();
    document.getElementById("validCount").innerText = validCount;
    document.getElementById("voidedCount").innerText = voidedCount;
}

// ============ APPLY FILTERS ============
function applyFilters() {
    const mode = document.getElementById("filterMode").value;
    const status = document.getElementById("filterStatus").value;

    let filtered = allTransactions;

    if (mode) {
        filtered = filtered.filter(tx => tx.payment_mode === mode);
    }

    if (status) {
        if (status === "VALID") {
            filtered = filtered.filter(tx => !tx.is_voided);
        } else if (status === "VOIDED") {
            filtered = filtered.filter(tx => tx.is_voided);
        }
    }

    displayTransactions(filtered);
}

// ============ RESET FILTERS ============
function resetFilters() {
    document.getElementById("filterMode").value = "";
    document.getElementById("filterStatus").value = "";
    displayTransactions(allTransactions);
}

// ============ SHOW FULL HASH MODAL ============
function showFullHash(fullHash, txId) {
    const modal = document.createElement("div");
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    const content = document.createElement("div");
    content.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
    `;

    content.innerHTML = `
    <h3 style="margin-bottom: 15px;">🔐 Full Hash for Transaction #${txId}</h3>
    <p style="color: #666; font-size: 13px; margin-bottom: 10px;">
        This SHA-256 hash is a cryptographic proof of this transaction's integrity. 
        Any modification to the transaction data will change this hash.
    </p>
    <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; word-break: break-all; 
                font-family: monospace; font-size: 12px; margin-bottom: 15px;">
        <strong style="color: #4a76d4;">${fullHash}</strong>
    </div>
    <div style="display: flex; gap: 10px;">
        <button style="flex: 1; background: #4a76d4;" onclick="copyToClipboard('${fullHash}')">
            📋 Copy Hash
        </button>
        <button style="flex: 1; background: #999;" onclick="this.closest('[data-modal]').remove()">
            Close
        </button>
    </div>
    `;
    content.setAttribute("data-modal", "true");

    modal.appendChild(content);
    document.body.appendChild(modal);

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

// ============ COPY TO CLIPBOARD ============
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("✅ Hash copied to clipboard!");
    }).catch(err => {
        alert("❌ Failed to copy: " + err);
    });
}

// ============ INITIALIZE ON PAGE LOAD ============
window.addEventListener("load", () => {
    if (checkAuth()) {
        loadTransactions();
        // Auto-refresh every 15 seconds
        setInterval(loadTransactions, 15000);
    }
});