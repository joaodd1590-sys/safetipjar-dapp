export default async function handler(req, res) {
  try {
    const { address } = req.query;

    if (!address || !address.startsWith("0x")) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const url = `https://testnet.arcscan.app/api?module=account&action=txlist&address=${address}&sort=desc`;
    const r = await fetch(url);
    const json = await r.json();

    if (!json || !json.result) {
      return res.status(200).json({ address, total: 0, transactions: [] });
    }

    const txs = json.result.map(tx => {
      // ----------------------------
      // VALUE enviado
      // ----------------------------
      let rawValue = tx.value || "0";
      if (rawValue.startsWith("0x")) rawValue = parseInt(rawValue, 16);
      const valueArc = Number(rawValue) / 1e18;

      // ----------------------------
      // GAS gasto
      // ----------------------------
      const gasUsed = Number(tx.gasUsed || 0);
      const gasPrice = Number(tx.gasPrice || 0);
      const gasSpentWei = gasUsed * gasPrice;
      const gasSpentArc = gasSpentWei / 1e18;

      // ----------------------------
      // TOTAL gasto
      // ----------------------------
      const totalCost = valueArc + gasSpentArc;

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: valueArc.toFixed(6) + " ARC",
        gas: gasSpentArc.toFixed(6) + " ARC",
        total: totalCost.toFixed(6) + " ARC",
        time: new Date(Number(tx.timeStamp) * 1000).toLocaleString(),
        link: `https://testnet.arcscan.app/tx/${tx.hash}`,
        timeStamp: Number(tx.timeStamp)
      };
    });

    res.status(200).json({
      address,
      total: txs.length,
      transactions: txs
    });

  } catch (err) {
    console.error("ACTIVITY ERROR", err);
    res.status(500).json({ error: "server error" });
  }
}
