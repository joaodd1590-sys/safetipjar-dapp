export default async function handler(req, res) {
    try {
        const { address } = req.query;

        if (!address) {
            return res.status(400).json({ error: "Missing address" });
        }

        const apiURL = `https://api.arcscan.app/api?module=account&action=txlist&address=${address}&sort=desc`;

        const response = await fetch(apiURL);
        const data = await response.json();

        if (!data || data.status !== "1" || !data.result) {
            return res.status(500).json({ error: "ArcScan returned invalid data" });
        }

        const txs = data.result;
        const transactions = [];

        for (const tx of txs) {
            const valueETH = parseFloat(tx.value) / 1e18;
            const gasCost = (parseFloat(tx.gasUsed) * parseFloat(tx.gasPrice)) / 1e18;
            const total = valueETH + gasCost;

            const formattedValue = valueETH.toFixed(6);
            const formattedGas = gasCost.toFixed(6);
            const formattedTotal = total.toFixed(6);

            const timestampMS = tx.timeStamp ? parseInt(tx.timeStamp) * 1000 : null;

            transactions.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to || "",
                value: `${formattedValue} USDC`,
                gas: `${formattedGas} USDC`,
                total: `${formattedTotal} USDC`,
                time: timestampMS ? new Date(timestampMS).toLocaleString() : "N/A",
                link: `https://testnet.arcscan.app/tx/${tx.hash}`
            });
        }

        return res.status(200).json({
            address,
            total: transactions.length,
            transactions
        });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
