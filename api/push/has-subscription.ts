const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://xytuuccwylwbefgkqxlr.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY ?? (process.env as any).SUPABASE_SERVICE_ROLE_KEY ?? (process.env as any).SUPABASE_SERVICE_ROLE ?? ''

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
    if (String(req.method || 'GET').toUpperCase() !== 'GET') {
      res.status(405).json({ error: 'Método não suportado' })
      return
    }

    const urlObj = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`)
    const idUsuarioRaw =
      (urlObj.searchParams.get('id_usuario') || urlObj.searchParams.get('idUsuario') || (req.query?.id_usuario as string) || (req.query?.idUsuario as string) || '').trim()

    const idUsuario = Number(idUsuarioRaw)
    if (!Number.isFinite(idUsuario) || idUsuario <= 0) {
      res.status(400).json({ message: 'id_usuario inválido.' })
      return
    }

    const targetUrl = new URL(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/push_subscriptions`)
    targetUrl.searchParams.set('select', 'id')
    targetUrl.searchParams.set('id_usuario', `eq.${idUsuario}`)
    targetUrl.searchParams.set('revoked_at', 'is.null')
    targetUrl.searchParams.set('limit', '1')

    const upstream = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: 'application/json'
      }
    })
    const text = await upstream.text()
    if (!upstream.ok) {
      res.status(upstream.status).send(text)
      return
    }

    let hasSubscription = false
    try {
      const json = JSON.parse(text || '[]')
      hasSubscription = Array.isArray(json) && json.length > 0
    } catch {}

    res.status(200).json({ hasSubscription })
  } catch (err: any) {
    const msg = err?.message ?? 'Erro interno'
    try { console.error('api/push/has-subscription:error', msg) } catch {}
    res.status(502).json({ error: msg })
  }
}
