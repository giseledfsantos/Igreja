const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://xytuuccwylwbefgkqxlr.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY ?? ''

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

    const sub = body?.subscription ?? body
    const endpoint = String(sub?.endpoint ?? '').trim()
    const p256dh = String(sub?.keys?.p256dh ?? '').trim()
    const auth = String(sub?.keys?.auth ?? '').trim()
    if (!endpoint) {
      res.status(400).json({ message: 'subscription.endpoint obrigatório.' })
      return
    }
    if (!p256dh || !auth) {
      res.status(400).json({ message: 'subscription.keys inválido.' })
      return
    }

    const userAgent = String(body?.userAgent ?? req.headers['user-agent'] ?? '').trim()
    const nowIso = new Date().toISOString()

    const payload = {
      id_usuario: idUsuario,
      endpoint,
      p256dh,
      auth,
      user_agent: userAgent,
      last_seen_at: nowIso,
      revoked_at: null,
      updated_at: nowIso
    }

    const targetUrl = new URL(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/push_subscriptions`)
    targetUrl.searchParams.set('on_conflict', 'id_usuario,endpoint')

    const upstream = await fetch(targetUrl.toString(), {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([payload])
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
    try { console.error('api/push/subscribe:error', msg) } catch {}
    res.status(502).json({ error: msg })
  }
}
