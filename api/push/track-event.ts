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

const ALLOWED = new Set(['shown', 'clicked', 'dismissed'])

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
    const notificationId = String(body?.notificationId ?? body?.notification_id ?? '').trim()
    const deliveryId = String(body?.deliveryId ?? body?.delivery_id ?? '').trim()
    const tag = String(body?.tag ?? '').trim()
    const eventType = String(body?.eventType ?? body?.event_type ?? '').trim()
    const occurredAt = String(body?.occurredAt ?? body?.occurred_at ?? '').trim()
    const details = body?.details ?? body?.details_json ?? null

    if (!notificationId) {
      res.status(400).json({ error: 'notificationId obrigatório.' })
      return
    }
    if (!ALLOWED.has(eventType)) {
      res.status(400).json({ error: 'eventType inválido.' })
      return
    }

    const payload: any = {
      notification_id: notificationId,
      delivery_id: deliveryId || null,
      event_type: eventType,
      source: 'client',
      occurred_at: occurredAt || new Date().toISOString(),
      details_json: details ?? { tag }
    }

    const targetUrl = new URL(`${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/browser_notification_events`)
    const upstream = await fetch(targetUrl.toString(), {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: 'application/json',
        Prefer: 'return=minimal',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([payload])
    })

    const text = await upstream.text()
    if (!upstream.ok) {
      res.status(upstream.status).send(text)
      return
    }
    res.status(204).send('')
  } catch (err: any) {
    const msg = err?.message ?? 'Erro interno'
    try { console.error('api/push/track-event:error', msg) } catch {}
    res.status(502).json({ error: msg })
  }
}

