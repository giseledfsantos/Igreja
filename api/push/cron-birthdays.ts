import webpush from 'web-push'
import { createPrivateKey } from 'crypto'

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://xytuuccwylwbefgkqxlr.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY ?? (process.env as any).SUPABASE_SERVICE_ROLE_KEY ?? (process.env as any).SUPABASE_SERVICE_ROLE ?? ''
const VAPID_PUBLIC_KEY = String(
  process.env.VAPID_PUBLIC_KEY ??
    process.env.PUBLIC_VAPID_KEY ??
    process.env.PUBLIC_KEY ??
    (process.env as any).public_key ??
    ''
).trim()
const VAPID_PRIVATE_KEY = String(
  process.env.VAPID_PRIVATE_KEY ??
    process.env.PRIVATE_VAPID_KEY ??
    process.env.PRIVATE_KEY ??
    (process.env as any).private_key ??
    ''
).trim()
const VAPID_SUBJECT = String(process.env.VAPID_SUBJECT ?? 'mailto:admin@localhost').trim()

function ensureEnv() {
  if (!SUPABASE_URL) throw new Error('SUPABASE_URL ausente no ambiente')
  if (!SUPABASE_KEY) throw new Error('SUPABASE_KEY ausente no ambiente')
  if (!VAPID_PUBLIC_KEY) throw new Error('VAPID_PUBLIC_KEY ausente no ambiente')
  if (!VAPID_PRIVATE_KEY) throw new Error('VAPID_PRIVATE_KEY ausente no ambiente')
}

function normalizeVapidPrivateKey(k: string) {
  const s = String(k || '').trim()
  if (!s) return ''
  // Already looks like base64url little 'd' (32 bytes -> ~43 chars)
  if (/^[A-Za-z0-9\-_]+$/.test(s) && s.length >= 42 && s.length <= 45) return s

  function b64urlToBytes(input: string) {
    const t = String(input || '').trim()
    if (!t) return null
    const pad = '='.repeat((4 - (t.length % 4)) % 4)
    const b64 = t.replace(/-/g, '+').replace(/_/g, '/') + pad
    try { return Buffer.from(b64, 'base64') } catch { return null }
  }

  function b64ToBytes(input: string) {
    const t = String(input || '').trim()
    if (!t) return null
    try { return Buffer.from(t, 'base64') } catch { return null }
  }

  function bytesToB64Url(bytes: Uint8Array) {
    return Buffer.from(bytes).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  }

  function readDerLen(buf: Uint8Array, pos: number) {
    const first = buf[pos]
    if (first === undefined) return null
    if ((first & 0x80) === 0) return { len: first, lenBytes: 1 }
    const n = first & 0x7f
    if (n === 0 || n > 4) return null
    if (pos + 1 + n > buf.length) return null
    let len = 0
    for (let i = 0; i < n; i++) len = (len << 8) | buf[pos + 1 + i]
    return { len, lenBytes: 1 + n }
  }

  function readDerTlv(buf: Uint8Array, pos: number) {
    const tag = buf[pos]
    if (tag === undefined) return null
    const lenInfo = readDerLen(buf, pos + 1)
    if (!lenInfo) return null
    const start = pos + 1 + lenInfo.lenBytes
    const end = start + lenInfo.len
    if (end > buf.length) return null
    return { tag, start, end, next: end }
  }

  function parseSec1EcPrivateKey(buf: Uint8Array) {
    let p = 0
    const seq = readDerTlv(buf, p)
    if (!seq || seq.tag !== 0x30) return null
    p = seq.start
    const ver = readDerTlv(buf, p)
    if (!ver || ver.tag !== 0x02) return null
    p = ver.next
    const key = readDerTlv(buf, p)
    if (!key || key.tag !== 0x04) return null
    const keyBytes = buf.slice(key.start, key.end)
    if (keyBytes.length !== 32) return null
    return keyBytes
  }

  function parsePkcs8(buf: Uint8Array) {
    let p = 0
    const seq = readDerTlv(buf, p)
    if (!seq || seq.tag !== 0x30) return null
    p = seq.start
    const ver = readDerTlv(buf, p)
    if (!ver || ver.tag !== 0x02) return null
    p = ver.next
    const alg = readDerTlv(buf, p)
    if (!alg || alg.tag !== 0x30) return null
    p = alg.next
    const oct = readDerTlv(buf, p)
    if (!oct || oct.tag !== 0x04) return null
    const inner = buf.slice(oct.start, oct.end)
    return inner
  }

  try {
    const bytes =
      (/^[A-Za-z0-9\-_]+$/.test(s) ? b64urlToBytes(s) : null) ??
      (/^[A-Za-z0-9+/=]+$/.test(s) ? b64ToBytes(s) : null)

    if (bytes && bytes.length) {
      const direct = parseSec1EcPrivateKey(bytes)
      if (direct) return bytesToB64Url(direct)

      const inner = parsePkcs8(bytes)
      if (inner) {
        const sec1 = parseSec1EcPrivateKey(inner)
        if (sec1) return bytesToB64Url(sec1)
      }
    }

    let keyObj: any = null
    if (s.includes('-----BEGIN')) {
      keyObj = createPrivateKey({ key: s, format: 'pem' as any })
    } else if (/^[A-Za-z0-9+/=]+$/.test(s)) {
      const der = Buffer.from(s, 'base64')
      try {
        keyObj = createPrivateKey({ key: der, format: 'der' as any, type: 'sec1' as any })
      } catch {
        keyObj = createPrivateKey({ key: der, format: 'der' as any, type: 'pkcs8' as any })
      }
    } else if (/^[A-Za-z0-9\-_]+$/.test(s)) {
      // base64url -> base64, then try DER
      const pad = '='.repeat((4 - (s.length % 4)) % 4)
      const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad
      const der = Buffer.from(b64, 'base64')
      try {
        keyObj = createPrivateKey({ key: der, format: 'der' as any, type: 'sec1' as any })
      } catch {
        try {
          keyObj = createPrivateKey({ key: der, format: 'der' as any, type: 'pkcs8' as any })
        } catch {
          keyObj = null
        }
      }
    }
    if (!keyObj) return s
    const jwk: any = keyObj.export({ format: 'jwk' as any })
    const d = String(jwk?.d || '').trim()
    return d || s
  } catch {
    return s
  }
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

function addDays({ year, month, day }: { year: number; month: number; day: number }, days: number) {
  const dt = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0))
  return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() }
}

