export default async function handler(req, res) {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ error: "Missing wallet address" });
    }

    const rpcUrl = "https://rpc.testnet.arc.network";

    // ⚠️ ENDEREÇO DO CONTRATO USDC NA ARC TESTNET
    // Se a ARC mudar isso depois, a gente só atualiza aqui
    const USDC_CONTRACT = "0x0000000000000000000000000000000000000000"; 
    // 👉 Se você souber o endereço real do USDC da Arc, me manda que eu coloco exato

    // balanceOf(address)
    const paddedAddress = address.toLowerCase().replace("0x", "").padStart(64, "0");
    const data = "0x70a08231" + paddedAddress; 
    // 0x70a08231 = função balanceOf

    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [
        {
          to: USDC_CONTRACT,
          data: data
        },
        "latest"
      ]
    };

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    const rawBalance = result.result ? parseInt(result.result, 16) : 0;

    return res.status(200).json({
      address,
      usdc: rawBalance / 1e6, // USDC geralmente usa 6 casas decimais
      network: "Arc Testnet"
    });

  } catch (err) {
    return res.status(500).json({
      error: "USDC RPC error",
      details: err.message
    });
  }
}
