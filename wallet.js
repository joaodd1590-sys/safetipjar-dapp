// ARC Testnet USDC (ERC-20) Live Integration

const addrInput     = document.getElementById("addr");
const checkBtn      = document.getElementById("check");
const terminal      = document.getElementById("terminal");
const snapWalletEl  = document.getElementById("snapWallet");
const snapTxEl      = document.getElementById("snapTx");
const snapActiveEl  = document.getElementById("snapActive");
const copyLinkBtn   = document.getElementById("copyLink");
const openExpBtn    = document.getElementById("openExplorer");

const USDC_CONTRACT = "0x3600000000000000000000000000000000000000";

// limpar
function clearTerminal() {
  terminal.innerHTML = "";
}

// endereço curto
function shortAddr(a) {
  return a.slice(0, 6) + "..." + a.slice(-4);
}

// timestamp → data formatada
function formatTime(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleString("pt-BR");
}

// converter USDC (6 decimals)
function formatUSDC(raw) {
  return (Number(raw) / 1e6).toFixed(2);
}

// render tx
function appendTx(tx, wallet) {
  const row = document.createElement("div");
  row.className = "tx";

  const isOut = tx.from.toLowerCase() === wallet.toLowerCase();
  const badge = isOut
    ? `<span class="badge-out">OUT</span>`
    : `<span class="badge-in">IN</span>`;

  const explorerURL = `https://testnet.arcscan.app/tx/${tx.hash}`;
  const value = formatUSDC(tx.value);

  row.innerHTML = `
    <div>
      <div class="hash">${tx.hash}</div>
      <div class="meta">
        ${tx.from} → ${tx.to} • ${value} USDC • ${formatTime(tx.timeStamp)}
      </div>
    </div>

    <div class="actions">
      ${badge}
      <button class="btn-secondary" onclick="navigator.clipboard.writeText('${tx.hash}')">Copy</button>
      <button class="btn-secondary" onclick="window.open('${explorerURL}', '_blank')">Explorer</button>
    </div>
  `;

  terminal.prepend(row);
}

// MAIN SCAN
async function runScan() {
  const wallet = addrInput.value.trim();

  if (!wallet.startsWith("0x") || wallet.length < 40) {
    alert("Endereço inválido.");
    return;
  }

  terminal.innerHTML =
    "<div style='color:#aaa;padding:10px;'>Carregando transações USDC...</div>";

  snapWalletEl.textContent = shortAddr(wallet);
  snapTxEl.textContent = "0";
  snapActiveEl.innerHTML = `<span class="badge-out">No</span>`;

  try {
    // 🔥 API REAL ERC-20 USDC
    const url = `https://testnet.arcscan.app/api?module=account&action=tokentx&contractaddress=${USDC_CONTRACT}&address=${wallet}`;
    const res = await fetch(url);
    const data = await res.json();

    const txs = data.result || [];

    // ordenar por data crescente
    txs.sort((a, b) => Number(a.timeStamp) - Number(b.timeStamp));

    clearTerminal();

    snapTxEl.textContent = txs.length;
    snapActiveEl.innerHTML = txs.length
      ? `<span class="badge-in">Yes</span>`
      : `<span class="badge-out">No</span>`;

    if (!txs.length) {
      terminal.innerHTML =
        "<div style='color:#aaa;padding:10px;'>Nenhuma transação USDC encontrada.</div>";
      return;
    }

    txs.forEach((tx) => appendTx(tx, wallet));
  } catch (err) {
    console.error(err);
    terminal.innerHTML =
      "<div style='color:#aaa;padding:10px;'>Erro ao conectar à API.</div>";
  }
}

checkBtn.onclick = runScan;
addrInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") runScan();
});

// shareable link
copyLinkBtn.onclick = () => {
  const wallet = addrInput.value.trim();
  const url = `${location.origin}${location.pathname}?addr=${encodeURIComponent(wallet)}`;
  navigator.clipboard.writeText(url);
  alert("Copiado!");
};

// abrir explorer
openExpBtn.onclick = () => {
  const wallet = addrInput.value.trim();
  if (!wallet) return;
  window.open(`https://testnet.arcscan.app/address/${wallet}`, "_blank");
};
