import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RPC_URL = process.env.VERCEL_RPC_URL;
const LOOKBACK = Number(process.env.LOOKBACK_BLOCKS || 500);

const db = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false }});
const provider = new ethers.JsonRpcProvider(RPC_URL);

// USDC Testnet contract (Arc Testnet)
const USDC_ADDRESS = "0x63a131657cdc57865df571e2e61e2eff6ee0c1c8"; // substitua pelo contrato oficial USDC quando soubermos
const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    // Último bloco salvo
    const { data: last } = await db
      .from("transactions")
      .select("block_number")
      .order("block_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const latestIndexed = last?.block_number ?? 0;
    const currentBlock = await provider.getBlockNumber();

    const fromBlock = latestIndexed ? latestIndexed + 1 : currentBlock - LOOKBACK;
    const toBlock = currentBlock;

    // Buscar logs de Transfer
    const logs = await provider.getLogs({
      fromBlock,
      toBlock,
      topics: [TRANSFER_TOPIC],
    });

    const rows = [];

    for (const log of logs) {
      const parsed = ethers.AbiCoder.defaultAbiCoder().decode(
        ["address", "address", "uint256"],
        log.data
      );

      rows.push({
        id: log.transactionHash,
        from_address: "0x" + log.topics[1].slice(26),
        to_address: "0x" + log.topics[2].slice(26),
        value: parsed[2].toString(),
        block_number: log.blockNumber,
        block_timestamp: new Date((await provider.getBlock(log.blockNumber)).timestamp * 1000).toISOString(),
        network: "arc-testnet"
      });
    }

    if (rows.length > 0) {
      await db.from("transactions").upsert(rows, { onConflict: "id" });
    }

    res.status(200).json({
      ok: true,
      indexed: rows.length,
      fromBlock,
      toBlock
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