function parseYyyyMmDd(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim())
  if (!m) return null
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) }
}

function monthDayFromDateValue(v: any) {
  const s = String(v ?? '').trim()
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (m) return { month: Number(m[2]), day: Number(m[3]) }
  const br = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(s)
  if (br) return { month: Number(br[2]), day: Number(br[1]) }
  const br2 = /^(\d{2})-(\d{2})-(\d{4})/.exec(s)
  if (br2) return { month: Number(br2[2]), day: Number(br2[1]) }
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

    const urlObj = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`)
    const debug = urlObj.searchParams.get('debug') === '1'
    const asOfRaw = String(urlObj.searchParams.get('asOf') || '').trim()
    const secret = String(process.env.CRON_SECRET ?? process.env.PUSH_CRON_SECRET ?? '').trim()
    const key = String(urlObj.searchParams.get('key') || '').trim()

    const isCron = String(req.headers['x-vercel-cron'] ?? '') === '1'
    const isManualAllowed = !!secret && !!key && key === secret
    if (process.env.VERCEL && !isCron && !isManualAllowed) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const normalizedPrivateKey = normalizeVapidPrivateKey(VAPID_PRIVATE_KEY)
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, normalizedPrivateKey)

    const now = new Date()
    const forced = asOfRaw ? parseYyyyMmDd(asOfRaw) : null
    const today = forced ?? getDatePartsInSaoPaulo(now)
    const tomorrow = addDays(today, 1)

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
    let errors = 0

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
          errors++
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
      errors,
      today: aniversariosHoje.length,
      tomorrow: aniversariosAmanha.length,
      subs: activeSubs.length,
      allowedUsers: allowedUserIds.size,
      date: { today, tomorrow },
      matches: debug
        ? {
            today: aniversariosHoje.map(m => ({ id: m?.id, nome: m?.nome })),
            tomorrow: aniversariosAmanha.map(m => ({ id: m?.id, nome: m?.nome }))
          }
        : undefined
    })
  } catch (err: any) {
    const msg = err?.message ?? 'Erro interno'
    try { console.error('api/push/cron-birthdays:error', msg) } catch {}
    res.status(502).json({ error: msg })
  }
}
