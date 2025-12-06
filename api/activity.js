export default async function handler(req, res) {
  try {
    const { address } = req.query;

    if (!address || !address.startsWith("0x")) {
      return res.status(400).json({ error: "Invalid address" });
    }

    // ArcScan API correta
    const url = `https://api.arcscan.app/v1/txs/address/${address}?limit=50`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data || !data.items) {
      return res.status(500).json({ error: "ArcScan API error", raw: data });
    }

    // A API JÁ RETORNA value / gas / total formatados como texto
    const formatted = data.items.map((tx) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value.replace("ARC", "USDC"),
      gas: tx.gas.replace("ARC", "USDC"),
      total: tx.total.replace("ARC", "USDC"),
      time: tx.timestamp,
      link: `https://testnet.arcscan.app/tx/${tx.hash}`
    }));

    res.status(200).json({
      address,
      total: formatted.length,
      transactions: formatted
    });

  } catch (err) {
    console.error("ACTIVITY API ERROR:", err);
    res.status(500).json({ error: "Server error", message: err.toString() });
  }
}
