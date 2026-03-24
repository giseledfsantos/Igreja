const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://xytuuccwylwbefgkqxlr.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY ?? ''

function ensureEnv() {
  if (!SUPABASE_URL) throw new Error('SUPABASE_URL ausente no ambiente')
  if (!SUPABASE_KEY) throw new Error('SUPABASE_KEY ausente no ambiente')
}

export default async function handler(req: any, res: any) {
  try {
    ensureEnv()
    if (req.method === 'OPTIONS') {
      res.status(200).send('')
      return
    }

    const urlObj = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`)
    const table = urlObj.searchParams.get('table') || (req.query?.table as string) || ''
    if (!table) {
      res.status(400).json({ error: 'Tabela não informada' })
      return
    }

    const qs = new URLSearchParams(urlObj.searchParams)
    qs.delete('table')

    const pk = qs.get('pk')
    const id = qs.get('id')
    if (pk && id) {
      qs.delete('pk')
      qs.delete('id')
      qs.set(pk, `eq.${id}`)
    }

    const targetUrl = new URL(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/${encodeURIComponent(table)}`)
    const q = qs.toString()
    if (q) targetUrl.search = q

    const method = String(req.method || 'GET').toUpperCase()
    const headers: Record<string, string> = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json',
      Prefer: 'return=representation'
    }

    let body: string | undefined
    if (method !== 'GET' && method !== 'HEAD') {
      const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {})
      body = payload
      headers['Content-Type'] = 'application/json'
    }

    const upstream = await fetch(targetUrl.toString(), { method, headers, body })
    const text = await upstream.text()
    if (!upstream.ok) {
      res.status(upstream.status).send(text)
      return
    }

    if (!text) {
      res.status(upstream.status).send('')
      return
    }

    try {
      res.status(upstream.status).json(JSON.parse(text))
    } catch {
      res.status(upstream.status).send(text)
    }
    return

    res.status(405).json({ error: 'Método não suportado' })
  } catch (err: any) {
    const msg = err?.message ?? 'Erro interno'
    try { console.error('api/rest:error', msg) } catch {}
    res.status(502).json({ error: msg })
  }
}
