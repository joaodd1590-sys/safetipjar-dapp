// =======================================================
// ARC Activity Tracker - Frontend Logic (FINAL VERSION)
// =======================================================

const $ = sel => document.querySelector(sel);

const addrInput = $("#addr");
const checkBtn = $("#check");

const summary = $("#summary");
const tcount = $("#tcount");
const first = $("#first");
const last = $("#last");
const statusEl = $("#status");

const terminal = $("#terminal");

const snapWallet = $("#snapWallet");
const snapTx = $("#snapTx");
const snapActive = $("#snapActive");

const copyLink = $("#copyLink");
const openExplorer = $("#openExplorer");

// copy toast
const copyToast = $("#copyToast");
function showToast(msg = "Copied!") {
  copyToast.textContent = msg;
  copyToast.classList.add("show");
  setTimeout(() => copyToast.classList.remove("show"), 1200);
}

function clearTerminal() {
  terminal.innerHTML = "";
}

function appendLine(html) {
  const div = document.createElement("div");
  div.className = "tx";
  div.innerHTML = html;
  terminal.appendChild(div);
}

// =======================================================
// RUN SCAN
// =======================================================
async function runScan() {
  const wallet = addrInput.value.trim();

  if (!wallet.startsWith("0x") || wallet.length < 40) {
    alert("Paste a valid Arc Testnet wallet (0x...)");
    return;
  }

  summary.style.display = "none";

  snapWallet.textContent = wallet;

  terminal.innerHTML = `<div style="padding:12px;color:#999">Scanning...</div>`;

  try {
    const res = await fetch(`/api/activity?address=${wallet}`);
    if (!res.ok) {
      terminal.innerHTML = `<div style="padding:12px;color:#999">Server error: ${res.status}</div>`;
      return;
    }

    const data = await res.json();
    const txs = data.transactions || [];
    const total = txs.length;

    // Update Snapshot
    snapTx.textContent = total;
    if (total > 0) {
      snapActive.innerHTML = `<span class="badge-in">Yes</span>`;
    } else {
      snapActive.innerHTML = `<span class="badge-out">No</span>`;
    }

    // Update Summary
    tcount.textContent = total;
    first.textContent = total ? txs[txs.length - 1].time : "--";
    last.textContent = total ? txs[0].time : "--";

    statusEl.textContent = total > 0 ? "ACTIVE" : "NO ACTIVITY";
    statusEl.style.color = total > 0 ? "#00ffa5" : "#ff6b6b";

    summary.style.display = "flex";

    clearTerminal();

    if (!txs.length) {
      terminal.innerHTML = `<div style="padding:12px;color:#888">No transactions yet.</div>`;
      return;
    }

    // =======================================================
    // RENDER TRANSACTIONS (exactly like original layout)
    // =======================================================
    for (const tx of txs) {
      const valueUSDC = Number(tx.value) / 1e6; // USDC DECIMALS (6)
      const direction = tx.from.toLowerCase() === wallet.toLowerCase() ? "OUT" : "IN";

      const badge =
        direction === "IN"
          ? `<span class="badge-in">IN</span>`
          : `<span class="badge-out">OUT</span>`;

      const html = `
        <div class="left">
          <div class="hash">${tx.hash}</div>
          <div class="meta">
            ${tx.from} → ${tx.to} • ${valueUSDC.toFixed(4)} USDC • ${tx.time}
          </div>
        </div>

        <div class="actions">
          ${badge}
          <button class="btn-ghost" onclick="navigator.clipboard.writeText('${tx.hash}').then(()=>showToast('Copied!'))">Copy</button>
          <button class="btn-ghost" onclick="window.open('${tx.link}', '_blank')">Explorer</button>
        </div>
      `;

      appendLine(html);
    }

  } catch (err) {
    console.error(err);
    terminal.innerHTML = `<div style="padding:12px;color:#999">Network error.</div>`;
  }
}

// =======================================================
// EVENTS
// =======================================================
checkBtn.onclick = runScan;
addrInput.onkeydown = e => {
  if (e.key === "Enter") runScan();
};

copyLink.onclick = () => {
  const w = addrInput.value.trim();
  if (!w) return;
  navigator.clipboard.writeText(`${location.origin}/?addr=${w}`);
  showToast("Profile link copied");
};

openExplorer.onclick = () => {
  const w = addrInput.value.trim();
  if (!w) return;
  window.open(`https://arcscan.io/address/${w}`, "_blank");
};

// =======================================================
// AUTOLOAD ?addr= PARAM
// =======================================================
(function () {
  const a = new URLSearchParams(location.search).get("addr");
  if (a && a.startsWith("0x")) {
    addrInput.value = a;
    runScan();
  }
})();
