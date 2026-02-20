const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://xytuuccwylwbefgkqxlr.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY ?? ''

function ensureEnv() {
  if (!SUPABASE_URL) throw new Error('SUPABASE_URL ausente no ambiente')
  if (!SUPABASE_KEY) throw new Error('SUPABASE_KEY ausente no ambiente')
}

function buildAuthHeaders(req: any) {
  const apiKey = req.headers['apikey'] || SUPABASE_KEY
  const auth = req.headers['authorization'] || (apiKey ? `Bearer ${apiKey}` : '')
  const h: Record<string, string> = { Accept: 'application/json' }
  if (apiKey) h['apikey'] = String(apiKey)
  if (auth) h['Authorization'] = String(auth)
  return h
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

    const base = `${SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}`
    const authHeaders = buildAuthHeaders(req)

    if (req.method === 'GET') {
      const select = urlObj.searchParams.get('select') || '*'
      const url = `${base}?select=${encodeURIComponent(select)}`
      const r = await fetch(url, { method: 'GET', headers: authHeaders })
      const text = await r.text()
      res.status(r.status).setHeader('Content-Type', 'application/json').send(text)
      return
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {})
      const headers = { ...authHeaders, Prefer: 'return=representation', 'Content-Type': 'application/json' }
      const r = await fetch(base, { method: 'POST', headers, body })
      const text = await r.text()
      res.status(r.status).setHeader('Content-Type', 'application/json').send(text)
      return
    }

    if (req.method === 'PATCH') {
      const pk = urlObj.searchParams.get('pk') || 'id'
      const id = urlObj.searchParams.get('id') || ''
      const filter = id ? `?${encodeURIComponent(pk)}=eq.${encodeURIComponent(id)}` : ''
      const url = `${base}${filter}`
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {})
      const headers = { ...authHeaders, Prefer: 'return=representation', 'Content-Type': 'application/json' }
      const r = await fetch(url, { method: 'PATCH', headers, body })
      const text = await r.text()
      res.status(r.status).setHeader('Content-Type', 'application/json').send(text)
      return
    }

    if (req.method === 'DELETE') {
      const pk = urlObj.searchParams.get('pk') || 'id'
      const id = urlObj.searchParams.get('id') || ''
      const filter = id ? `?${encodeURIComponent(pk)}=eq.${encodeURIComponent(id)}` : ''
      const url = `${base}${filter}`
      const r = await fetch(url, { method: 'DELETE', headers: authHeaders })
      const text = await r.text()
      res.status(r.status).setHeader('Content-Type', 'application/json').send(text || '')
      return
    }

    res.status(405).json({ error: 'Método não suportado' })
  } catch (err: any) {
    const msg = err?.message ?? 'Erro interno'
    res.status(502).json({ error: msg })
  }
}
