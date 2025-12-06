import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RPC_URL = process.env.VERCEL_RPC_URL;
const LOOKBACK = Number(process.env.LOOKBACK_BLOCKS || 500);

const db = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false }});
const provider = new ethers.JsonRpcProvider(RPC_URL);

const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const { data: last } = await db
      .from("transactions")
      .select("block_number")
      .order("block_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const latestIndexed = last?.block_number ?? 0;
    const current = await provider.getBlockNumber();

    const fromBlock = latestIndexed ? latestIndexed + 1 : current - LOOKBACK;
    const toBlock = current;

    const logs = await provider.getLogs({
      fromBlock,
      toBlock,
      topics: [TRANSFER_TOPIC],
    });

    const rows = [];

    for (const log of logs) {
      // Decode addresses from topics (always 32-byte padded)
      const from = "0x" + log.topics[1].slice(26);
      const to = "0x" + log.topics[2].slice(26);

      // Value may be in data OR may be empty — ARC logs sometimes break standard
      let value = "0";

      try {
        value = ethers.toBigInt(log.data || "0x0").toString();
      } catch {
        value = "0";
      }

      const block = await provider.getBlock(log.blockNumber);
      const timestamp = new Date(block.timestamp * 1000).toISOString();

      rows.push({
        id: log.transactionHash,
        from_address: from,
        to_address: to,
        value: value,
        block_number: log.blockNumber,
        block_timestamp: timestamp,
        network: "arc-testnet"
      });
    }

    if (rows.length > 0) {
      await db.from("transactions").upsert(rows, { onConflict: "id" });
    }

    res.status(200).json({
      ok: true,
      captured: rows.length,
      fromBlock,
      toBlock
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
