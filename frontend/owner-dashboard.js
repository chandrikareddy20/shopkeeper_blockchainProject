// ============ AUTHENTICATION CHECK ============
function checkAuth() {
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole");
    const username = localStorage.getItem("username");

    if (!token || role !== "owner") {
        window.location.href = "login.html";
        return false;
    }

    document.getElementById("userDisplay").innerText = `${username} (Owner)`;
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

// ============ LOAD DASHBOARD DATA ============
async function loadDashboard() {
    const token = localStorage.getItem("authToken");

    try {
        const response = await fetch("http://localhost:3000/api/dashboard", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        // Update UI with data
        document.getElementById("totalSales").innerText = "₹" + data.totalSales.toLocaleString();
        document.getElementById("saleCount").innerText = data.transactionCount + " transactions";
        document.getElementById("totalExpenses").innerText = "₹" + data.totalExpenses.toLocaleString();
        document.getElementById("netProfit").innerText = "₹" + data.netProfit.toLocaleString();
        document.getElementById("profitMargin").innerText = 
            ((data.netProfit / data.totalSales * 100) || 0).toFixed(1) + "% margin";
        const statusEl = document.getElementById("blockchainStatus");
        if (!data.blockchainConnected) {
            statusEl.innerText = "❌ Offline";
        } else if (!data.contractDeployed) {
            statusEl.innerText = "⚠️ Not Deployed";
        } else {
            statusEl.innerText = "✔ Active";
        }

        document.getElementById("lastAnchorTime").innerText =
            data.lastAnchorTime ? new Date(data.lastAnchorTime).toLocaleString() : "Not anchored yet";

        document.getElementById("validTxCount").innerText = 
            (data.transactionCount - data.voidedCount);
        document.getElementById("voidedTxCount").innerText = data.voidedCount;
        document.getElementById("voidedAmount").innerText = "₹" + data.totalVoided.toLocaleString();

        // Load anchor count
        const anchorsResponse = await fetch("http://localhost:3000/api/anchors", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const anchorsData = await anchorsResponse.json();
        document.getElementById("totalAnchors").innerText = anchorsData.total_anchors;

    } catch (error) {
        showMessage("Error loading dashboard: " + error.message, "error-msg");
        console.error("Dashboard error:", error);
    }
}



// ============ VIEW TRANSACTION DETAILS ============
async function viewTransactions() {
    const token = localStorage.getItem("authToken");

    try {
        const response = await fetch("http://localhost:3000/api/transactions", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const transactions = await response.json();

        let html = `<h3>📊 All Transactions</h3>
                   <p style="color: #666; font-size: 13px; margin-bottom: 15px;">
                   Total: ${transactions.length} transactions
                   </p>
                   <table>
                   <thead>
                   <tr>
                   <th>ID</th>
                   <th>Product</th>
                   <th>Qty</th>
                   <th>Price</th>
                   <th>Amount</th>
                   <th>Mode</th>
                   <th>Date</th>
                   <th>Hash (Preview)</th>
                   <th>Status</th>
                   <th>Action</th>
                   </tr>
                   </thead>
                   <tbody>`;

        transactions.forEach(tx => {
            const isVoided = tx.is_voided;
            html += `
            <tr style="background: ${isVoided ? '#ffeaea' : 'white'};">
            <td>#${tx.id}</td>
            <td>${tx.product}</td>
            <td>${tx.qty}</td>
            <td>₹${tx.price}</td>
            <td style="font-weight: bold; color: #4a76d4;">₹${tx.amount}</td>
            <td>${tx.payment_mode}</td>
            <td style="font-size: 12px;">${tx.timestamp}</td>
            <td style="font-family: monospace; font-size: 10px;" title="${tx.full_hash}">${tx.current_hash}</td>
            <td><span class="badge ${isVoided ? 'danger' : 'success'}">${tx.status}</span></td>
            <td>
            ${!isVoided ? `<button style="background: #e74c3c; padding: 5px 10px; font-size: 11px;" onclick="voidTransaction(${tx.id})">Void</button>` : 'Voided'}
            </td>
            </tr>
            `;
        });

        html += `</tbody></table>`;

        showCustomModal(html);

    } catch (error) {
        showMessage("Error loading transactions: " + error.message, "error-msg");
    }
}

// ============ VOID TRANSACTION ============
async function voidTransaction(txId) {
    const token = localStorage.getItem("authToken");

    if (!confirm(`⚠️ Are you sure you want to void transaction #${txId}? This action is permanent.`)) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/void/${txId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(`✅ Transaction #${txId} has been voided (marked, not deleted)`, "success-msg");
            setTimeout(() => {
                viewTransactions();
                loadDashboard();
            }, 1500);
        } else {
            showMessage("❌ " + data.message, "error-msg");
        }

    } catch (error) {
        showMessage("Error voiding transaction: " + error.message, "error-msg");
    }
}

// ============ VIEW ADMIN LOGS ============
async function viewAdminLogs() {
    const token = localStorage.getItem("authToken");

    try {
        const response = await fetch("http://localhost:3000/api/adminLogs", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        let html = `<h3>📋 Admin Activity Logs</h3>
                   <p style="color: #666; font-size: 13px; margin-bottom: 15px;">
                   Recent Activities: ${data.total_logs} total log entries
                   </p>
                   <table>
                   <thead>
                   <tr>
                   <th>ID</th>
                   <th>Action</th>
                   <th>User</th>
                   <th>Timestamp</th>
                   <th>IP Address</th>
                   </tr>
                   </thead>
                   <tbody>`;

        data.logs.forEach(log => {
            html += `
            <tr>
            <td>#${log.id}</td>
            <td style="font-size: 12px;">${log.action}</td>
            <td>${log.userId}</td>
            <td style="font-size: 11px;">${new Date(log.timestamp).toLocaleString()}</td>
            <td style="font-size: 11px;">${log.ip}</td>
            </tr>
            `;
        });

        html += `</tbody></table>`;

        showCustomModal(html);

    } catch (error) {
        showMessage("Error loading logs: " + error.message, "error-msg");
    }
}

// ============ VERIFY BLOCKCHAIN INTEGRITY ============
async function verifyBlockchain() {
    const token = localStorage.getItem("authToken");

    try {
        showMessage("🔄 Verifying blockchain integrity...", "info-msg");

        const response = await fetch("http://localhost:3000/api/verify", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(
                `✅ ${data.status}\n${data.message}\nLast Hash: ${data.last_hash.substring(0, 20)}...`,
                "success-msg"
            );
        } else {
            showMessage(
                `❌ ${data.status}\nTampered at Transaction #${data.broken_at_transaction_id}`,
                "error-msg"
            );
        }

    } catch (error) {
        showMessage("Error verifying blockchain: " + error.message, "error-msg");
    }
}

// ============ DEPLOY CONTRACT ============
async function deployContract() {
    const token = localStorage.getItem("authToken");

    try {
        showMessage("🚀 Deploying smart contract to Ganache...", "info-msg");

        const response = await fetch("http://localhost:3000/api/deploy-contract", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(
                `✅ ${data.message}\nContract Address: ${data.contract_address}\nNetwork: ${data.network}`,
                "success-msg"
            );
            setTimeout(() => loadDashboard(), 2000);
        } else {
            showMessage("❌ " + data.message, "error-msg");
        }

    } catch (error) {
        showMessage("Error deploying contract: " + error.message, "error-msg");
    }
}

// ============ CREATE BLOCKCHAIN ANCHOR ============
async function createAnchor() {
    const token = localStorage.getItem("authToken");

    try {
        showMessage("🔗 Creating blockchain anchor...", "info-msg");

        const response = await fetch("http://localhost:3000/api/anchor", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(
                `✅ ${data.message}\nAnchor ID: #${data.anchor.id}\nTX Count: ${data.anchor.tx_count}\nBlockchain TX: ${data.anchor.blockchain_tx_id}`,
                "success-msg"
            );
            setTimeout(() => loadDashboard(), 2000);
        } else {
            showMessage("❌ " + data.message, "error-msg");
        }

    } catch (error) {
        showMessage("Error creating anchor: " + error.message, "error-msg");
    }
}

// ============ VIEW ANCHOR HISTORY ============
async function viewAnchorHistory() {
    const token = localStorage.getItem("authToken");

    try {
        const response = await fetch("http://localhost:3000/api/anchors", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        let html = `<h3>🔗 Blockchain Anchor History</h3>
                   <p style="color: #666; font-size: 13px; margin-bottom: 15px;">
                   Total Anchors Created: ${data.total_anchors}
                   </p>
                   <table>
                   <thead>
                   <tr>
                   <th>Anchor ID</th>
                   <th>Hash (Preview)</th>
                   <th>Transactions</th>
                   <th>Timestamp</th>
                   <th>Blockchain TX ID</th>
                   <th>Status</th>
                   </tr>
                   </thead>
                   <tbody>`;

        data.anchors.forEach(anchor => {
            html += `
            <tr>
            <td>#${anchor.id}</td>
            <td style="font-family: monospace; font-size: 11px;">${anchor.anchor_hash}</td>
            <td>${anchor.tx_count}</td>
            <td>${new Date(anchor.timestamp).toLocaleString()}</td>
            <td style="font-family: monospace; font-size: 11px;">${anchor.blockchain_tx_id}</td>
            <td><span class="badge success">${anchor.status}</span></td>
            </tr>
            `;
        });

        html += `</tbody></table>`;

        showCustomModal(html);

    } catch (error) {
        showMessage("Error loading anchor history: " + error.message, "error-msg");
    }
}

// ============ UTILITY: NAVIGATE ============
function navigateTo(page) {
    window.location.href = page;
}

// ============ UTILITY: SHOW MESSAGE ============
function showMessage(message, className) {
    const messageDiv = document.getElementById("statusMessage");
    messageDiv.innerHTML = message.replace(/\n/g, "<br>");
    messageDiv.className = className;
    messageDiv.style.display = "block";
    
    // Auto-hide after 5 seconds (unless error)
    if (!className.includes("error")) {
        setTimeout(() => {
            messageDiv.style.display = "none";
        }, 5000);
    }
}

// ============ UTILITY: SHOW MODAL ============
function showCustomModal(html) {
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
        align-items: flex-start;
        z-index: 1000;
        overflow: auto;
        padding: 20px;
    `;

    const content = document.createElement("div");
    content.style.cssText = `
        background: white;
        padding: 30px;
        max-width: 90%;
        width: 100%;
        max-height: 90vh;
        border-radius: 12px;
        overflow-y: auto;
        margin-top: 20px;
    `;

    content.innerHTML = html + `
    <button style="margin-top: 20px; background: #4a76d4;" onclick="this.closest('body').querySelector('[data-modal]').remove()">Close</button>
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

// ============ INITIALIZE ON PAGE LOAD ============
window.addEventListener("load", () => {
    if (checkAuth()) {
        loadDashboard();
        // Refresh every 30 seconds
        setInterval(loadDashboard, 30000);
    }
});