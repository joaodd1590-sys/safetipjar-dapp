// ARC Testnet Live API Integration
// BY JOÃO — versão final

const addrInput     = document.getElementById("addr");
const checkBtn      = document.getElementById("check");
const terminal      = document.getElementById("terminal");
const snapWalletEl  = document.getElementById("snapWallet");
const snapTxEl      = document.getElementById("snapTx");
const snapActiveEl  = document.getElementById("snapActive");
const copyLinkBtn   = document.getElementById("copyLink");
const openExpBtn    = document.getElementById("openExplorer");

// limpar janela
function clearTerminal() {
  terminal.innerHTML = "";
}

// encurtar
function shortAddr(a) {
  return a.slice(0, 6) + "..." + a.slice(-4);
}

// formatar timestamp
function formatTime(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleString("pt-BR");
}

// renderizar um tx
function appendTx(tx, wallet) {
  const row = document.createElement("div");
  row.className = "tx";

  const isOut = tx.from?.toLowerCase() === wallet.toLowerCase();
  const badge = isOut
    ? `<span class="badge-out">OUT</span>`
    : `<span class="badge-in">IN</span>`;

  // link real
  const explorerURL = `https://testnet.arcscan.app/tx/${tx.hash}`;

  row.innerHTML = `
    <div>
      <div class="hash">${tx.hash}</div>
      <div class="meta">
        ${tx.from} → ${tx.to} • ${tx.value} ARC • ${formatTime(tx.timeStamp)}
      </div>
    </div>

    <div class="actions">
      ${badge}
      <button class="btn-secondary" onclick="navigator.clipboard.writeText('${tx.hash}')">
        Copy
      </button>
      <button class="btn-secondary" onclick="window.open('${explorerURL}', '_blank')">
        Explorer
      </button>
    </div>
  `;

  terminal.prepend(row);
}

// SCAN REAL
async function runScan() {
  const wallet = addrInput.value.trim();

  if (!wallet.startsWith("0x") || wallet.length < 40) {
    alert("Endereço inválido.");
    return;
  }

  terminal.innerHTML =
    "<div style='color:#aaa;padding:10px;'>Carregando transações reais...</div>";

  snapWalletEl.textContent = shortAddr(wallet);
  snapTxEl.textContent = "0";
  snapActiveEl.innerHTML = `<span class="badge-out">No</span>`;

  try {
    // 🔥 API REAL ARC
    const url = `https://testnet.arcscan.app/api?module=account&action=txlist&address=${wallet}`;
    const res = await fetch(url);
    const data = await res.json();

    const txs = data.result || [];

    // ordenar por timestamp crescente
    txs.sort((a, b) => Number(a.timeStamp) - Number(b.timeStamp));

    clearTerminal();

    snapTxEl.textContent = txs.length;
    snapActiveEl.innerHTML = txs.length
      ? `<span class="badge-in">Yes</span>`
      : `<span class="badge-out">No</span>`;

    if (!txs.length) {
      terminal.innerHTML =
        "<div style='color:#aaa;padding:10px;'>Nenhuma transação encontrada.</div>";
      return;
    }

    txs.forEach((tx) => {
      appendTx(tx, wallet);
    });
  } catch (err) {
    console.error(err);
    terminal.innerHTML =
      "<div style='color:#aaa;padding:10px;'>Erro ao conectar na API.</div>";
  }
}

checkBtn.onclick = runScan;
addrInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") runScan();
});

// copy link
copyLinkBtn.onclick = () => {
  const wallet = addrInput.value.trim();
  const url = `${location.origin}${location.pathname}?addr=${encodeURIComponent(wallet)}`;
  navigator.clipboard.writeText(url);
  alert("Copiado!");
};

// explorer
openExpBtn.onclick = () => {
  const wallet = addrInput.value.trim();
  if (!wallet) return;
  window.open(`https://testnet.arcscan.app/address/${wallet}`, "_blank");
};
