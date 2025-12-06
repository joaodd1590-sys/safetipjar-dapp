export default async function handler(req, res) {
  try {
    // pegar último bloco
    const latestRes = await fetch(
      "https://testnet.arcscan.app/api?module=proxy&action=eth_blockNumber"
    );
    const latestJson = await latestRes.json();
    const latestBlock = parseInt(latestJson.result, 16);

    const RANGE = 150; // últimos 150 blocos
    const start = latestBlock - RANGE;
    const activity = {};

    for (let blockNumber = latestBlock; blockNumber > start; blockNumber--) {
      const hex = "0x" + blockNumber.toString(16);

      const blockRes = await fetch(
        `https://testnet.arcscan.app/api?module=proxy&action=eth_getBlockByNumber&tag=${hex}&boolean=true`
      );
      const blockJson = await blockRes.json();
      const block = blockJson.result;
      if (!block || !block.transactions) continue;

      block.transactions.forEach(tx => {
        if (!tx.from || !tx.to) return;

        if (!activity[tx.from]) activity[tx.from] = { address: tx.from, count: 0 };
        if (!activity[tx.to])   activity[tx.to]   = { address: tx.to,   count: 0 };

        activity[tx.from].count++;
        activity[tx.to].count++;
      });
    }

    const top = Object.values(activity)
      .sort((a, b) => b.count - a.count)
      .slice(0, 200);

    res.status(200).json({ range: RANGE, top });

  } catch (err) {
    console.error("LEADERBOARD ERROR", err);
    res.status(500).json({ error: "leaderboard failed" });
  }
}
