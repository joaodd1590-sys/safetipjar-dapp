const scanBtn = document.getElementById("scanBtn");
const walletInput = document.getElementById("walletInput");

const statusBox = document.getElementById("scanStatus");
const content = document.getElementById("content");

scanBtn.onclick = async () => {

    const address = walletInput.value.trim();
    if (!address) {
        alert("Enter a wallet address.");
        return;
    }

    statusBox.textContent = "Scanning Arc Testnet…";

    const res = await fetch(`/api/activity?address=${address}`);
    const data = await res.json();

    if (!data || data.error) {
        statusBox.textContent = "Error while scanning.";
        return;
    }

    /** SNAPSHOT **/
    document.getElementById("snapAddress").textContent = address;
    document.getElementById("snapTxCount").textContent = data.total;
    document.getElementById("snapActive").textContent = data.total > 0 ? "Yes" : "No";

    /** TX LIST **/
    const txList = document.getElementById("txList");
    txList.innerHTML = "";

    if (data.transactions.length === 0) {
        txList.innerHTML = "<p>No transactions found.</p>";
    }

    data.transactions.forEach(tx => {
        txList.innerHTML += `
            <div class="tx-item">
                <div class="tx-hash">${tx.hash.slice(0,12)}...</div>
                <div>From: ${tx.from}</div>
                <div>To: ${tx.to}</div>
                <div>Value: ${tx.value}</div>
                <div>Time: ${tx.time}</div>

                <button onclick="copy('${tx.hash}')">Copy Hash</button>
                <button onclick="openTx('${tx.hash}')">Explorer</button>
            </div>
        `;
    });

    content.classList.remove("hidden");
    statusBox.textContent = "Scan complete.";
};

function copy(text) {
    navigator.clipboard.writeText(text);
    alert("Copied!");
}

function openTx(hash) {
    window.open(`https://testnet.arcscan.app/tx/${hash}`);
}

document.getElementById("copyProfile").onclick = () => {
    const url = `https://testnet.arcscan.app/address/${walletInput.value}`;
    navigator.clipboard.writeText(url);
    alert("Profile link copied!");
};

document.getElementById("openArcScan").onclick = () => {
    window.open(`https://testnet.arcscan.app/address/${walletInput.value}`);
};
