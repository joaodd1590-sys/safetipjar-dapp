// Helpers
const $ = sel => document.querySelector(sel);

const addrInput   = $("#addr");
const runBtn      = $("#check");
const terminal    = $("#terminal");
const summaryBox  = $("#summary");
const tcountEl    = $("#tcount");
const firstEl     = $("#first");
const lastEl      = $("#last");
const statusEl    = $("#status");

const snapWallet  = $("#snapWallet");
const snapTx      = $("#snapTx");
const snapActive  = $("#snapActive");

const copyLinkBtn = $("#copyLink");
const openExpBtn  = $("#openExplorer");

const lbLimitSel  = $("#lbLimit");
const lbRefresh   = $("#refreshLB");
const lbContainer = $("#leaderboard");

const copyToast   = $("#copyToast");

function showToast(msg="Copied!") {
  copyToast.textContent = msg;
  copyToast.classList.add("show");
  setTimeout(() => copyToast.classList.remove("show"), 1300);
}

function setTerminalPlaceholder(text) {
  terminal.innerHTML = `<div class="placeholder">${text}</div>`;
}

function clearTerminal() {
  terminal.innerHTML = "";
}

function appendTx(html) {
  const div = document.createElement("div");
  div.className = "tx";
  div.innerHTML = html;
  terminal.appendChild(div);
}

// MAIN SCAN
async function runScan() {
  const addr = addrInput.value.trim();
  if (!addr || !addr.startsWith("0x") || addr.length < 40) {
    alert("Paste a valid Arc Testnet address (0x...)");
    return;
  }

  setTerminalPlaceholder("Scanning activity on Arc Testnet...");
  summaryBox.style.display = "none";

  try {
    const resp = await fetch(`/api/activity?address=${encodeURIComponent(addr)}`);
    if (!resp.ok) {
      setTerminalPlaceholder(`Server error: ${resp.status}`);
      return;
    }
    const data = await resp.json();
    const txs = data.transactions || [];
    const total = txs.length;

    // Snapshot
    snapWallet.textContent = addr;
    snapTx.textContent = total;

    // Status + summary
    tcountEl.textContent = total;
    if (total > 0) {
      firstEl.textContent = txs[txs.length - 1].time;
      lastEl.textContent  = txs[0].time;
      statusEl.textContent = "ACTIVE";
      statusEl.style.color = "#6cf2c2";
      snapActive.innerHTML = '<span class="badge-in">Yes</span>';
    } else {
      firstEl.textContent = "--";
      lastEl.textContent  = "--";
      statusEl.textContent = "NO ACTIVITY";
      statusEl.style.color = "#ff4db8";
      snapActive.innerHTML = '<span class="badge-out">No</span>';
    }
    summaryBox.style.display = "flex";

    // Render TXs
    clearTerminal();
    if (!txs.length) {
      setTerminalPlaceholder("No transactions found for this wallet.");
      return;
    }

    const lower = addr.toLowerCase();
    txs.forEach(tx => {
      const fromMe = tx.from.toLowerCase() === lower;
      const direction = fromMe ? "OUT" : "IN";
      const badge = fromMe
        ? '<span class="badge-out">OUT</span>'
        : '<span class="badge-in">IN</span>';

      const html = `
        <div class="left">
          <div class="hash">${tx.hash}</div>
          <div class="meta">${tx.from} → ${tx.to} • ${tx.value} • ${tx.time}</div>
        </div>
        <div class="actions">
          ${badge}
          <button class="btn-ghost" onclick="navigator.clipboard.writeText('${tx.hash}').then(()=>window.__toast && window.__toast())">Copy</button>
          <button class="btn-ghost" onclick="window.open('${tx.link}','_blank')">Explorer</button>
        </div>
      `;
      appendTx(html);
    });

  } catch (e) {
    console.error(e);
    setTerminalPlaceholder("Network error while fetching activity.");
  }
}

// Leaderboard
async function loadLeaderboard() {
  lbContainer.innerHTML = `<div class="placeholder">Loading leaderboard...</div>`;
  try {
    const resp = await fetch(`/api/leaderboard`);
    if (!resp.ok) {
      lbContainer.innerHTML = `<div class="placeholder">Leaderboard error: ${resp.status}</div>`;
      return;
    }
    const data = await resp.json();
    const limit = Number(lbLimitSel.value || 50);
    const list = (data.top || []).slice(0, limit);

    if (!list.length) {
      lbContainer.innerHTML = `<div class="placeholder">No data.</div>`;
      return;
    }

    lbContainer.innerHTML = "";
    list.forEach((w, i) => {
      const row = document.createElement("div");
      row.className = "lb-row";
      row.innerHTML = `
        <div class="lb-left">
          <div class="lb-rank">${i + 1}</div>
          <div>
            <div class="lb-addr">${w.address}</div>
            <div class="lb-meta">txs: ${w.count}</div>
          </div>
        </div>
        <button class="view-btn" data-addr="${w.address}">View</button>
      `;
      lbContainer.appendChild(row);
    });

    [...lbContainer.querySelectorAll(".view-btn")].forEach(btn => {
      btn.onclick = e => {
        const a = e.currentTarget.dataset.addr;
        addrInput.value = a;
        runScan();
      };
    });

  } catch (e) {
    console.error(e);
    lbContainer.innerHTML = `<div class="placeholder">Error loading leaderboard.</div>`;
  }
}

// Toast acesso global pro onclick inline
window.__toast = () => showToast("Copied!");

// Eventos
runBtn.onclick = runScan;
addrInput.onkeydown = e => { if (e.key === "Enter") runScan(); };

copyLinkBtn.onclick = () => {
  const addr = addrInput.value.trim();
  if (!addr) return;
  const link = `${window.location.origin}/?addr=${addr}`;
  navigator.clipboard.writeText(link).then(() => showToast("Profile link copied"));
};

openExpBtn.onclick = () => {
  const addr = addrInput.value.trim();
  if (!addr) return;
  window.open(`https://testnet.arcscan.app/address/${addr}`,"_blank");
};

lbRefresh.onclick = () => loadLeaderboard();
lbLimitSel.onchange = () => loadLeaderboard();

// Auto load ?addr= e leaderboard
(function init(){
  const params = new URLSearchParams(window.location.search);
  const addr = params.get("addr");
  if (addr && addr.startsWith("0x")) {
    addrInput.value = addr;
    runScan();
  }
  loadLeaderboard();
})();
