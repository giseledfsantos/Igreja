import webpush from 'web-push'

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://xytuuccwylwbefgkqxlr.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY ?? ''
const VAPID_PUBLIC_KEY = String(process.env.VAPID_PUBLIC_KEY ?? '').trim()
const VAPID_PRIVATE_KEY = String(process.env.VAPID_PRIVATE_KEY ?? '').trim()
const VAPID_SUBJECT = String(process.env.VAPID_SUBJECT ?? 'mailto:admin@localhost').trim()

function ensureEnv() {
  if (!SUPABASE_URL) throw new Error('SUPABASE_URL ausente no ambiente')
  if (!SUPABASE_KEY) throw new Error('SUPABASE_KEY ausente no ambiente')
  if (!VAPID_PUBLIC_KEY) throw new Error('VAPID_PUBLIC_KEY ausente no ambiente')
  if (!VAPID_PRIVATE_KEY) throw new Error('VAPID_PRIVATE_KEY ausente no ambiente')
}

function getDatePartsInSaoPaulo(d: Date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const parts = fmt.formatToParts(d)
  const year = Number(parts.find(p => p.type === 'year')?.value || '0')
  const month = Number(parts.find(p => p.type === 'month')?.value || '0')
  const day = Number(parts.find(p => p.type === 'day')?.value || '0')
  return { year, month, day }
}

function monthDayFromDateValue(v: any) {
  const s = String(v ?? '').trim()
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (m) return { month: Number(m[2]), day: Number(m[3]) }
  const dt = new Date(s)
  if (!Number.isFinite(dt.getTime())) return null
  return { month: dt.getUTCMonth() + 1, day: dt.getUTCDate() }
}

async function supabaseGet(pathAndQuery: string) {
  const url = `${SUPABASE_URL.replace(/\/+$/, '')}${pathAndQuery}`
  const upstream = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json'
    }
  })
  const text = await upstream.text()
  if (!upstream.ok) {
    const err = new Error(text || `Supabase GET falhou (${upstream.status})`)
    ;(err as any).status = upstream.status
    throw err
  }
  if (!text) return []
  try { return JSON.parse(text) } catch { return [] }
}

async function supabasePatch(pathAndQuery: string, payload: any) {
  const url = `${SUPABASE_URL.replace(/\/+$/, '')}${pathAndQuery}`
  const upstream = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json',
      Prefer: 'return=representation',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload ?? {})
  })
  const text = await upstream.text()
  if (!upstream.ok) {
    const err = new Error(text || `Supabase PATCH falhou (${upstream.status})`)
    ;(err as any).status = upstream.status
    throw err
  }
  return text
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

    if (process.env.VERCEL && String(req.headers['x-vercel-cron'] ?? '') !== '1') {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

    const now = new Date()
    const today = getDatePartsInSaoPaulo(now)
    const tomorrow = getDatePartsInSaoPaulo(new Date(now.getTime() + 24 * 60 * 60 * 1000))

    const membros = await supabaseGet('/rest/v1/membros?select=id,nome,data_nascimento')
    const aniversariosHoje: any[] = []
    const aniversariosAmanha: any[] = []

    for (const m of Array.isArray(membros) ? membros : []) {
      const md = monthDayFromDateValue(m?.data_nascimento ?? m?.dataNascimento)
      if (!md) continue
      if (md.month === today.month && md.day === today.day) aniversariosHoje.push(m)
      if (md.month === tomorrow.month && md.day === tomorrow.day) aniversariosAmanha.push(m)
    }

    if (!aniversariosHoje.length && !aniversariosAmanha.length) {
      res.status(200).json({ ok: true, sent: 0, revoked: 0, today: aniversariosHoje.length, tomorrow: aniversariosAmanha.length })
      return
    }

    const usuarios = await supabaseGet('/rest/v1/usuarios?select=id,recebe_notificacoes&recebe_notificacoes=eq.true')
    const allowedUserIds = new Set<string>()
    for (const u of Array.isArray(usuarios) ? usuarios : []) {
      const id = String(u?.id ?? u?.usuario_id ?? u?.usuarios_id ?? '').trim()
      if (id) allowedUserIds.add(id)
    }

    const subs = await supabaseGet('/rest/v1/push_subscriptions?select=id,id_usuario,endpoint,p256dh,auth&revoked_at=is.null')
    const activeSubs = (Array.isArray(subs) ? subs : []).filter(s => allowedUserIds.has(String(s?.id_usuario ?? '').trim()))

    let sent = 0
    let revoked = 0

    for (const sub of activeSubs) {
      const subscription = {
        endpoint: String(sub?.endpoint ?? '').trim(),
        keys: {
          p256dh: String(sub?.p256dh ?? '').trim(),
          auth: String(sub?.auth ?? '').trim()
        }
      }
      if (!subscription.endpoint || !subscription.keys.p256dh || !subscription.keys.auth) continue

      const subId = String(sub?.id ?? '').trim()
      const messages: Array<{ title: string; body: string; tag: string }> = []

      for (const m of aniversariosAmanha) {
        const nome = String(m?.nome ?? '').trim()
        messages.push({ title: 'IEADM-ITAPEVA', body: `Amanhã é aniversario de ${nome}`, tag: `bday-${m?.id ?? nome}-tomorrow` })
      }
      for (const m of aniversariosHoje) {
        const nome = String(m?.nome ?? '').trim()
        messages.push({ title: 'IEADM-ITAPEVA', body: `Hoje é aniversario de ${nome}`, tag: `bday-${m?.id ?? nome}-today` })
      }

      for (const msg of messages) {
        try {
          await webpush.sendNotification(subscription as any, JSON.stringify({ title: msg.title, body: msg.body, url: '/', tag: msg.tag }))
          sent++
        } catch (e: any) {
          const statusCode = Number(e?.statusCode ?? e?.status ?? 0)
          if ((statusCode === 404 || statusCode === 410) && subId) {
            try {
              await supabasePatch(`/rest/v1/push_subscriptions?id=eq.${encodeURIComponent(subId)}`, { revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
              revoked++
            } catch {}
          }
        }
      }
    }

    res.status(200).json({
      ok: true,
      sent,
      revoked,
      today: aniversariosHoje.length,
      tomorrow: aniversariosAmanha.length,
      subs: activeSubs.length
    })
  } catch (err: any) {
    const msg = err?.message ?? 'Erro interno'
    try { console.error('api/push/cron-birthdays:error', msg) } catch {}
    res.status(502).json({ error: msg })
  }
}
