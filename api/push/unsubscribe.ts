const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://xytuuccwylwbefgkqxlr.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY ?? (process.env as any).SUPABASE_SERVICE_ROLE_KEY ?? (process.env as any).SUPABASE_SERVICE_ROLE ?? ''

function ensureEnv() {
  if (!SUPABASE_URL) throw new Error('SUPABASE_URL ausente no ambiente')
  if (!SUPABASE_KEY) throw new Error('SUPABASE_KEY ausente no ambiente')
}

function parseBody(req: any) {
  if (req?.body == null) return {}
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body) } catch { return {} }
  }
  return req.body
}

export default async function handler(req: any, res: any) {
  try {
    ensureEnv()
    if (req.method === 'OPTIONS') {
      res.status(200).send('')
      return
    }
    if (String(req.method || '').toUpperCase() !== 'POST') {
      res.status(405).json({ error: 'Método não suportado' })
      return
    }

    const body = parseBody(req)
    const idUsuarioRaw = String(body?.idUsuario ?? body?.id_usuario ?? '').trim()
    const idUsuario = Number(idUsuarioRaw)
    if (!Number.isFinite(idUsuario) || idUsuario <= 0) {
      res.status(400).json({ message: 'idUsuario obrigatório.' })
      return
    }

    const endpoint = String(body?.endpoint ?? '').trim()
    if (!endpoint) {
      res.status(400).json({ message: 'endpoint obrigatório.' })
      return
    }

    const nowIso = new Date().toISOString()
    const targetUrl = new URL(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/push_subscriptions`)
    targetUrl.searchParams.set('id_usuario', `eq.${idUsuario}`)
    targetUrl.searchParams.set('endpoint', `eq.${endpoint}`)

    const upstream = await fetch(targetUrl.toString(), {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: 'application/json',
        Prefer: 'return=representation',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ revoked_at: nowIso, updated_at: nowIso })
    })

    const text = await upstream.text()
    if (!upstream.ok) {
      res.status(upstream.status).send(text)
      return
    }

    try {
      res.status(upstream.status).json(JSON.parse(text || '[]'))
    } catch {
      res.status(upstream.status).send(text)
    }
  } catch (err: any) {
    const msg = err?.message ?? 'Erro interno'
    try { console.error('api/push/unsubscribe:error', msg) } catch {}
    res.status(502).json({ error: msg })
  }
}
