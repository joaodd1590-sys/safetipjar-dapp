// THEME TOGGLE
document.getElementById("themeToggle").addEventListener("click", () => {
    const body = document.body;
    const isDark = body.getAttribute("data-theme") === "dark";
    body.setAttribute("data-theme", isDark ? "light" : "dark");
    document.getElementById("themeToggle").textContent = isDark ? "🌙" : "☀️";
});

// HIDE CARDS ON LOAD
document.getElementById("snapshotCard").classList.add("hidden");
document.getElementById("activityCard").classList.add("hidden");

// BUTTON + ENTER SUPPORT
document.getElementById("scanBtn").addEventListener("click", runScan);
document.getElementById("walletInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") runScan();
});

// MAIN FUNCTION
async function runScan() {
    const wallet = document.getElementById("walletInput").value.trim();
    const status = document.getElementById("statusMsg");

    if (!wallet.startsWith("0x")) {
        status.textContent = "Invalid address.";
        return;
    }

    status.textContent = "Loading wallet activity...";
    document.getElementById("snapshotCard").classList.add("hidden");
    document.getElementById("activityCard").classList.add("hidden");

    try {
        const resp = await fetch(`/api/arc?address=${wallet}`);
        const data = await resp.json();

        if (!data || !data.txCount) {
            status.textContent = "No activity found.";
            return;
        }

        // SNAPSHOT
        document.getElementById("walletDisplay").textContent = shorten(wallet);
        document.getElementById("txCount").textContent = data.txCount;
        document.getElementById("active").textContent = data.isActive ? "Yes" : "No";

        // EXPLORER
        document.getElementById("openExplorer").onclick = () =>
            window.open(`https://testnet.arcscan.app/address/${wallet}`, "_blank");

        // COPY LINK
        document.getElementById("copyLink").onclick = async () => {
            await navigator.clipboard.writeText(window.location.href + `?wallet=${wallet}`);
        };

        // ACTIVITY LOG
        const log = document.getElementById("activityLog");
        log.innerHTML = "";

        data.txs.forEach(tx => {
            const div = document.createElement("div");
            div.className = "tx-item";
            div.innerHTML = `
                <strong>${tx.hash.slice(0, 12)}...</strong>
                <span class="${tx.direction === "IN" ? "tx-in" : "tx-out"}">${tx.direction}</span>
                • ${tx.amount} USDC • ${tx.time}
            `;
            log.appendChild(div);
        });

        status.textContent = "";
        document.getElementById("snapshotCard").classList.remove("hidden");
        document.getElementById("activityCard").classList.remove("hidden");

    } catch (err) {
        status.textContent = "Error fetching data.";
    }
}

function shorten(addr) {
    return addr.slice(0, 6) + "..." + addr.slice(-4);
}
