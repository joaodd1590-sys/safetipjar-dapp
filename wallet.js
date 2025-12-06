// ===============================
// ARC ACTIVITY TRACKER - FRONTEND
// ===============================

// Pega elementos do DOM
const addrInput     = document.getElementById("addr");
const checkBtn      = document.getElementById("check");
const terminal      = document.getElementById("terminal");
const summary       = document.getElementById("summary");
const tcountEl      = document.getElementById("tcount");
const firstEl       = document.getElementById("first");
const lastEl        = document.getElementById("last");
const statusEl      = document.getElementById("status");
const snapWalletEl  = document.getElementById("snapWallet");
const snapTxEl      = document.getElementById("snapTx");
const snapActiveEl  = document.getElementById("snapActive");
const copyLinkBtn   = document.getElementById("copyLink");
const openExpBtn    = document.getElementById("openExplorer");

// Helper: limpa terminal
function clearTerminal() {
  terminal.innerHTML = "";
}

// Helper: encurta endereço
function shortAddr(addr) {
  if (!addr || addr.length < 10) return addr || "--";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// Renderiza UMA transação no terminal
function appendTx(tx, wallet) {
  const row = document.createElement("div");
  row.className = "tx";

  const wLower = wallet.toLowerCase();
  const fromLower = (tx.from || "").toLowerCase();
  const toLower   = (tx.to || "").toLowerCase();

  let direction = "";
  if (fromLower === wLower) direction = "OUT";
  else if (toLower === wLower) direction = "IN";
  else direction = "-";

  const badge =
    direction === "IN"
      ? `<span class="badge-in">IN</span>`
      : direction === "OUT"
      ? `<span class="badge-out">OUT</span>`
      : "";

  const fromText = tx.from || "--";
  const toText   = tx.to   || "--";

  // Aqui usamos o TOTAL calculado pelo backend
  const totalText = tx.total || tx.value || "0 USDC";

  row.innerHTML = `
    <div class="left">
      <div class="hash">${tx.hash}</div>
      <div class="meta">
        ${fromText} → ${toText}
        • Total: ${totalText}
        • ${tx.time}
      </div>
    </div>
    <div class="actions">
      ${badge}
      <button class="btn-ghost" onclick="navigator.clipboard.writeText('${tx.hash}')">Copy</button>
      <button class="btn-ghost" onclick="window.open('${tx.link}','_blank')">Explorer</button>
    </div>
  `;

  terminal.prepend(row);
}

// Função principal: faz o scan
async function runScan() {
  const wallet = addrInput.value.trim();

  if (!wallet || !wallet.startsWith("0x") || wallet.length < 40) {
    alert("Paste a valid Arc Testnet wallet (0x...)");
    return;
  }

  terminal.innerHTML = `<div style="padding:10px; color:var(--muted);">Scanning Arc Testnet...</div>`;
  summary.style.display = "none";

  // Atualiza snapshot com o endereço
  snapWalletEl.textContent = shortAddr(wallet);
  snapTxEl.textContent = "0";
  snapActiveEl.innerHTML = `<span class="badge-out">No</span>`;

  try {
    const resp = await fetch(`/api/activity?address=${encodeURIComponent(wallet)}`);
    if (!resp.ok) {
      terminal.innerHTML = `<div style="padding:10px; color:var(--muted);">Server error ${resp.status}</div>`;
      return;
    }

    const data = await resp.json();
    const txs = data.transactions || [];
    const total = txs.length;

    // Atualiza resumo
    tcountEl.textContent = total.toString();
    snapTxEl.textContent = total.toString();

    if (total > 0) {
      const newest = txs[0];
      const oldest = txs[txs.length - 1];

      firstEl.textContent  = oldest.time || "--";
      lastEl.textContent   = newest.time || "--";
      statusEl.textContent = "ACTIVE";
      statusEl.style.color = "#00ff9c";
      snapActiveEl.innerHTML = `<span class="badge-in">Yes</span>`;
    } else {
      firstEl.textContent  = "--";
      lastEl.textContent   = "--";
      statusEl.textContent = "NO ACTIVITY";
      statusEl.style.color = "#ff6b6b";
      snapActiveEl.innerHTML = `<span class="badge-out">No</span>`;
    }

    summary.style.display = "flex";

    clearTerminal();

    if (!txs.length) {
      terminal.innerHTML = `<div style="padding:10px; color:var(--muted);">No transactions found for this wallet.</div>`;
      return;
    }

    txs.forEach(tx => appendTx(tx, wallet));

  } catch (err) {
    console.error("SCAN ERROR:", err);
    terminal.innerHTML = `<div style="padding:10px; color:var(--muted);">Network error while contacting backend.</div>`;
  }
}

// Copy Profile Link
copyLinkBtn?.addEventListener("click", () => {
  const wallet = addrInput.value.trim();
  if (!wallet) return;
  const url = `${location.origin}/?addr=${encodeURIComponent(wallet)}`;
  navigator.clipboard.writeText(url);
  alert("Profile link copied");
});

// Open in ArcScan
openExpBtn?.addEventListener("click", () => {
  const wallet = addrInput.value.trim();
  if (!wallet) return;
  window.open(`https://testnet.arcscan.app/address/${wallet}`, "_blank");
});

// Botão Run Scan
checkBtn.addEventListener("click", runScan);

// Enter no input também dispara
addrInput.addEventListener("keydown", e => {
  if (e.key === "Enter") runScan();
});

// Se vier ?addr= na URL, já carrega
(function autoloadFromQuery() {
  const params = new URLSearchParams(location.search);
  const a = params.get("addr");
  if (a && a.startsWith("0x") && a.length > 40) {
    addrInput.value = a;
    runScan();
  }
})();

// ======================================
// CYBERPUNK GLOW FOLLOWING MOUSE
// ======================================

const glow = document.getElementById("cyberGlow");

document.addEventListener("mousemove", (e) => {
  glow.style.left = `${e.clientX}px`;
  glow.style.top = `${e.clientY}px`;
});
