export default async function handler(req, res) {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ error: "Missing wallet address" });
    }

    // Endpoint da API do ArcScan (estilo Etherscan)
    const apiUrl = `https://testnet.arcscan.app/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || data.status !== "1") {
      return res.status(200).json({
        address,
        network: "Arc Testnet",
        transactions: [],
        message: "No transactions found yet"
      });
    }

    // Normalizando as transações
    const txs = data.result.map((tx) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      time: new Date(tx.timeStamp * 1000).toLocaleString("pt-BR"),
      link: `https://testnet.arcscan.app/tx/${tx.hash}`
    }));

    return res.status(200).json({
      address,
      network: "Arc Testnet",
      totalTx: txs.length,
      transactions: txs
    });

  } catch (err) {
    return res.status(500).json({
      error: "ArcScan API error",
      details: err.message
    });
  }
}
