import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const db = createClient(url, key, { auth: { persistSession: false }});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const { data, error } = await db.rpc("leaderboard_agg");
    if (error) throw error;

    res.status(200).json({
      top: data
    });

  } catch (err) {
    res.status(500).json({
      error: "leaderboard failure",
      details: err.message
    });
  }
}
