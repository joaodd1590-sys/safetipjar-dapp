// Fake example scanner — substitute with your real API logic later
document.getElementById("runScan").addEventListener("click", () => {
    const w = document.getElementById("walletInput").value.trim();
    if (!w.startsWith("0x")) {
        alert("Enter a valid Arc Testnet wallet");
        return;
    }

    document.getElementById("walletAddress").innerText = w;
    document.getElementById("txCount").innerText = Math.floor(Math.random() * 100);
    document.getElementById("activeState").innerText = "Yes";
});

// COPY BUTTON WITH ANIMATION
document.getElementById("copyBtn").addEventListener("click", () => {
    const text = document.getElementById("walletAddress").innerText;

    navigator.clipboard.writeText(text);

    const btn = document.getElementById("copyBtn");
    btn.classList.add("copy-success");

    setTimeout(() => {
        btn.classList.remove("copy-success");
    }, 500);
});

// OPEN IN ARCSCAN
document.getElementById("explorerBtn").addEventListener("click", () => {
    const wallet = document.getElementById("walletAddress").innerText;
    if (wallet === "--") return;

    window.open(`https://testnet.arcscan.app/address/${wallet}`, "_blank");
});
