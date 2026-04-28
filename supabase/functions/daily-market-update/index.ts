// Edge Function: daily-market-update
// Runs daily at US market close (4 PM ET = 21:00 UTC).
// Fetches latest SPY (S&P 500) and QQQ (NASDAQ-100) closing prices from Yahoo Finance,
// then calls the apply_daily_growth() Postgres function to compound returns
// across every student's S&P, NASDAQ, and Savings accounts.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch latest prices for SPY (S&P 500 proxy) and QQQ (NASDAQ-100 proxy)
    const fetchPrice = async (symbol: string): Promise<number> => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })
      if (!r.ok) throw new Error(`${symbol} fetch failed: ${r.status}`)
      const data = await r.json()
      const closes: (number | null)[] = data.chart.result[0].indicators.quote[0].close
      const latest = [...closes].reverse().find((c) => c != null)
      if (latest == null) throw new Error(`No close price for ${symbol}`)
      return Number(latest)
    }

    const [sp500, nasdaq] = await Promise.all([fetchPrice('SPY'), fetchPrice('QQQ')])

    // Use America/Los_Angeles "today" since the rest of the app is in PT
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })

    const { data, error } = await supabase.rpc('apply_daily_growth', {
      p_date: today,
      p_sp500_close: sp500,
      p_nasdaq_close: nasdaq,
    })
    if (error) throw error

    return new Response(JSON.stringify({ ok: true, prices: { sp500, nasdaq }, result: data }), {
      headers: { 'content-type': 'application/json' },
    })
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
})
