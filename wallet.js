// ===========================================
//  ARC ACTIVITY TRACKER — FRONTEND CONTROLLER
// ===========================================

import { fetchWalletActivity } from "./wallet.js";

// Seletores
const addrInput = document.getElementById("addr");
const checkBtn = document.getElementById("check");
const terminal = document.getElementById("terminal");

const summary = document.getElementById("summary");
const tcount = document.getElementById("tcount");
const firstTx = document.getElementById("first");
const lastTx = document.getElementById("last");
const statusEl = document.getElementById("status");

const snapWallet = document.getElementById("snapWallet");
const snapTx = document.getElementById("snapTx");
const snapActive = document.getElementById("snapActive");

const copyLinkBtn = document.getElementById("copyLink");
const openExplorerBtn = document.getElementById("openExplorer");

// ===========================================
//  TERMINAL HELPERS
// ===========================================

function clearTerminal() {
    terminal.innerHTML = "";
}

function appendTx(tx, wallet) {
    const isOut = tx.from.toLowerCase() === wallet.toLowerCase();
    const badge = isOut
        ? `<span class="tx-badge-out">OUT</span>`
        : `<span class="tx-badge-in">IN</span>`;

    const div = document.createElement("div");
    div.className = "tx-row";

    div.innerHTML = `
        <div class="tx-left">
            <div class="tx-hash">${tx.hash}</div>
            <div class="tx-meta">
                ${tx.from} → ${tx.to}
                • ${tx.value} USDC
                • ${tx.time}
            </div>
        </div>

        <div class="tx-actions">
            ${badge}
            <button class="tx-btn" onclick="navigator.clipboard.writeText('${tx.hash}')">
                Copy
            </button>
            <button class="tx-btn" onclick="window.open('${tx.link}', '_blank')">
                Explorer
            </button>
        </div>
    `;

    terminal.appendChild(div);
}

// ===========================================
//  MAIN SCAN FUNCTION
// ===========================================

async function runScan() {
    const wallet = addrInput.value.trim();

    if (!wallet.startsWith("0x") || wallet.length < 20) {
        alert("Enter a valid Arc Testnet wallet address.");
        return;
    }

    terminal.innerHTML = `<span style="color:var(--muted)">Scanning...</span>`;
    summary.style.display = "none";

    const data = await fetchWalletActivity(wallet);

    const txs = data.transactions || [];

    // Update snapshot
    snapWallet.textContent = wallet;
    snapTx.textContent = txs.length;
    snapActive.innerHTML = txs.length
        ? `<span class="badge-in">Yes</span>`
        : `<span class="badge-out">No</span>`;

    // Update summary
    tcount.textContent = txs.length;
    if (txs.length > 0) {
        firstTx.textContent = txs[txs.length - 1].time;
        lastTx.textContent = txs[0].time;
        statusEl.textContent = "ACTIVE";
        statusEl.style.color = "var(--neon-cyan)";
    } else {
        firstTx.textContent = "--";
        lastTx.textContent = "--";
        statusEl.textContent = "NO ACTIVITY";
        statusEl.style.color = "var(--neon-pink)";
    }

    summary.style.display = "flex";

    // Render TX list
    clearTerminal();

    if (txs.length === 0) {
        terminal.innerHTML = `<span style="color:var(--muted)">No transactions found.</span>`;
        return;
    }

    txs.forEach(tx => appendTx(tx, wallet));
}

// ===========================================
//  BUTTON EVENTS
// ===========================================

checkBtn.onclick = runScan;

addrInput.addEventListener("keydown", e => {
    if (e.key === "Enter") runScan();
});

copyLinkBtn.onclick = () => {
    const wallet = addrInput.value.trim();
    if (!wallet) return;

    navigator.clipboard.writeText(`${location.origin}/?addr=${wallet}`);
    alert("Profile link copied!");
};

openExplorerBtn.onclick = () => {
    const wallet = addrInput.value.trim();
    if (!wallet) return;

    window.open(`https://arcscan.net/address/${wallet}`, "_blank");
};

// ===========================================
//  AUTO-LOAD IF URL HAS ?addr=
// ===========================================
(function () {
    const params = new URLSearchParams(location.search);
    const a = params.get("addr");

    if (a && a.startsWith("0x")) {
        addrInput.value = a;
        runScan();
    }
})();
