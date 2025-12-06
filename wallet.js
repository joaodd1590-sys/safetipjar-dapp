// =========================
// CONFIG
// =========================
const API_BASE = "https://arc-backend-production.up.railway.app";
let userAddress = "";


// =========================
// HELPERS
// =========================

// Remove " ARC" e converte para número real
function cleanNumber(str) {
    if (!str) return 0;
    return parseFloat(str.replace(" ARC", "").trim());
}

// Formata endereço para exibir
function shortAddr(addr) {
    return addr.slice(0, 6) + "..." + addr.slice(-4);
}


// =========================
// LOAD WALLET DATA
// =========================
async function loadWallet() {
    const input = document.getElementById("wallet-input");
    const address = input.value.trim();

    if (!address) {
        alert("Enter a valid wallet address.");
        return;
    }

    userAddress = address;
    document.getElementById("wallet-address").innerHTML = shortAddr(address);

    await loadActivity(address);
}


// =========================
// LOAD ACTIVITY (Transactions)
// =========================
async function loadActivity(address) {
    try {
        const res = await fetch(`${API_BASE}/activity/${address}`);
        const data = await res.json();

        if (!data?.transactions) {
            document.getElementById("activity-list").innerHTML =
                "<div class='no-data'>No transactions found</div>";
            return;
        }

        renderActivity(data.transactions);

    } catch (err) {
        console.error("Activity load error:", err);
        document.getElementById("activity-list").innerHTML =
            "<div class='no-data'>Error loading activity</div>";
    }
}


// =========================
// RENDER TRANSACTIONS
// =========================
function renderActivity(transactions) {
    const list = document.getElementById("activity-list");
    list.innerHTML = "";

    transactions.forEach(tx => {
        const value = cleanNumber(tx.value).toFixed(6);
        const gas = cleanNumber(tx.gas).toFixed(6);
        const total = cleanNumber(tx.total).toFixed(6);

        const direction =
            tx.from.toLowerCase() === userAddress.toLowerCase()
                ? "OUT"
                : "IN";

        const item = document.createElement("div");
        item.className = "activity-item";

        item.innerHTML = `
            <div class="activity-row">
                <span class="type ${direction.toLowerCase()}">${direction}</span>
                <span class="value">${value} ARC</span>
            </div>

            <div class="activity-info">
                <span>Gas: ${gas} ARC</span>
                <span>Total: ${total} ARC</span>
            </div>

            <div class="activity-meta">
                <span>${tx.time}</span>
                <a href="${tx.link}" target="_blank">Open</a>
            </div>
        `;

        list.appendChild(item);
    });
}


// =========================
// BUTTON LISTENERS
// =========================

// Run Scan button
document.getElementById("run-scan").addEventListener("click", loadWallet);

// ENTER key triggers scan
document.getElementById("wallet-input").addEventListener("keypress", e => {
    if (e.key === "Enter") loadWallet();
});
