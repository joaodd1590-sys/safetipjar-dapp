// /api/activity.js

export default async function handler(req, res) {
  try {
    const { address } = req.query;

    if (!address || !address.startsWith("0x")) {
      return res.status(400).json({ error: "Invalid address" });
    }

    // ARC Testnet API (compatível com Etherscan)
    const API_KEY = process.env.ARC_API_KEY;
    const url = `https://api-testnet.arbiscan.io/api?module=account&action=txlist&address=${address}&sort=desc&apikey=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data || !data.result) {
      return res.status(500).json({ error: "API error", raw: data });
    }

    const txs = data.result;

    const formatted = txs.map((tx) => {
      // VALUES -----------------------------------------------------
      const value = Number(tx.value) / 1e18; // USDC-like decimal (18)
      const gasUsed = Number(tx.gasUsed);
      const gasPrice = Number(tx.gasPrice);
      const gasCost = (gasUsed * gasPrice) / 1e18;

      const total = value + gasCost;

      // FORMAT ------------------------------------------------------
      const valueFormatted = `${value.toFixed(6)} USDC`;
      const gasFormatted = `${gasCost.toFixed(6)} USDC`;
      const totalFormatted = `${total.toFixed(6)} USDC`;

      // TIME --------------------------------------------------------
      const time = new Date(Number(tx.timeStamp) * 1000).toLocaleString();

      // Return formatted transaction
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: valueFormatted,
        gas: gasFormatted,
        total: totalFormatted,
        time,
        link: `https://testnet.arcscan.app/tx/${tx.hash}`
      };
    });

    res.status(200).json({
      address,
      total: formatted.length,
      transactions: formatted
    });

  } catch (err) {
    console.error("ACTIVITY ERROR:", err);
    res.status(500).json({ error: "Server error", details: err.toString() });
  }
}
