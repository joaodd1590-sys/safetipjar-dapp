export default async function handler(req, res) {
  try {
    const latestRes = await fetch("https://testnet.arcscan.app/api?module=proxy&action=eth_blockNumber");
    const latestJson = await latestRes.json();
    const latestBlock = parseInt(latestJson.result, 16);

    const RANGE = 500;
    const fromBlock = latestBlock - RANGE;

    let activity = {};

    for (let blk = latestBlock; blk > fromBlock; blk--) {
      const hex = "0x" + blk.toString(16);

      const bRes = await fetch(
        `https://testnet.arcscan.app/api?module=proxy&action=eth_getBlockByNumber&tag=${hex}&boolean=true`
      );
      const bJson = await bRes.json();
      const block = bJson.result;

      if (!block || !block.transactions) continue;

      block.transactions.forEach(tx => {
        if (!activity[tx.from]) activity[tx.from] = { address: tx.from, count: 0 };
        if (!activity[tx.to]) activity[tx.to] = { address: tx.to, count: 0 };

        activity[tx.from].count++;
        activity[tx.to].count++;
      });
    }

    const top = Object.values(activity)
      .sort((a, b) => b.count - a.count)
      .slice(0, 200);

    res.status(200).json({ range: RANGE, top });

  } catch (err) {
    console.error("LEADERBOARD ERROR:", err);
    res.status(500).json({ error: "failed leaderboard" });
  }
}
