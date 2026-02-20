import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://xytuuccwylwbefgkqxlr.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY ?? ''

function ensureEnv() {
  if (!SUPABASE_URL) throw new Error('SUPABASE_URL ausente no ambiente')
  if (!SUPABASE_KEY) throw new Error('SUPABASE_KEY ausente no ambiente')
}

function getClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY)
}

export default async function handler(req: any, res: any) {
  try {
    ensureEnv()
    if (req.method === 'OPTIONS') {
      res.status(200).send('')
      return
    }

    const urlObj = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`)
    const table = (req.query?.table as string) || (urlObj.pathname.split('/').pop() as string)
    if (!table) {
      res.status(400).json({ error: 'Tabela não informada' })
      return
    }

    const supabase = getClient()

    if (req.method === 'GET') {
      const select = urlObj.searchParams.get('select') || '*'
      const { data, error } = await supabase.from(table).select(select)
      if (error) { res.status(500).json({ error: error.message }); return }
      res.status(200).json(data ?? [])
      return
    }

    if (req.method === 'POST') {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {})
      const { data, error } = await supabase.from(table).insert(payload).select('*')
      if (error) { res.status(500).json({ error: error.message }); return }
      res.status(201).json(Array.isArray(data) ? data : [data])
      return
    }

    if (req.method === 'PATCH') {
      const pk = urlObj.searchParams.get('pk') || 'id'
      const id = urlObj.searchParams.get('id') || ''
      const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {})
      const q = supabase.from(table).update(payload)
      const { data, error } = id ? q.eq(pk, id).select('*') : q.select('*')
      if (error) { res.status(500).json({ error: error.message }); return }
      res.status(200).json(Array.isArray(data) ? data : [data])
      return
    }

    if (req.method === 'DELETE') {
      const pk = urlObj.searchParams.get('pk') || 'id'
      const id = urlObj.searchParams.get('id') || ''
      const q = supabase.from(table).delete()
      const { error } = id ? q.eq(pk, id) : q
      if (error) { res.status(500).json({ error: error.message }); return }
      res.status(204).send('')
      return
    }

    res.status(405).json({ error: 'Método não suportado' })
  } catch (err: any) {
    const msg = err?.message ?? 'Erro interno'
    try { console.error('api/rest/[table]:error', msg) } catch {}
    res.status(502).json({ error: msg })
  }
}
