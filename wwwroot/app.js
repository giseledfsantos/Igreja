const SUPABASE_URL = 'https://xytuuccwylwbefgkqxlr.supabase.co'
const API_KEY = 'sb_publishable_kmvt5bwvVonTji9qWqgjKg_r8oKsCRs'
const PROXY_BASE = '/db/rest'
const DIRECT_BASE = `${SUPABASE_URL}/rest/v1`
let API_MODE = null

function headers() {
  return {
    apikey: API_KEY,
    Authorization: 'Bearer ' + API_KEY,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Prefer: 'return=representation'
  }
}

// Descoberta OpenAPI desabilitada para evitar bloqueios de CORS; usamos schema local.

async function apiFetch(path, init, fallbackPath) {
  const proxyUrl = `${PROXY_BASE}${path}`
  const directUrl = `${DIRECT_BASE}${fallbackPath ?? path}`
  const method = String(init?.method || 'GET').toUpperCase()
  async function fetchChecked(url) {
    const res = await fetch(url, init)
    if (!res.ok) {
      let text = ''
      try { text = await res.text() } catch {}
      const msg = `[${method}] ${url} ${res.status}${res.statusText ? ' ' + res.statusText : ''}${text ? ' - ' + text : ''}`
      console.error('apiFetch error:', msg)
      throw new Error(msg)
    }
    return res
  }
  if (API_MODE === 'direct' && method === 'GET') return fetchChecked(directUrl)
  try {
    const res = await fetchChecked(proxyUrl)
    API_MODE = 'proxy'
    return res
  } catch (e) {
    const res = await fetchChecked(directUrl)
    API_MODE = 'direct'
    return res
  }
}

async function apiList(table) {
  const q = `/${encodeURIComponent(table)}?select=*`
  const res = await apiFetch(q, { headers: headers() })
  return res.json()
}
async function apiGet(table, params) {
  const qs = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    if (Array.isArray(v)) {
      v.forEach(x => {
        if (x === undefined || x === null) return
        if (qs.has(k)) qs.append(k, String(x))
        else qs.set(k, String(x))
      })
      return
    }
    if (qs.has(k)) qs.append(k, String(v))
    else qs.set(k, String(v))
  })
  const q = `/${encodeURIComponent(table)}?${qs.toString()}`
  const res = await apiFetch(q, { headers: headers() })
  return res.json()
}
async function apiCreate(table, payload) {
  const q = `/${encodeURIComponent(table)}`
  const res = await apiFetch(q, { method: 'POST', headers: headers(), body: JSON.stringify(payload) })
  return res.json()
}
async function apiUpdate(table, pk, id, payload) {
  const proxyQ = `/${encodeURIComponent(table)}?pk=${encodeURIComponent(pk)}&id=${encodeURIComponent(id)}`
  const directQ = `/${encodeURIComponent(table)}?${encodeURIComponent(pk)}=eq.${encodeURIComponent(id)}`
  const res = await apiFetch(proxyQ, { method: 'PATCH', headers: headers(), body: JSON.stringify(payload) }, directQ)
  const data = await res.json()
  if (Array.isArray(data) && data.length === 0) throw new Error('0 rows affected')
  return data
}
async function apiDelete(table, pk, id) {
  const proxyQ = `/${encodeURIComponent(table)}?pk=${encodeURIComponent(pk)}&id=${encodeURIComponent(id)}`
  const directQ = `/${encodeURIComponent(table)}?${encodeURIComponent(pk)}=eq.${encodeURIComponent(id)}`
  await apiFetch(proxyQ, { method: 'DELETE', headers: headers() }, directQ)
}
async function apiDeleteWhere(table, params) {
  const qs = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    if (Array.isArray(v)) {
      v.forEach(x => {
        if (x === undefined || x === null) return
        if (qs.has(k)) qs.append(k, String(x))
        else qs.set(k, String(x))
      })
      return
    }
    if (qs.has(k)) qs.append(k, String(v))
    else qs.set(k, String(v))
  })
  const q = qs.toString()
  if (!q) throw new Error('DELETE requires filters')
  const path = `/${encodeURIComponent(table)}?${q}`
  await apiFetch(path, { method: 'DELETE', headers: headers() })
}

function el(id) { return document.getElementById(id) }
function txt(el, data) { el.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2) }

const SVG_NS = 'http://www.w3.org/2000/svg'

function createSvg() {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  return svg
}

function addPath(svg, d) {
  const p = document.createElementNS(SVG_NS, 'path')
  p.setAttribute('d', d)
  svg.appendChild(p)
}

function iconEdit() {
  const svg = createSvg()
  addPath(svg, 'M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7')
  addPath(svg, 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z')
  return svg
}

function iconTrash() {
  const svg = createSvg()
  addPath(svg, 'M3 6h18')
  addPath(svg, 'M8 6V4h8v2')
  addPath(svg, 'M19 6l-1 14H6L5 6')
  addPath(svg, 'M10 11v6')
  addPath(svg, 'M14 11v6')
  return svg
}

function iconSave() {
  const svg = createSvg()
  addPath(svg, 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z')
  addPath(svg, 'M17 21v-8H7v8')
  addPath(svg, 'M7 3v5h8')
  return svg
}

function iconEye() {
  const svg = createSvg()
  addPath(svg, 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z')
  addPath(svg, 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z')
  return svg
}

function iconEyeOff() {
  const svg = createSvg()
  addPath(svg, 'M2 2l20 20')
  addPath(svg, 'M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a21.83 21.83 0 0 1-2.16 3.19')
  addPath(svg, 'M6.61 6.61A21.83 21.83 0 0 0 1 12s4 8 11 8a10.94 10.94 0 0 0 5.33-1.4')
  addPath(svg, 'M14.12 14.12a3 3 0 0 1-4.24-4.24')
  return svg
}

function iconUser() {
  const svg = createSvg()
  addPath(svg, 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2')
  addPath(svg, 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z')
  return svg
}

function iconMenu() {
  const svg = createSvg()
  addPath(svg, 'M3 12h18')
  addPath(svg, 'M3 6h18')
  addPath(svg, 'M3 18h18')
  return svg
}

const ICONS = { edit: iconEdit, trash: iconTrash, save: iconSave, eye: iconEye, eyeOff: iconEyeOff, user: iconUser, menu: iconMenu }
const APP_BUILD = '2026-03-25-31'

function setButtonIcon(button, name) {
  const factory = ICONS[name]
  if (!factory) return
  while (button.firstChild) button.removeChild(button.firstChild)
  button.appendChild(factory())
}

let __confirmModalEls = null
function confirmModal({ title, message, confirmText, cancelText, danger } = {}) {
  if (!__confirmModalEls) {
    const backdrop = document.createElement('div')
    backdrop.className = 'modal-backdrop'
    backdrop.setAttribute('role', 'presentation')
    const dialog = document.createElement('div')
    dialog.className = 'modal'
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    const h = document.createElement('h3')
    h.className = 'modal-title'
    const p = document.createElement('div')
    p.className = 'modal-message'
    const actions = document.createElement('div')
    actions.className = 'modal-actions'
    const btnCancel = document.createElement('button')
    btnCancel.type = 'button'
    btnCancel.className = 'btn-secondary'
    const btnOk = document.createElement('button')
    btnOk.type = 'button'
    actions.appendChild(btnCancel)
    actions.appendChild(btnOk)
    dialog.appendChild(h)
    dialog.appendChild(p)
    dialog.appendChild(actions)
    backdrop.appendChild(dialog)
    document.body.appendChild(backdrop)
    __confirmModalEls = { backdrop, dialog, h, p, btnCancel, btnOk, resolve: null, keyHandler: null }

    const close = (val) => {
      const els = __confirmModalEls
      if (!els) return
      els.backdrop.classList.remove('open')
      if (els.keyHandler) window.removeEventListener('keydown', els.keyHandler)
      els.keyHandler = null
      const r = els.resolve
      els.resolve = null
      if (r) r(val)
    }

    __confirmModalEls.btnCancel.onclick = () => close(false)
    __confirmModalEls.btnOk.onclick = () => close(true)
    __confirmModalEls.backdrop.onclick = (ev) => {
      if (ev.target === __confirmModalEls.backdrop) close(false)
    }
  }

  const els = __confirmModalEls
  els.h.textContent = String(title ?? 'Confirmar')
  els.p.textContent = String(message ?? '')
  els.btnCancel.textContent = String(cancelText ?? 'Cancelar')
  els.btnOk.textContent = String(confirmText ?? 'OK')
  els.btnOk.className = danger ? 'danger' : ''

  els.backdrop.classList.add('open')
  els.btnCancel.focus()
  return new Promise(resolve => {
    els.resolve = resolve
    els.keyHandler = (ev) => {
      if (ev.key === 'Escape') {
        ev.preventDefault()
        const r = els.resolve
        els.resolve = null
        els.backdrop.classList.remove('open')
        if (els.keyHandler) window.removeEventListener('keydown', els.keyHandler)
        els.keyHandler = null
        if (r) r(false)
      }
    }
    window.addEventListener('keydown', els.keyHandler)
  })
}

const DEFAULT_PASSWORD = '12345'
const AUTH_STORAGE_KEY = 'ieadm_auth_v1'
const LOGIN_ENABLED = true
let authState = { userId: '', usuario: '', allowedNorm: new Set() }
const MENU_COLLAPSED_KEY = 'ieadm_menu_collapsed_v1'
let __routeApplying = false
let __routeInitDone = false

function setMenuCollapsed(nextCollapsed) {
  const collapsed = !!nextCollapsed
  try { document.body.classList.toggle('menu-collapsed', collapsed) } catch {}
  try { localStorage.setItem(MENU_COLLAPSED_KEY, collapsed ? '1' : '0') } catch {}
}

function __routeToHash(route) {
  const p = String(route?.page ?? '').trim()
  if (p === 'home') return '#/'
  if (p === 'tab') {
    const tab = String(route?.tab ?? '').trim()
    if (!tab) return '#/'
    if (normalizeText(tab) === 'membros') {
      const view = String(route?.view ?? '').trim()
      if (view === 'cadastro') {
        const id = String(route?.id ?? '').trim()
        return id ? `#/membros/cadastro/${encodeURIComponent(id)}` : '#/membros/cadastro'
      }
      return '#/membros/consulta'
    }
    return `#/${encodeURIComponent(tab)}`
  }
  return '#/'
}

function __parseRouteFromHash() {
  const raw = String(location.hash || '')
  const h = raw.replace(/^#\/?/, '')
  if (!h) return { page: 'home' }
  const parts = h.split('/').map(x => decodeURIComponent(x)).filter(Boolean)
  const head = String(parts[0] || '').trim()
  if (!head || head === 'home') return { page: 'home' }
  if (normalizeText(head) === 'membros') {
    const view = String(parts[1] || '').trim() || 'consulta'
    if (view === 'cadastro') {
      const id = String(parts[2] || '').trim()
      return id ? { page: 'tab', tab: 'membros', view: 'cadastro', id } : { page: 'tab', tab: 'membros', view: 'cadastro' }
    }
    return { page: 'tab', tab: 'membros', view: 'consulta' }
  }
  return { page: 'tab', tab: head }
}

function __pushRoute(route, replace) {
  if (__routeApplying) return
  const r = route || { page: 'home' }
  const url = __routeToHash(r)
  try {
    if (replace) history.replaceState(r, '', url)
    else history.pushState(r, '', url)
  } catch {}
}

function navigateHome(opts) {
  renderHomeScreen()
  try { setMenuCollapsed(false) } catch {}
  __pushRoute({ page: 'home' }, !!opts?.replace)
}

async function __applyRoute(route) {
  const r = route || { page: 'home' }
  __routeApplying = true
  try {
    if (String(r?.page || '') === 'home') {
      navigateHome({ replace: true })
      return
    }
    if (String(r?.page || '') === 'tab') {
      const tab = String(r?.tab || '').trim()
      if (!tab) { navigateHome({ replace: true }); return }
      activateTab(tab, { route: false })
      if (normalizeText(tab) === 'membros') {
        const h = window.__igrejaRouteMembers
        if (h && typeof h.apply === 'function') {
          await h.apply(r)
        }
      }
      return
    }
    navigateHome({ replace: true })
  } finally {
    __routeApplying = false
  }
}

window.addEventListener('popstate', (ev) => {
  if (!schemaCache) return
  const r = ev?.state || __parseRouteFromHash()
  Promise.resolve(__applyRoute(r)).catch(() => {})
})

function normalizeText(v) {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

function firstExistingKey(obj, keys) {
  for (const k of keys) if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return k
  return ''
}

function firstExistingValue(obj, keys) {
  const k = firstExistingKey(obj, keys)
  if (!k) return null
  const v = obj?.[k]
  if (v === undefined || v === null) return null
  return v
}

async function tryCreateOne(tableName, payloads) {
  let lastErr = null
  for (const p of payloads) {
    try {
      const res = await apiCreate(tableName, [p])
      if (Array.isArray(res)) return res[0] ?? null
      return res ?? null
    } catch (e) {
      lastErr = e
      const msg = String(e?.message || e || '')
      if (msg.includes('Could not find') || msg.includes('column') || msg.includes('unknown')) continue
      throw e
    }
  }
  if (lastErr) throw lastErr
  return null
}

async function tryDeleteWhere(tableName, filterSets) {
  let lastErr = null
  for (const filters of filterSets) {
    try {
      await apiDeleteWhere(tableName, filters)
      return
    } catch (e) {
      lastErr = e
      const msg = String(e?.message || e || '')
      if (msg.includes('Could not find') || msg.includes('column') || msg.includes('unknown')) continue
      if (msg.includes('0 rows affected')) return
      throw e
    }
  }
  if (lastErr) throw lastErr
}

function saveAuth() {
  try {
    const payload = { userId: authState.userId, usuario: authState.usuario, allowed: Array.from(authState.allowedNorm || []) }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload))
  } catch {}
}

function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return
    const obj = JSON.parse(raw)
    authState.userId = String(obj?.userId ?? '').trim()
    authState.usuario = String(obj?.usuario ?? '').trim()
    authState.allowedNorm = new Set(Array.isArray(obj?.allowed) ? obj.allowed.map(normalizeText).filter(Boolean) : [])
  } catch {}
}

function clearAuth() {
  authState = { userId: '', usuario: '', allowedNorm: new Set() }
  try { localStorage.removeItem(AUTH_STORAGE_KEY) } catch {}
}

function b64FromBytes(bytes) {
  let s = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(s)
}

function bytesFromB64(b64) {
  const bin = atob(String(b64 || ''))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i)
  return out
}

function urlB64ToUint8Array(b64Url) {
  const s = String(b64Url || '').trim()
  if (!s) return new Uint8Array()
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/')
  return bytesFromB64(b64)
}

function isTruthyDb(v) {
  if (v === true) return true
  if (v === false) return false
  if (v === 1 || v === '1') return true
  if (v === 0 || v === '0') return false
  const s = String(v ?? '').trim().toLowerCase()
  if (s === 'true' || s === 't' || s === 'yes' || s === 'sim') return true
  if (s === 'false' || s === 'f' || s === 'no' || s === 'nao' || s === 'não') return false
  return !!v
}

async function pushHasSubscriptionForUser(userId) {
  const id = String(userId ?? '').trim()
  if (!id) return false
  const res = await fetch(`/api/push/has-subscription?id_usuario=${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { apikey: API_KEY, Authorization: 'Bearer ' + API_KEY }
  })
  if (!res.ok) return false
  const data = await res.json().catch(() => ({}))
  return !!data?.hasSubscription
}

async function pushEnableForUser(userId) {
  const id = String(userId ?? '').trim()
  if (!id) throw new Error('Usuário inválido.')
  if (!('serviceWorker' in navigator)) throw new Error('Service Worker não suportado neste navegador.')
  if (!('PushManager' in window)) throw new Error('Push não suportado neste navegador.')

  let perm = 'default'
  try { perm = Notification.permission } catch {}
  if (perm !== 'granted') {
    perm = await Notification.requestPermission()
  }
  if (perm !== 'granted') throw new Error('Permissão de notificações negada.')

  const vapidRes = await fetch('/api/push/vapid-public-key', { method: 'GET' })
  if (!vapidRes.ok) {
    let text = ''
    try { text = await vapidRes.text() } catch {}
    throw new Error(text || 'Não foi possível obter a chave do push.')
  }
  const vapidData = await vapidRes.json().catch(() => ({}))
  const publicKey = String(vapidData?.publicKey || '').trim()
  if (!publicKey) throw new Error('Chave do push inválida.')
  const appServerKey = urlB64ToUint8Array(publicKey)

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appServerKey })
  }

  const payload = { idUsuario: id, subscription: sub, userAgent: navigator.userAgent }
  const saveRes = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: API_KEY, Authorization: 'Bearer ' + API_KEY },
    body: JSON.stringify(payload)
  })
  if (!saveRes.ok) {
    let text = ''
    try { text = await saveRes.text() } catch {}
    throw new Error(text || 'Não foi possível salvar a inscrição do push.')
  }
  return true
}

async function maybePromptEnablePushAfterLogin(userRow, userId, showStatus) {
  const receives = isTruthyDb(firstExistingValue(userRow, ['recebe_notificacoes', 'recebeNotificacoes', 'receber_notificacoes', 'notificacoes']))
  if (!receives) return
  const has = await pushHasSubscriptionForUser(userId)
  if (has) return
  const ok = await confirmModal({
    title: 'Ativar Notificações',
    message: 'Deseja ativar as notificações deste dispositivo?',
    confirmText: 'Ativar',
    cancelText: 'Agora não'
  })
  if (!ok) return
  try {
    await pushEnableForUser(userId)
    if (typeof showStatus === 'function') showStatus('Notificações ativadas.', 'success')
  } catch (e) {
    if (typeof showStatus === 'function') showStatus(String(e?.message || e || 'Falha ao ativar notificações.'), 'error')
  }
}

async function hashPasswordPbkdf2(password, { iterations = 120000, saltB64 = '' } = {}) {
  const salt = saltB64 ? bytesFromB64(saltB64) : crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(password ?? '')), { name: 'PBKDF2' }, false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256)
  const hashB64 = b64FromBytes(new Uint8Array(bits))
  const saltOut = saltB64 || b64FromBytes(salt)
  return `pbkdf2_sha256$${iterations}$${saltOut}$${hashB64}`
}

async function verifyPassword(password, stored) {
  const s = String(stored ?? '').trim()
  if (!s) return false
  if (!s.startsWith('pbkdf2_sha256$')) return s === String(password ?? '')
  const parts = s.split('$')
  const iterations = Number(parts?.[1] ?? 0) || 120000
  const saltB64 = String(parts?.[2] ?? '')
  const hashB64 = String(parts?.[3] ?? '')
  if (!saltB64 || !hashB64) return false
  const computed = await hashPasswordPbkdf2(password, { iterations, saltB64 })
  return computed === s
}

let __passwordModalEls = null
function changePasswordModal() {
  if (!__passwordModalEls) {
    const backdrop = document.createElement('div')
    backdrop.className = 'modal-backdrop'
    backdrop.setAttribute('role', 'presentation')
    const dialog = document.createElement('div')
    dialog.className = 'modal'
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')

    const h = document.createElement('h3')
    h.className = 'modal-title'
    h.textContent = 'Alterar senha'

    const msg = document.createElement('div')
    msg.className = 'modal-message'
    msg.textContent = 'Defina uma nova senha para continuar.'

    const field1 = document.createElement('div')
    field1.className = 'field'
    const label1 = document.createElement('label')
    label1.textContent = 'Nova senha'
    const input1 = document.createElement('input')
    input1.type = 'password'
    input1.autocomplete = 'new-password'
    const wrap1 = document.createElement('div')
    wrap1.className = 'input-with-icon'
    const btnEye1 = document.createElement('button')
    btnEye1.type = 'button'
    btnEye1.className = 'eye-btn'
    btnEye1.setAttribute('aria-label', 'Mostrar senha')
    setButtonIcon(btnEye1, 'eye')
    wrap1.appendChild(input1)
    wrap1.appendChild(btnEye1)
    field1.appendChild(label1)
    field1.appendChild(wrap1)

    const field2 = document.createElement('div')
    field2.className = 'field'
    const label2 = document.createElement('label')
    label2.textContent = 'Confirmar senha'
    const input2 = document.createElement('input')
    input2.type = 'password'
    input2.autocomplete = 'new-password'
    const wrap2 = document.createElement('div')
    wrap2.className = 'input-with-icon'
    const btnEye2 = document.createElement('button')
    btnEye2.type = 'button'
    btnEye2.className = 'eye-btn'
    btnEye2.setAttribute('aria-label', 'Mostrar senha')
    setButtonIcon(btnEye2, 'eye')
    wrap2.appendChild(input2)
    wrap2.appendChild(btnEye2)
    field2.appendChild(label2)
    field2.appendChild(wrap2)

    const err = document.createElement('div')
    err.className = 'status error'
    err.style.display = 'none'

    const actions = document.createElement('div')
    actions.className = 'modal-actions'
    const btnCancel = document.createElement('button')
    btnCancel.type = 'button'
    btnCancel.className = 'btn-secondary'
    btnCancel.textContent = 'Cancelar'
    const btnOk = document.createElement('button')
    btnOk.type = 'button'
    btnOk.textContent = 'Salvar'
    actions.appendChild(btnCancel)
    actions.appendChild(btnOk)

    dialog.appendChild(h)
    dialog.appendChild(msg)
    dialog.appendChild(field1)
    dialog.appendChild(field2)
    dialog.appendChild(err)
    dialog.appendChild(actions)
    backdrop.appendChild(dialog)
    document.body.appendChild(backdrop)

    let passVisible = false
    function setVisible(v) {
      passVisible = !!v
      const t = passVisible ? 'text' : 'password'
      input1.type = t
      input2.type = t
      setButtonIcon(btnEye1, passVisible ? 'eyeOff' : 'eye')
      setButtonIcon(btnEye2, passVisible ? 'eyeOff' : 'eye')
      btnEye1.setAttribute('aria-label', passVisible ? 'Ocultar senha' : 'Mostrar senha')
      btnEye2.setAttribute('aria-label', passVisible ? 'Ocultar senha' : 'Mostrar senha')
    }
    btnEye1.onclick = () => setVisible(!passVisible)
    btnEye2.onclick = () => setVisible(!passVisible)

    __passwordModalEls = { backdrop, input1, input2, err, btnCancel, btnOk, setVisible, resolve: null, keyHandler: null }

    const close = (val) => {
      const els = __passwordModalEls
      els.backdrop.classList.remove('open')
      if (els.keyHandler) window.removeEventListener('keydown', els.keyHandler)
      els.keyHandler = null
      const r = els.resolve
      els.resolve = null
      if (r) r(val)
    }

    btnCancel.onclick = () => close(null)
    backdrop.onclick = (ev) => { if (ev.target === backdrop) close(null) }
    btnOk.onclick = () => {
      const p1 = String(input1.value ?? '')
      const p2 = String(input2.value ?? '')
      err.style.display = 'none'
      if (!p1 || p1.length < 5) { err.textContent = 'Informe uma senha com pelo menos 5 caracteres.'; err.style.display = 'block'; return }
      if (p1 === DEFAULT_PASSWORD) { err.textContent = 'A nova senha não pode ser a senha padrão.'; err.style.display = 'block'; return }
      if (p1 !== p2) { err.textContent = 'As senhas não conferem.'; err.style.display = 'block'; return }
      close(p1)
    }
  }

  const els = __passwordModalEls
  els.input1.value = ''
  els.input2.value = ''
  els.setVisible(false)
  els.err.style.display = 'none'
  els.backdrop.classList.add('open')
  els.input1.focus()
  return new Promise(resolve => {
    els.resolve = resolve
    els.keyHandler = (ev) => {
      if (ev.key === 'Escape') {
        ev.preventDefault()
        const r = els.resolve
        els.resolve = null
        els.backdrop.classList.remove('open')
        if (els.keyHandler) window.removeEventListener('keydown', els.keyHandler)
        els.keyHandler = null
        if (r) r(null)
      }
    }
    window.addEventListener('keydown', els.keyHandler)
  })
}

async function loadSchema() {
  let configured = { tables: [] }
  try {
    const resCfg = await fetch(`/schema.json?v=${encodeURIComponent(APP_BUILD)}`)
    if (resCfg.ok) configured = await resCfg.json()
  } catch {}
  return configured
}

function renderTabs(schema) {
  const tabs = el('tabs')
  tabs.innerHTML = ''
  const allTables = Array.isArray(schema?.tables) ? schema.tables : []
  const tables = allTables.filter(t => {
    const nm = normalizeText(t?.name)
    if (nm === 'login') return false
    if (!LOGIN_ENABLED) return true
    if (!authState.userId) return false
    if (!authState.allowedNorm || !authState.allowedNorm.size) return false
    const ln = normalizeText(t?.label)
    return authState.allowedNorm.has(nm) || authState.allowedNorm.has(ln)
  })
  tables.forEach((t) => {
    const b = document.createElement('button')
    b.className = 'tab'
    b.textContent = t.label || t.name
    b.dataset.name = t.name
    b.onclick = () => {
      activateTab(t.name)
      setMenuCollapsed(true)
    }
    tabs.appendChild(b)
  })
}

function clear(node) { while (node.firstChild) node.removeChild(node.firstChild) }

function renderHomeScreen() {
  const screens = el('screens')
  clear(screens)
  current = null
  document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'))
  try { document.body.classList.remove('screen-login') } catch {}
}

function renderField(field, value = '') {
  const wrap = document.createElement('div')
  wrap.className = 'field'
  const label = document.createElement('label')
  label.textContent = field.label
  let input
  if (field.type === 'textarea') {
    input = document.createElement('textarea')
    input.value = value ?? ''
  } else if (field.type === 'select') {
    input = document.createElement('select')
    input.dataset.initialValue = String(value ?? '')
    const opts = field.options
    if (Array.isArray(opts) && opts.length) {
      opts.forEach(opt => {
        const o = document.createElement('option')
        o.value = String(opt)
        o.textContent = String(opt)
        if (String(value) === String(opt)) o.selected = true
        input.appendChild(o)
      })
    } else if (field.source && field.source.table && field.source.value && field.source.label) {
      apiList(field.source.table).then(rows => {
        rows.forEach(r => {
          const o = document.createElement('option')
          const val = String(r[field.source.value])
          const lab = String(r[field.source.label])
          o.value = val
          o.textContent = lab
          if (String(value) === val) o.selected = true
          input.appendChild(o)
        })
        if (input.dataset.initialValue !== undefined) input.value = input.dataset.initialValue
      }).catch(() => {})
    }
  } else {
    input = document.createElement('input')
    input.value = value ?? ''
    input.type = field.type || 'text'
    if (field.type === 'checkbox') {
      input.checked = Boolean(value)
    }
  }
  input.required = !!field.required
  input.dataset.key = field.key
  wrap.appendChild(label)
  wrap.appendChild(input)
  return wrap
}

function collectPayload(container) {
  const payload = {}
  container.querySelectorAll('input,textarea,select').forEach(i => {
    const k = i.dataset.key
    let v = i.value
    if (i.type === 'number') v = v ? Number(v) : null
    if (i.type === 'checkbox') v = i.checked
    if (i.type === 'date' || i.type === 'datetime-local') v = v ? v : null
    if (i.tagName === 'SELECT') {
      if (v === '') v = null
      else if (/^-?\d+$/.test(v)) v = Number(v)
    }
    if (typeof v === 'string' && k && k.toLowerCase() === 'cpf' && v.trim() === '') v = null
    payload[k] = v
  })
  return payload
}

function renderTableScreen(schema, table) {
  const screens = el('screens')
  clear(screens)
  try { document.body.classList.toggle('screen-login', String(table.name).toLowerCase() === 'login') } catch {}
  if (String(table.name).toLowerCase() === 'login') {
    if (!LOGIN_ENABLED) {
      const card = document.createElement('section')
      card.className = 'card'
      const h = document.createElement('h2')
      h.textContent = 'Login'
      const p = document.createElement('div')
      p.textContent = 'Tela de login desativada temporariamente.'
      card.appendChild(h)
      card.appendChild(p)
      screens.appendChild(card)
      return
    }
    return renderLoginScreen(schema, table)
  }
  if (String(table.name).toLowerCase() === 'membros') {
    return renderMembersScreen(schema, table)
  }
  if (String(table.name).toLowerCase() === 'ebd') {
    return renderEbdScreen(schema, table)
  }
  if (String(table.name).toLowerCase() === 'usuarios') {
    return renderUsuariosScreen(schema, table)
  }
  if (String(table.name).toLowerCase() === 'circulo_oracao') {
    return renderCirculoOracaoScreen(schema, table)
  }
  const cardList = document.createElement('section')
  cardList.className = 'card'
  const hList = document.createElement('h2')
  hList.textContent = 'Lista'
  const out = document.createElement('div')
  out.className = 'output'
  const btnList = document.createElement('button')
  btnList.textContent = 'Atualizar lista'
  btnList.onclick = async () => {
    out.textContent = ''
    try { txt(out, await apiList(table.name)) } catch (e) { txt(out, String(e.message || e)) }
  }
  cardList.appendChild(hList); cardList.appendChild(btnList); cardList.appendChild(out)

  const cardCreate = document.createElement('section')
  cardCreate.className = 'card'
  const hCreate = document.createElement('h2')
  hCreate.textContent = 'Criar'
  const formCreate = document.createElement('div')
  table.fields.forEach(f => formCreate.appendChild(renderField(f)))
  const actionsCreate = document.createElement('div')
  actionsCreate.className = 'actions'
  const btnCreate = document.createElement('button')
  btnCreate.textContent = 'Criar'
  const outCreate = document.createElement('div')
  outCreate.className = 'output'
  btnCreate.onclick = async () => {
    outCreate.textContent = ''
    try { txt(outCreate, await apiCreate(table.name, collectPayload(formCreate))) } catch (e) { txt(outCreate, String(e.message || e)) }
  }
  actionsCreate.appendChild(btnCreate)
  cardCreate.appendChild(hCreate); cardCreate.appendChild(formCreate); cardCreate.appendChild(actionsCreate); cardCreate.appendChild(outCreate)

  const cardUpdate = document.createElement('section')
  cardUpdate.className = 'card'
  const hUpdate = document.createElement('h2')
  hUpdate.textContent = 'Atualizar'
  const idWrap = document.createElement('div')
  idWrap.className = 'field'
  const idLabel = document.createElement('label')
  idLabel.textContent = 'ID'
  const idInput = document.createElement('input')
  idInput.type = 'text'
  idWrap.appendChild(idLabel); idWrap.appendChild(idInput)
  const formUpdate = document.createElement('div')
  table.fields.forEach(f => formUpdate.appendChild(renderField(f)))
  const actionsUpdate = document.createElement('div')
  actionsUpdate.className = 'actions'
  const btnUpdate = document.createElement('button')
  btnUpdate.title = 'Alterar'
  btnUpdate.setAttribute('aria-label', 'Alterar')
  btnUpdate.className = 'icon-btn'
  setButtonIcon(btnUpdate, 'edit')
  const outUpdate = document.createElement('div')
  outUpdate.className = 'output'
  btnUpdate.onclick = async () => {
    outUpdate.textContent = ''
    if (!idInput.value.trim()) { txt(outUpdate, 'Informe o ID'); return }
    try { txt(outUpdate, await apiUpdate(table.name, table.pk, idInput.value.trim(), collectPayload(formUpdate))) } catch (e) { txt(outUpdate, String(e.message || e)) }
  }
  actionsUpdate.appendChild(btnUpdate)
  cardUpdate.appendChild(hUpdate); cardUpdate.appendChild(idWrap); cardUpdate.appendChild(formUpdate); cardUpdate.appendChild(actionsUpdate); cardUpdate.appendChild(outUpdate)

  const cardDelete = document.createElement('section')
  cardDelete.className = 'card'
  const hDelete = document.createElement('h2')
  hDelete.textContent = 'Excluir'
  const delWrap = document.createElement('div')
  delWrap.className = 'field'
  const delLabel = document.createElement('label')
  delLabel.textContent = 'ID'
  const delInput = document.createElement('input')
  delInput.type = 'text'
  delWrap.appendChild(delLabel); delWrap.appendChild(delInput)
  const actionsDelete = document.createElement('div')
  actionsDelete.className = 'actions'
  const btnDelete = document.createElement('button')
  btnDelete.title = 'Excluir'
  btnDelete.setAttribute('aria-label', 'Excluir')
  btnDelete.className = 'danger icon-btn'
  setButtonIcon(btnDelete, 'trash')
  const outDelete = document.createElement('div')
  outDelete.className = 'output'
  btnDelete.onclick = async () => {
    outDelete.textContent = ''
    if (!delInput.value.trim()) { txt(outDelete, 'Informe o ID'); return }
    try { await apiDelete(table.name, table.pk, delInput.value.trim()); txt(outDelete, 'Excluído') } catch (e) { txt(outDelete, String(e.message || e)) }
  }
  actionsDelete.appendChild(btnDelete)
  cardDelete.appendChild(hDelete); cardDelete.appendChild(delWrap); cardDelete.appendChild(actionsDelete); cardDelete.appendChild(outDelete)

  screens.appendChild(cardList)
  screens.appendChild(cardCreate)
  screens.appendChild(cardUpdate)
  screens.appendChild(cardDelete)
}

function renderMembersScreen(schema, table) {
  const screens = el('screens')
  clear(screens)
  const subtabs = document.createElement('div')
  subtabs.className = 'subtabs'
  const btnConsulta = document.createElement('button')
  btnConsulta.className = 'subtab active'
  btnConsulta.textContent = 'Consulta'
  const btnCadastro = document.createElement('button')
  btnCadastro.className = 'subtab'
  btnCadastro.textContent = 'Cadastro'
  subtabs.appendChild(btnConsulta)
  subtabs.appendChild(btnCadastro)
  screens.appendChild(subtabs)
  const status = document.createElement('div')
  status.className = 'status'
  screens.appendChild(status)
  let statusTimer = null
  function showStatus(text, type) {
    status.textContent = text
    status.classList.remove('success', 'error')
    if (type === 'success') status.classList.add('success')
    if (type === 'error') status.classList.add('error')
    status.style.display = 'block'
    if (statusTimer) clearTimeout(statusTimer)
    if (type !== 'error') statusTimer = setTimeout(() => { status.style.display = 'none' }, 2500)
  }
  function friendlySalvarError(e) {
    const msg = String(e?.message || e || '')
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) return 'Falha de conexão com o servidor.'
    if (msg.includes('row-level security policy')) return 'Sem permissão para salvar (RLS do Supabase).'
    return msg
  }
  function friendlyUsuariosModulosError(e) {
    const msg = String(e?.message || e || '')
    if (msg.includes('usuarios_modulos') && msg.includes('row-level security policy')) return 'Sem permissão para salvar módulos (RLS do Supabase em "usuarios_modulos").'
    if (msg.includes('usuarios_modulos') && (msg.includes('column') || msg.includes('Could not find'))) return 'Falha ao salvar módulos (colunas de "usuarios_modulos" não conferem com o payload).'
    if (msg.includes('usuarios_modulos') && (msg.includes('violates') || msg.includes('foreign key'))) return 'Falha ao salvar módulos (IDs de usuário/módulo precisam existir).'
    if (msg.includes('invalid input syntax for type bigint')) return 'Falha ao salvar módulos (IDs precisam ser numéricos).'
    return msg
  }
  if (!window.__igrejaErrorHooked) {
    window.__igrejaErrorHooked = true
    window.addEventListener('error', (ev) => {
      try {
        const m = String(ev?.message || ev?.error?.message || 'Erro de script')
        showStatus(m, 'error')
      } catch {}
    })
    window.addEventListener('unhandledrejection', (ev) => {
      try {
        const m = String(ev?.reason?.message || ev?.reason || 'Promise rejeitada')
        showStatus(m, 'error')
      } catch {}
    })
  }

  const panelConsulta = document.createElement('div')
  const cardList = document.createElement('section')
  cardList.className = 'card'
  const hList = document.createElement('h2')
  hList.textContent = 'Lista de Membros'
  const headRow = document.createElement('div')
  headRow.style.display = 'flex'
  headRow.style.alignItems = 'baseline'
  headRow.style.justifyContent = 'space-between'
  headRow.style.gap = '12px'
  const filtersWrap = document.createElement('div')
  filtersWrap.className = 'filters'
  const totalWrap = document.createElement('h2')
  totalWrap.className = 'list-total'
  totalWrap.textContent = 'Total - 0'
  const listWrap = document.createElement('div')
  listWrap.className = 'list-items'
  let lastConsultaScrollY = 0
  let shouldRestoreConsultaScroll = false
  let filtroNomeInput = null
  let filtroDataNascInput = null
  let filtroGruposField = null
  let filtroCargosInternosField = null
  let filtroMesesField = null
  let membrosGrupoIndex = null
  let membrosGrupoIndexError = null
  let membrosCargosInternosIndex = null
  let membrosCargosInternosIndexError = null

  function getScrollY() {
    try {
      return Number(window?.scrollY || document?.documentElement?.scrollTop || document?.body?.scrollTop || 0) || 0
    } catch {
      return 0
    }
  }
  function restoreScrollY(y) {
    const yy = Number(y || 0) || 0
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try { window.scrollTo(0, yy) } catch {}
      })
    })
  }
  function saveConsultaScrollPosition() {
    lastConsultaScrollY = getScrollY()
    shouldRestoreConsultaScroll = true
  }

  function normText(s) {
    const v = String(s ?? '').toLowerCase().trim()
    try { return v.normalize('NFD').replace(/\p{Diacritic}/gu, '') } catch { return v }
  }
  function dateOnly(value) {
    const s = String(value ?? '')
    if (!s) return ''
    if (s.length >= 10) return s.slice(0, 10)
    return s
  }
  function monthFromDate(value) {
    const d = dateOnly(value)
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return String(parseInt(d.slice(5, 7), 10))
    const dt = new Date(String(value ?? ''))
    if (!Number.isFinite(dt.getTime())) return ''
    return String(dt.getMonth() + 1)
  }
  function intersectsSet(a, b) {
    for (const v of a) if (b.has(v)) return true
    return false
  }
  async function ensureMembrosGrupoIndexLoaded() {
    if (membrosGrupoIndex) return
    membrosGrupoIndexError = null
    try {
      const rows = await apiGet('membros_grupo', { select: 'id_membro,id_grupo' })
      membrosGrupoIndex = new Map()
      ;(Array.isArray(rows) ? rows : []).forEach(r => {
        const mid = String(r?.id_membro ?? '')
        const gid = String(r?.id_grupo ?? '')
        if (!mid || !gid) return
        if (!membrosGrupoIndex.has(mid)) membrosGrupoIndex.set(mid, new Set())
        membrosGrupoIndex.get(mid).add(gid)
      })
    } catch (e) {
      membrosGrupoIndex = new Map()
      membrosGrupoIndexError = e
    }
  }
  async function ensureMembrosCargosInternosIndexLoaded() {
    if (membrosCargosInternosIndex) return
    membrosCargosInternosIndexError = null
    try {
      const rows = await apiGet('membros_cargos_internos', { select: '*' })
      const list = Array.isArray(rows) ? rows : []
      const sample = list[0] || {}
      const membroKey = pickKey(sample, ['id_membro', 'membro_id', 'idMembro'])
      const cargoKey = pickKey(sample, ['id_cargos_internos', 'id_cargo_interno', 'cargo_interno_id', 'id_cargo'])
      membrosCargosInternosIndex = new Map()
      list.forEach(r => {
        const mid = String(r?.[membroKey] ?? '')
        const cid = String(r?.[cargoKey] ?? '')
        if (!mid || !cid) return
        if (!membrosCargosInternosIndex.has(mid)) membrosCargosInternosIndex.set(mid, new Set())
        membrosCargosInternosIndex.get(mid).add(cid)
      })
    } catch (e) {
      membrosCargosInternosIndex = new Map()
      membrosCargosInternosIndexError = e
    }
  }
  async function refreshList() {
    try {
      const data = await apiList(table.name)
      const nomeQ = filtroNomeInput ? normText(filtroNomeInput.value) : ''
      const dataNascQ = filtroDataNascInput ? String(filtroDataNascInput.value || '') : ''
      const mesesQ = new Set(filtroMesesField ? filtroMesesField.getSelected().map(x => String(x)) : [])
      const gruposQ = new Set(filtroGruposField ? filtroGruposField.getSelected().map(x => String(x)) : [])
      const cargosQ = new Set(filtroCargosInternosField ? filtroCargosInternosField.getSelected().map(x => String(x)) : [])
      if (gruposQ.size) await ensureMembrosGrupoIndexLoaded()
      if (gruposQ.size && membrosGrupoIndexError) {
        showStatus('Sem permissão para filtrar por grupo (RLS em "membros_grupo").', 'error')
      }
      if (cargosQ.size) await ensureMembrosCargosInternosIndexLoaded()
      if (cargosQ.size && membrosCargosInternosIndexError) {
        showStatus('Sem permissão para filtrar por cargo interno (RLS em "membros_cargos_internos").', 'error')
      }

      const filtered = (Array.isArray(data) ? data : []).filter(item => {
        if (nomeQ) {
          const hay = `${item?.nome ?? ''} ${item?.matricula ?? ''}`
          if (!normText(hay).includes(nomeQ)) return false
        }
        const dn = item?.data_nascimento
        if (dataNascQ && dateOnly(dn) !== dataNascQ) return false
        if (mesesQ.size) {
          const m = monthFromDate(dn)
          if (!m || !mesesQ.has(m)) return false
        }
        if (gruposQ.size && !membrosGrupoIndexError) {
          const mid = String(item?.[table.pk] ?? '')
          const set = membrosGrupoIndex.get(mid) || new Set()
          if (!intersectsSet(gruposQ, set)) return false
        }
        if (cargosQ.size && !membrosCargosInternosIndexError) {
          const mid = String(item?.[table.pk] ?? '')
          const set = membrosCargosInternosIndex.get(mid) || new Set()
          if (!intersectsSet(cargosQ, set)) return false
        }
        return true
      })
      filtered.sort((a, b) => {
        const an = String(a?.nome ?? '').trim()
        const bn = String(b?.nome ?? '').trim()
        if (an && bn) return an.localeCompare(bn, 'pt-BR', { sensitivity: 'base' })
        if (an) return -1
        if (bn) return 1
        const am = String(a?.matricula ?? '').trim()
        const bm = String(b?.matricula ?? '').trim()
        return am.localeCompare(bm, 'pt-BR', { sensitivity: 'base' })
      })

      console.log('Consulta:list', { count: Array.isArray(data) ? data.length : 0, filtered: filtered.length })
      totalWrap.textContent = `Total - ${filtered.length}`
      const frag = document.createDocumentFragment()
      filtered.forEach(item => {
        const div = document.createElement('div')
        div.className = 'list-item'
        const title = document.createElement('div'); title.className = 'title'; title.textContent = item.nome || (item.matricula || '')
        title.style.cursor = 'pointer'
        title.onclick = async () => {
          saveConsultaScrollPosition()
          await fillCadastro(item)
          setActiveCadastro({ keep: true, id: String(item?.[table.pk] ?? '').trim(), scrollTop: true })
        }
        const actionsDiv = document.createElement('div'); actionsDiv.className = 'grid-actions'
        const btnDelete = document.createElement('button'); btnDelete.type = 'button'; btnDelete.title = 'Excluir'; btnDelete.setAttribute('aria-label', 'Excluir'); btnDelete.className = 'danger icon-btn'; setButtonIcon(btnDelete, 'trash')
        btnDelete.onclick = async (ev) => {
          try { ev?.stopPropagation?.() } catch {}
          const prevScrollY = getScrollY()
          try {
            const id = String(item?.[table.pk] ?? '').trim()
            const nome = String(item?.nome ?? '').trim()
            if (!id) { showStatus('ID do membro não encontrado.', 'error'); return }
            const ok = await confirmModal({
              title: 'Confirmar exclusão',
              message: `Excluir o membro "${nome || id}"?`,
              confirmText: 'Excluir',
              cancelText: 'Cancelar',
              danger: true
            })
            if (!ok) return
            showStatus('Excluindo...', 'success')

            try {
              await apiDeleteWhere(MEMBROS_CARGOS_INTERNOS_TABLE, { [membrosCargosInternosMembroKey]: `eq.${id}` })
            } catch {}
            try {
              await apiDeleteWhere(MEMBROS_GRUPO_TABLE, { [membrosGrupoMembroKey]: `eq.${id}` })
            } catch {}

            await apiDelete(table.name, table.pk, id)
            showStatus(`Excluído: ${nome || id}`, 'success')
            await refreshList()
            restoreScrollY(prevScrollY)
          } catch (e) {
            showStatus(String(e.message || e), 'error')
          }
        }
        actionsDiv.appendChild(btnDelete)
        div.appendChild(title)
        div.appendChild(actionsDiv)
        frag.appendChild(div)
      })
      listWrap.innerHTML = ''
      listWrap.appendChild(frag)
    } catch (e) {
      totalWrap.textContent = 'Total - 0'
      listWrap.innerHTML = ''
      listWrap.textContent = String(e.message || e)
    }
  }
  headRow.appendChild(hList)
  headRow.appendChild(totalWrap)
  cardList.appendChild(headRow)
  cardList.appendChild(filtersWrap)
  cardList.appendChild(listWrap)
  panelConsulta.appendChild(cardList)

  const panelCadastro = document.createElement('div')
  const cardCad = document.createElement('section')
  cardCad.className = 'card'
  const hCad = document.createElement('h2')
  hCad.textContent = 'Cadastro de Membro'
  const idWrap = document.createElement('div')
  idWrap.className = 'field'
  const idLabel = document.createElement('label')
  idLabel.textContent = 'ID'
  const idInput = document.createElement('input')
  idInput.type = 'text'
  idInput.readOnly = true
  idWrap.appendChild(idLabel); idWrap.appendChild(idInput)

  function pickKey(obj, keys) {
    for (const k of keys) if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return k
    return keys[0]
  }
  function guessLabelKey(obj) {
    const candidates = ['nome', 'descricao', 'name', 'titulo', 'label']
    for (const k of candidates) if (obj && Object.prototype.hasOwnProperty.call(obj, k) && typeof obj[k] === 'string') return k
    for (const k of Object.keys(obj || {})) if (typeof obj?.[k] === 'string') return k
    return 'nome'
  }

  function createChecklistField(labelText, onChange) {
    const wrap = document.createElement('div')
    wrap.className = 'field'
    const label = document.createElement('label')
    label.textContent = labelText
    const details = document.createElement('details')
    details.className = 'checklist'
    const summary = document.createElement('summary')
    summary.textContent = 'Selecionar...'
    const items = document.createElement('div')
    items.className = 'checklist-items'
    details.appendChild(summary)
    details.appendChild(items)
    wrap.appendChild(label)
    wrap.appendChild(details)

    let options = []
    let selected = new Set()
    let disabled = false

    function updateSummary() {
      if (!options.length) { summary.textContent = 'Sem opções'; return }
      if (!selected.size) { summary.textContent = 'Selecionar...'; return }
      const labels = options
        .filter(o => selected.has(String(o.value)))
        .map(o => o.label)
        .slice(0, 3)
      summary.textContent = labels.join(', ') + (selected.size > 3 ? ` (+${selected.size - 3})` : '')
    }

    function setOptions(nextOptions) {
      options = Array.isArray(nextOptions) ? nextOptions : []
      items.innerHTML = ''
      options.forEach(opt => {
        const row = document.createElement('label')
        row.className = 'checklist-item'
        row.dataset.value = String(opt.value)
        const cb = document.createElement('input')
        cb.type = 'checkbox'
        cb.disabled = disabled
        cb.value = String(opt.value)
        cb.checked = selected.has(cb.value)
        cb.onchange = () => {
          if (cb.checked) selected.add(cb.value)
          else selected.delete(cb.value)
          updateSummary()
          if (typeof onChange === 'function') onChange()
        }
        const t = document.createElement('span')
        t.textContent = opt.label
        row.appendChild(cb)
        row.appendChild(t)
        items.appendChild(row)
      })
      updateSummary()
    }

    function setSelected(values) {
      selected = new Set((values || []).map(v => String(v)))
      items.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = selected.has(String(cb.value)) })
      updateSummary()
    }

    function getSelected() {
      return Array.from(selected.values())
    }

    function setDisabled(nextDisabled) {
      disabled = !!nextDisabled
      items.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.disabled = disabled })
      summary.style.pointerEvents = disabled ? 'none' : ''
      details.style.opacity = disabled ? '0.7' : ''
      if (disabled) details.open = false
    }

    return { wrap, setOptions, setSelected, getSelected, setDisabled }
  }

  const gruposField = createChecklistField('Grupos')
  const cargosInternosWrap = document.createElement('div')
  cargosInternosWrap.className = 'field cargos-internos'
  const cargosInternosLabel = document.createElement('label')
  cargosInternosLabel.textContent = 'Cargos Internos'
  cargosInternosWrap.appendChild(cargosInternosLabel)
  const cargosInternosList = document.createElement('div')
  cargosInternosList.className = 'cargos-internos-list'
  cargosInternosWrap.appendChild(cargosInternosList)
  filtroNomeInput = document.createElement('input')
  filtroNomeInput.type = 'text'
  filtroNomeInput.placeholder = 'Filtrar por nome...'
  filtroNomeInput.oninput = () => refreshList()
  const filtroNomeWrap = document.createElement('div')
  filtroNomeWrap.className = 'field'
  const filtroNomeLabel = document.createElement('label')
  filtroNomeLabel.textContent = 'Nome'
  filtroNomeWrap.appendChild(filtroNomeLabel)
  filtroNomeWrap.appendChild(filtroNomeInput)

  filtroDataNascInput = document.createElement('input')
  filtroDataNascInput.type = 'date'
  filtroDataNascInput.onchange = () => refreshList()
  const filtroDataWrap = document.createElement('div')
  filtroDataWrap.className = 'field'
  const filtroDataLabel = document.createElement('label')
  filtroDataLabel.textContent = 'Data de nascimento'
  filtroDataWrap.appendChild(filtroDataLabel)
  filtroDataWrap.appendChild(filtroDataNascInput)

  filtroGruposField = createChecklistField('Grupo(s)', () => refreshList())
  filtroCargosInternosField = createChecklistField('Cargo(s) interno(s)', () => refreshList())
  filtroMesesField = createChecklistField('Mês de nascimento', () => refreshList())
  filtroMesesField.setOptions([
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ])

  filtersWrap.appendChild(filtroNomeWrap)
  filtersWrap.appendChild(filtroGruposField.wrap)
  filtersWrap.appendChild(filtroCargosInternosField.wrap)
  filtersWrap.appendChild(filtroDataWrap)
  filtersWrap.appendChild(filtroMesesField.wrap)

  const GRUPOS_TABLE = 'grupos'
  const MEMBROS_GRUPO_TABLE = 'membros_grupo'
  const CARGOS_INTERNOS_TABLE = 'cargos_internos'
  const MEMBROS_CARGOS_INTERNOS_TABLE = 'membros_cargos_internos'
  let gruposCache = null
  let gruposIdKey = 'id'
  let gruposLabelKey = 'nome'
  const membrosGrupoMembroKey = 'id_membro'
  const membrosGrupoGrupoKey = 'id_grupo'
  let cargosInternosCache = null
  let cargosInternosIdKey = 'id'
  let cargosInternosLabelKey = 'nome'
  let cargosInternosPorGrupoKey = 'por_grupo'
  let membrosCargosInternosMembroKey = 'id_membro'
  let membrosCargosInternosCargoKey = 'id_cargos_internos'
  let membrosCargosInternosGrupoKey = 'id_grupo'
  const cargosInternosUI = new Map()

  async function ensureGruposLoaded() {
    if (gruposCache) return
    try {
      const data = await apiList(GRUPOS_TABLE)
      gruposCache = Array.isArray(data) ? data : []
      const sample = gruposCache[0] || {}
      gruposIdKey = pickKey(sample, ['id', 'grupo_id', 'codigo'])
      gruposLabelKey = guessLabelKey(sample)
      const opts = gruposCache.map(g => ({ value: g?.[gruposIdKey], label: String(g?.[gruposLabelKey] ?? g?.[gruposIdKey] ?? '') }))
      gruposField.setOptions(opts)
      if (filtroGruposField) filtroGruposField.setOptions(opts)
    } catch {
      gruposCache = []
      gruposField.setOptions([])
      if (filtroGruposField) filtroGruposField.setOptions([])
    }
  }
  ensureGruposLoaded().catch(() => {})

  async function ensureCargosInternosLoaded() {
    if (cargosInternosCache) {
      if (filtroCargosInternosField) {
        const opts = cargosInternosCache.map(c => ({
          value: c?.[cargosInternosIdKey],
          label: String(c?.[cargosInternosLabelKey] ?? c?.[cargosInternosIdKey] ?? '')
        }))
        filtroCargosInternosField.setOptions(opts)
      }
      return
    }
    try {
      await ensureGruposLoaded()
      const data = await apiList(CARGOS_INTERNOS_TABLE)
      cargosInternosCache = Array.isArray(data) ? data : []
      console.log('CargosInternos:load', { count: cargosInternosCache.length, apiMode: API_MODE })
      const sample = cargosInternosCache[0] || {}
      cargosInternosIdKey = pickKey(sample, ['id_cargos_internos', 'id_cargo_interno', 'cargo_interno_id', 'id', 'codigo'])
      cargosInternosLabelKey = guessLabelKey(sample)
      cargosInternosPorGrupoKey = Object.prototype.hasOwnProperty.call(sample, 'por_grupo') ? 'por_grupo' : (Object.prototype.hasOwnProperty.call(sample, 'porGrupo') ? 'porGrupo' : 'por_grupo')
      if (filtroCargosInternosField) {
        const opts = cargosInternosCache.map(c => ({
          value: c?.[cargosInternosIdKey],
          label: String(c?.[cargosInternosLabelKey] ?? c?.[cargosInternosIdKey] ?? '')
        }))
        filtroCargosInternosField.setOptions(opts)
      }
      const groupOptions = gruposCache
        ? gruposCache.map(g => ({ value: g?.[gruposIdKey], label: String(g?.[gruposLabelKey] ?? g?.[gruposIdKey] ?? '') }))
        : []

      cargosInternosList.innerHTML = ''
      cargosInternosUI.clear()
      if (!cargosInternosCache.length) {
        cargosInternosList.textContent = 'Sem cargos internos.'
        return
      }
      cargosInternosCache.forEach(c => {
        const cargoId = String(c?.[cargosInternosIdKey] ?? '')
        const cargoLabel = String(c?.[cargosInternosLabelKey] ?? cargoId)
        const porGrupo = Boolean(c?.[cargosInternosPorGrupoKey])

        const row = document.createElement('div')
        row.className = 'checklist-item'
        const cb = document.createElement('input')
        cb.type = 'checkbox'
        cb.value = cargoId
        const t = document.createElement('span')
        t.textContent = cargoLabel
        row.appendChild(cb)
        row.appendChild(t)

        let gruposPorCargoField = null
        let gruposPorCargoWrap = null
        if (porGrupo) {
          gruposPorCargoField = createChecklistField('Grupos', () => {})
          gruposPorCargoField.setOptions(groupOptions)
          gruposPorCargoWrap = document.createElement('div')
          gruposPorCargoWrap.className = 'cargos-internos-grupos'
          gruposPorCargoWrap.style.display = 'none'
          gruposPorCargoWrap.appendChild(gruposPorCargoField.wrap)
          cb.onchange = () => {
            gruposPorCargoWrap.style.display = cb.checked ? '' : 'none'
            if (!cb.checked) gruposPorCargoField.setSelected([])
          }
        }

        cargosInternosList.appendChild(row)
        if (gruposPorCargoWrap) cargosInternosList.appendChild(gruposPorCargoWrap)
        cargosInternosUI.set(cargoId, { cb, porGrupo, gruposPorCargoField })
      })
    } catch (e) {
      console.log('CargosInternos:load:error', e)
      cargosInternosCache = []
      if (filtroCargosInternosField) filtroCargosInternosField.setOptions([])
      const msg = String(e?.message || e || '')
      if (msg.includes('row-level security policy') && msg.includes('cargos_internos')) {
        cargosInternosList.textContent = 'Sem permissão para listar cargos internos (RLS em "cargos_internos").'
      } else {
        cargosInternosList.textContent = 'Sem cargos internos.'
      }
      cargosInternosUI.clear()
      showStatus(String(e?.message || e), 'error')
    }
  }
  ensureCargosInternosLoaded().catch(() => {})

  async function ensureMembrosCargosInternosKeysLoaded() {
    try {
      const rows = await apiGet(MEMBROS_CARGOS_INTERNOS_TABLE, { select: '*', limit: '1' })
      const sample = (Array.isArray(rows) ? rows : [])[0] || {}
      membrosCargosInternosMembroKey = pickKey(sample, ['id_membro', 'membro_id', 'membros_id', 'idAluno', 'aluno_id'])
      membrosCargosInternosCargoKey = pickKey(sample, ['id_cargos_internos', 'id_cargo_interno', 'cargo_interno_id', 'cargos_internos_id', 'cargo_id'])
      membrosCargosInternosGrupoKey = pickKey(sample, ['id_grupo', 'grupo_id', 'grupos_id', 'grupo'])
    } catch {}
  }

  async function loadSelectedCargosInternosForMember(memberId) {
    await ensureGruposLoaded()
    await ensureCargosInternosLoaded()
    await ensureMembrosCargosInternosKeysLoaded()
    if (!memberId) {
      cargosInternosUI.forEach(ui => {
        ui.cb.checked = false
        if (ui.porGrupo && ui.gruposPorCargoField) ui.gruposPorCargoField.setSelected([])
      })
      return
    }
    const rows = await apiGet(MEMBROS_CARGOS_INTERNOS_TABLE, { select: '*', [membrosCargosInternosMembroKey]: `eq.${memberId}` })
    const byCargo = new Map()
    ;(Array.isArray(rows) ? rows : []).forEach(r => {
      const cid = String(r?.[membrosCargosInternosCargoKey] ?? '')
      const gid = r?.[membrosCargosInternosGrupoKey]
      if (!cid) return
      if (!byCargo.has(cid)) byCargo.set(cid, new Set())
      if (gid !== undefined && gid !== null && String(gid) !== '') byCargo.get(cid).add(String(gid))
    })
    cargosInternosUI.forEach((ui, cid) => {
      const groups = byCargo.get(cid)
      ui.cb.checked = !!groups
      if (ui.porGrupo && ui.gruposPorCargoField) {
        ui.gruposPorCargoField.setSelected(groups ? Array.from(groups.values()) : [])
        const wrap = ui.gruposPorCargoField.wrap.parentElement
        if (wrap) wrap.style.display = ui.cb.checked ? '' : 'none'
      }
    })
  }

  async function saveMemberCargosInternos(memberId) {
    if (!memberId) return
    await ensureMembrosCargosInternosKeysLoaded()
    const memberVal = /^\d+$/.test(String(memberId)) ? Number(memberId) : memberId
    const desired = new Set()
    const desiredRows = []
    cargosInternosUI.forEach((ui, cid) => {
      if (!ui.cb.checked) return
      if (ui.porGrupo && ui.gruposPorCargoField) {
        const groupIds = ui.gruposPorCargoField.getSelected().map(x => String(x)).filter(Boolean)
        groupIds.forEach(gid => {
          const k = `${String(cid)}|${String(gid)}`
          if (desired.has(k)) return
          desired.add(k)
          desiredRows.push({
            [membrosCargosInternosMembroKey]: memberVal,
            [membrosCargosInternosCargoKey]: /^\d+$/.test(String(cid)) ? Number(cid) : cid,
            [membrosCargosInternosGrupoKey]: gid
          })
        })
      } else {
        const k = `${String(cid)}|`
        if (desired.has(k)) return
        desired.add(k)
        desiredRows.push({
          [membrosCargosInternosMembroKey]: memberVal,
          [membrosCargosInternosCargoKey]: /^\d+$/.test(String(cid)) ? Number(cid) : cid,
          [membrosCargosInternosGrupoKey]: null
        })
      }
    })
    const existingRows = await apiGet(MEMBROS_CARGOS_INTERNOS_TABLE, { select: '*', [membrosCargosInternosMembroKey]: `eq.${memberId}` })
    const existing = new Set()
    const existingList = Array.isArray(existingRows) ? existingRows : []
    const filteredExistingList = existingList.some(r => String(r?.[membrosCargosInternosMembroKey] ?? '') && String(r?.[membrosCargosInternosMembroKey] ?? '') !== String(memberId))
      ? existingList.filter(r => String(r?.[membrosCargosInternosMembroKey] ?? '') === String(memberId))
      : existingList
    filteredExistingList.forEach(r => {
      const cid = String(r?.[membrosCargosInternosCargoKey] ?? '')
      const gid = r?.[membrosCargosInternosGrupoKey]
      if (!cid) return
      existing.add(`${cid}|${gid === undefined || gid === null ? '' : String(gid)}`)
    })
    const toAdd = desiredRows.filter(r => {
      const cid = String(r?.[membrosCargosInternosCargoKey] ?? '')
      const gid = r?.[membrosCargosInternosGrupoKey]
      const k = `${cid}|${gid === undefined || gid === null ? '' : String(gid)}`
      return !existing.has(k)
    })
    const toRemove = Array.from(existing.values()).filter(k => !desired.has(k))
    if (toAdd.length) await apiCreate(MEMBROS_CARGOS_INTERNOS_TABLE, toAdd)
    for (const k of toRemove) {
      const idx = k.indexOf('|')
      const cid = idx >= 0 ? k.slice(0, idx) : k
      const gid = idx >= 0 ? k.slice(idx + 1) : ''
      const filters = {
        [membrosCargosInternosMembroKey]: `eq.${memberId}`,
        [membrosCargosInternosCargoKey]: `eq.${cid}`,
        [membrosCargosInternosGrupoKey]: gid ? `eq.${gid}` : 'is.null'
      }
      await apiDeleteWhere(MEMBROS_CARGOS_INTERNOS_TABLE, filters)
    }
  }

  async function loadSelectedGruposForMember(memberId) {
    await ensureGruposLoaded()
    if (!memberId) { gruposField.setSelected([]); return }
    const rows = await apiGet(MEMBROS_GRUPO_TABLE, {
      select: `${membrosGrupoMembroKey},${membrosGrupoGrupoKey}`,
      [membrosGrupoMembroKey]: `eq.${memberId}`
    })
    const list = Array.isArray(rows) ? rows : []
    const filtered = list.some(r => String(r?.[membrosGrupoMembroKey] ?? '') && String(r?.[membrosGrupoMembroKey] ?? '') !== String(memberId))
      ? list.filter(r => String(r?.[membrosGrupoMembroKey] ?? '') === String(memberId))
      : list
    const selected = filtered.map(r => r?.[membrosGrupoGrupoKey]).filter(x => x !== undefined && x !== null && String(x) !== '')
    gruposField.setSelected(selected)
  }

  async function saveMemberGrupos(memberId, selectedGrupoIds) {
    if (!memberId) return
    const ids = (selectedGrupoIds || []).map(x => String(x)).filter(Boolean)
    const desired = new Set(ids)
    const rows = await apiGet(MEMBROS_GRUPO_TABLE, {
      select: `${membrosGrupoMembroKey},${membrosGrupoGrupoKey}`,
      [membrosGrupoMembroKey]: `eq.${memberId}`
    })
    const list = Array.isArray(rows) ? rows : []
    const filtered = list.some(r => String(r?.[membrosGrupoMembroKey] ?? '') && String(r?.[membrosGrupoMembroKey] ?? '') !== String(memberId))
      ? list.filter(r => String(r?.[membrosGrupoMembroKey] ?? '') === String(memberId))
      : list
    const existing = new Set(filtered.map(r => String(r?.[membrosGrupoGrupoKey] ?? '')).filter(Boolean))
    const toAdd = ids.filter(gid => !existing.has(gid))
    const toRemove = Array.from(existing.values()).filter(gid => !desired.has(gid))
    if (toAdd.length) {
      const payload = toAdd.map(grupoId => ({ [membrosGrupoMembroKey]: /^\d+$/.test(String(memberId)) ? Number(memberId) : memberId, [membrosGrupoGrupoKey]: grupoId }))
      await apiCreate(MEMBROS_GRUPO_TABLE, payload)
    }
    for (const gid of toRemove) {
      await apiDeleteWhere(MEMBROS_GRUPO_TABLE, {
        [membrosGrupoMembroKey]: `eq.${memberId}`,
        [membrosGrupoGrupoKey]: `eq.${gid}`
      })
    }
  }

  const form = document.createElement('div')
  table.fields.forEach(f => form.appendChild(renderField(f)))
  const actions = document.createElement('div')
  actions.className = 'actions'
  actions.style.justifyContent = 'flex-end'
  let cadastroEditMode = true
  const actionsTop = document.createElement('div')
  actionsTop.className = 'actions'
  actionsTop.style.justifyContent = 'flex-end'
  const btnAlterarTop = document.createElement('button')
  btnAlterarTop.title = 'Alterar'
  btnAlterarTop.setAttribute('aria-label', 'Alterar')
  btnAlterarTop.className = 'icon-btn'
  setButtonIcon(btnAlterarTop, 'edit')
  const btnAlterar = document.createElement('button')
  btnAlterar.title = 'Alterar'
  btnAlterar.setAttribute('aria-label', 'Alterar')
  btnAlterar.className = 'icon-btn'
  setButtonIcon(btnAlterar, 'edit')
  const btnSalvar = document.createElement('button')
  btnSalvar.title = 'Salvar'
  btnSalvar.setAttribute('aria-label', 'Salvar')
  btnSalvar.className = 'icon-btn'
  setButtonIcon(btnSalvar, 'save')
  function friendlyGruposError(e) {
    const msg = String(e?.message || e || '')
    if (msg.includes('row-level security policy') && msg.includes('membros_grupo')) {
      return 'Sem permissão para salvar grupos (RLS do Supabase em "membros_grupo").'
    }
    return msg
  }
  function friendlyCargosInternosError(e) {
    const msg = String(e?.message || e || '')
    if (msg.includes('row-level security policy') && msg.includes('membros_cargos_internos')) {
      return 'Sem permissão para salvar cargos internos (RLS do Supabase em "membros_cargos_internos").'
    }
    if (msg.includes('Could not find') && msg.includes('membros_cargos_internos')) {
      return 'Falha ao salvar cargos internos (colunas da tabela "membros_cargos_internos" não conferem).'
    }
    if (msg.includes('invalid input syntax for type bigint')) {
      return 'Falha ao salvar cargos internos (id do cargo precisa ser número).'
    }
    return msg
  }
  function friendlySalvarError(e) {
    const msg = String(e?.message || e || '')
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return 'Falha de conexão com o servidor.'
    }
    if (msg.includes('row-level security policy')) {
      return 'Sem permissão para salvar (RLS do Supabase).'
    }
    return msg
  }
  function friendlyUsuariosModulosError(e) {
    const msg = String(e?.message || e || '')
    if (msg.includes('usuarios_modulos') && msg.includes('row-level security policy')) {
      return 'Sem permissão para salvar módulos (RLS do Supabase em "usuarios_modulos").'
    }
    if (msg.includes('usuarios_modulos') && (msg.includes('column') || msg.includes('Could not find'))) {
      return 'Falha ao salvar módulos (colunas de "usuarios_modulos" não conferem com o payload).'
    }
    if (msg.includes('usuarios_modulos') && (msg.includes('violates') || msg.includes('foreign key'))) {
      return 'Falha ao salvar módulos (IDs de usuário/módulo precisam existir).'
    }
    if (msg.includes('invalid input syntax for type bigint')) {
      return 'Falha ao salvar módulos (IDs precisam ser numéricos).'
    }
    return msg
  }

  function setCadastroMode(edit) {
    cadastroEditMode = !!edit
    form.querySelectorAll('input,textarea,select').forEach(i => {
      i.disabled = !cadastroEditMode
    })
    gruposField.setDisabled(!cadastroEditMode)
    cargosInternosUI.forEach(ui => {
      ui.cb.disabled = !cadastroEditMode
      if (ui.porGrupo && ui.gruposPorCargoField && typeof ui.gruposPorCargoField.setDisabled === 'function') {
        ui.gruposPorCargoField.setDisabled(!cadastroEditMode)
      }
    })
    const hasId = !!idInput.value.trim()
    const canAlterar = !cadastroEditMode && hasId
    btnAlterar.disabled = !canAlterar
    btnAlterarTop.disabled = !canAlterar
    btnSalvar.disabled = !cadastroEditMode && hasId
  }

  function handleAlterar() {
    setCadastroMode(true)
    const first = form.querySelector('input:not([type="hidden"]),select,textarea')
    if (first && typeof first.focus === 'function') first.focus()
  }
  btnAlterar.onclick = handleAlterar
  btnAlterarTop.onclick = handleAlterar
  function hasEmptyNumericInputError(e) {
    const msg = String(e?.message || e || '')
    const normalized = msg.replaceAll('\\"', '"')
    return /invalid input syntax for type (?:bigint|integer|smallint):\s*""/.test(normalized)
  }
  function sanitizeEmptyStringsAsNull(payload) {
    const next = {}
    Object.entries(payload || {}).forEach(([k, v]) => {
      next[k] = v === '' ? null : v
    })
    return next
  }
  async function apiCreateMembroWithRetry(payload) {
    try {
      return await apiCreate(table.name, payload)
    } catch (e) {
      if (!hasEmptyNumericInputError(e)) throw e
      return await apiCreate(table.name, sanitizeEmptyStringsAsNull(payload))
    }
  }
  async function apiUpdateMembroWithRetry(id, payload) {
    try {
      return await apiUpdate(table.name, table.pk, id, payload)
    } catch (e) {
      if (!hasEmptyNumericInputError(e)) throw e
      return await apiUpdate(table.name, table.pk, id, sanitizeEmptyStringsAsNull(payload))
    }
  }

  btnSalvar.onclick = async () => {
    if (!cadastroEditMode && idInput.value.trim()) return
    btnSalvar.disabled = true
    showStatus('Salvando...', 'success')
    try { 
      const payload = collectPayload(form)
      const selectedGrupoIds = gruposField.getSelected()
      const warnings = []
      if (!idInput.value.trim()) {
        const res = await apiCreateMembroWithRetry(payload)
        console.log('Cadastro:salvar:create', { payload, res })
        const created = Array.isArray(res) ? res[0] : res
        idInput.value = created?.[table.pk] ?? ''
        try { await saveMemberGrupos(idInput.value.trim(), selectedGrupoIds) }
        catch (e) { console.log('Cadastro:salvar:grupos:error', e); warnings.push(friendlyGruposError(e)) }
        try { await saveMemberCargosInternos(idInput.value.trim()) }
        catch (e) { console.log('Cadastro:salvar:cargos_internos:error', e); warnings.push(friendlyCargosInternosError(e)) }
        showStatus(warnings.length ? `Membro criado (${warnings.join(' | ')})` : 'Membro criado', 'success')
      } else {
        const id = idInput.value.trim()
        const res = await apiUpdateMembroWithRetry(id, payload) 
        console.log('Cadastro:salvar:update', { id, payload, res })
        try { await saveMemberGrupos(id, selectedGrupoIds) }
        catch (e) { console.log('Cadastro:salvar:grupos:error', e); warnings.push(friendlyGruposError(e)) }
        try { await saveMemberCargosInternos(id) }
        catch (e) { console.log('Cadastro:salvar:cargos_internos:error', e); warnings.push(friendlyCargosInternosError(e)) }
        showStatus(warnings.length ? `Alterações salvas (${warnings.join(' | ')})` : 'Alterações salvas', 'success')
      }
      listWrap.innerHTML = ''
      setActiveConsulta()
    } catch (e) { console.log('Cadastro:salvar:error', e); showStatus(friendlySalvarError(e), 'error') }
    finally { setCadastroMode(cadastroEditMode) }
  }

  async function fillCadastro(item) {
    idInput.value = item?.[table.pk] ?? ''
    form.querySelectorAll('input,textarea,select').forEach(i => {
      const k = i.dataset.key
      const v = item?.[k]
      if (i.type === 'checkbox') i.checked = !!v
      else if (i.tagName === 'SELECT') { i.dataset.initialValue = String(v ?? ''); i.value = v ?? '' }
      else i.value = v ?? ''
    })
    try {
      await loadSelectedGruposForMember(idInput.value.trim())
      await loadSelectedCargosInternosForMember(idInput.value.trim())
    } catch (e) {
      showStatus(String(e?.message || e), 'error')
    }
    setCadastroMode(false)
  }

  actions.appendChild(btnAlterar)
  actions.appendChild(btnSalvar)

  cardCad.appendChild(hCad)
  actionsTop.appendChild(btnAlterarTop)
  cardCad.appendChild(actionsTop)
  cardCad.appendChild(form)
  cardCad.appendChild(gruposField.wrap)
  cardCad.appendChild(cargosInternosWrap)
  cardCad.appendChild(actions)
  panelCadastro.appendChild(cardCad)

  screens.appendChild(panelConsulta)
  screens.appendChild(panelCadastro)

  function setActiveConsulta() {
    btnConsulta.classList.add('active'); btnCadastro.classList.remove('active')
    panelConsulta.style.display = ''; panelCadastro.style.display = 'none'
    const restoreY = shouldRestoreConsultaScroll ? lastConsultaScrollY : null
    shouldRestoreConsultaScroll = false
    const p = refreshList()
    if (restoreY !== null) {
      Promise.resolve(p).then(() => restoreScrollY(restoreY)).catch(() => {})
    }
    __pushRoute({ page: 'tab', tab: 'membros', view: 'consulta' }, true)
  }
  function clearCadastro() {
    idInput.value = ''
    form.querySelectorAll('input,textarea,select').forEach(i => {
      if (i.type === 'checkbox') i.checked = false
      else if (i.tagName === 'SELECT') { i.dataset.initialValue = ''; i.value = '' }
      else i.value = ''
    })
    gruposField.setSelected([])
    cargosInternosUI.forEach(ui => {
      ui.cb.checked = false
      if (ui.gruposPorCargoField) ui.gruposPorCargoField.setSelected([])
      if (typeof ui.cb.onchange === 'function') ui.cb.onchange()
    })
  }
  function setActiveCadastro(opts) {
    btnCadastro.classList.add('active'); btnConsulta.classList.remove('active')
    panelCadastro.style.display = ''; panelConsulta.style.display = 'none'
    if (!opts || !opts.keep) {
      clearCadastro()
      setCadastroMode(true)
    }
    const rid = String(opts?.id ?? idInput.value ?? '').trim()
    __pushRoute(rid ? { page: 'tab', tab: 'membros', view: 'cadastro', id: rid } : { page: 'tab', tab: 'membros', view: 'cadastro' }, false)
    if (opts?.scrollTop) {
      try { screens.scrollTop = 0 } catch {}
      try { screens.scrollTo(0, 0) } catch {}
      try { panelCadastro.scrollTop = 0 } catch {}
      try { cardCad.scrollIntoView({ block: 'start', behavior: 'auto' }) } catch {}
      try { (document.scrollingElement || document.documentElement || document.body).scrollTop = 0 } catch {}
      try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }) } catch { try { window.scrollTo(0, 0) } catch {} }
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const first =
          panelCadastro.querySelector('input:not([type="hidden"]):not([readonly]):not([disabled]),select:not([disabled]),textarea:not([readonly]):not([disabled])') ||
          panelCadastro.querySelector('input:not([type="hidden"]),select,textarea')
        if (!first) return
        try { first.focus({ preventScroll: true }) } catch { try { first.focus() } catch {} }
      })
    })
  }
  btnConsulta.onclick = setActiveConsulta
  btnCadastro.onclick = () => { saveConsultaScrollPosition(); setActiveCadastro() }
  window.__igrejaRouteMembers = {
    apply: async (r) => {
      const view = String(r?.view ?? '').trim()
      if (view === 'cadastro') {
        const id = String(r?.id ?? '').trim()
        if (id) {
          try {
            const rows = await apiGet(table.name, { select: '*', [table.pk]: `eq.${id}` })
            const row = Array.isArray(rows) ? rows[0] : null
            if (row) await fillCadastro(row)
          } catch {}
          setActiveCadastro({ keep: true, id, scrollTop: true })
          return
        }
        setActiveCadastro()
        return
      }
      setActiveConsulta()
    }
  }
  setActiveConsulta()
}

function renderLoginScreen(schema, table) {
  const screens = el('screens')
  clear(screens)
  const status = document.createElement('div')
  status.className = 'status'
  screens.appendChild(status)
  let statusTimer = null
  function showStatus(text, type) {
    status.textContent = text
    status.classList.remove('success', 'error')
    if (type === 'success') status.classList.add('success')
    if (type === 'error') status.classList.add('error')
    status.style.display = 'block'
    if (statusTimer) clearTimeout(statusTimer)
    if (type !== 'error') statusTimer = setTimeout(() => { status.style.display = 'none' }, 2500)
  }

  async function refreshAfterAuth() {
    renderTabs(schemaCache)
    navigateHome({ replace: true })
  }

  async function doLogin(login, password) {
    const LOGIN_KEYS = ['usuario', 'login', 'username', 'user', 'email']
    const PASS_KEYS = ['senha_hash', 'senha', 'password', 'pass', 'pwd', 'hash']
    let loginKey = ''
    let row = null
    for (const k of LOGIN_KEYS) {
      try {
        const rows = await apiGet('usuarios', { select: '*', [k]: `eq.${login}` })
        if (Array.isArray(rows) && rows.length) {
          if (rows.length > 1) throw new Error('Login duplicado. Entre em contato com o administrador.')
          loginKey = k
          row = rows[0]
          break
        }
      } catch (e) {
        const msg = String(e?.message || e || '')
        if (msg.includes('Could not find') || msg.includes('column') || msg.includes('unknown')) continue
        throw e
      }
    }
    if (!row) throw new Error('Usuário não encontrado.')

    const pkKey = firstExistingKey(row, ['id', 'usuario_id', 'usuarios_id']) || 'id'
    const passKey = firstExistingKey(row, PASS_KEYS)
    const userId = String(row?.[pkKey] ?? '').trim()
    let storedPass = passKey ? String(row?.[passKey] ?? '').trim() : ''
    if (!userId) throw new Error('ID do usuário não encontrado.')
    if (!storedPass) {
      if (String(password ?? '') !== '') throw new Error('Senha não configurada. Entre com a senha em branco para cadastrar uma nova senha.')
      const newPass = await changePasswordModal()
      if (!newPass) throw new Error('É necessário definir uma nova senha.')
      const newHash = await hashPasswordPbkdf2(newPass)
      const payloads = []
      payloads.push({ [passKey || 'senha']: newHash })
      PASS_KEYS.forEach(pk => payloads.push({ [pk]: newHash }))
      let updated = false
      let noRows = false
      for (const p of payloads) {
        try {
          await apiUpdate('usuarios', pkKey, userId, p)
          updated = true
          break
        } catch (e) {
          const msg = String(e?.message || e || '')
          if (msg.includes('0 rows affected')) { noRows = true; break }
          if (msg.includes('Could not find') || msg.includes('column') || msg.includes('unknown')) continue
          throw e
        }
      }
      if (!updated) {
        if (noRows) throw new Error('Não foi possível salvar a nova senha (sem permissão/RLS no ambiente).')
        throw new Error('Não foi possível cadastrar a nova senha.')
      }
      storedPass = newHash
    } else {
      const ok = await verifyPassword(password, storedPass)
      if (!ok) throw new Error('Senha inválida.')

      const isDefault = await verifyPassword(DEFAULT_PASSWORD, storedPass)
      if (isDefault) {
        const newPass = await changePasswordModal()
        if (!newPass) throw new Error('Senha padrão: é necessário definir uma nova senha.')
        const newHash = await hashPasswordPbkdf2(newPass)
        const payloads = []
        payloads.push({ [passKey || 'senha']: newHash })
        PASS_KEYS.forEach(pk => payloads.push({ [pk]: newHash }))
        let updated = false
        let noRows = false
        for (const p of payloads) {
          try {
            await apiUpdate('usuarios', pkKey, userId, p)
            updated = true
            break
          } catch (e) {
            const msg = String(e?.message || e || '')
            if (msg.includes('0 rows affected')) { noRows = true; break }
            if (msg.includes('Could not find') || msg.includes('column') || msg.includes('unknown')) continue
            throw e
          }
        }
        if (!updated) {
          if (noRows) throw new Error('Não foi possível salvar a nova senha (sem permissão/RLS no ambiente).')
          throw new Error('Não foi possível atualizar a senha do usuário.')
        }
        storedPass = newHash
      }
    }

    const MEMBRO_KEYS = ['id_membro', 'membro_id', 'membros_id', 'idMembro', 'membro']
    const MOD_LINK_USER_KEYS = ['id_membro', ...MEMBRO_KEYS, 'id_usuario', 'usuario_id', 'usuarios_id', 'idUser', 'user_id', 'usuario']
    const MOD_LINK_MOD_KEYS = ['id_modulo', 'modulo_id', 'modulos_id', 'idModule', 'module_id', 'modulo']
    let usuarioModulos = []
    const membroId = String(firstExistingValue(row, MEMBRO_KEYS) ?? '').trim()
    if (membroId) {
      try {
        const rows = await apiGet('usuarios_modulos', { select: '*', id_membro: `eq.${membroId}` })
        usuarioModulos = Array.isArray(rows) ? rows : []
      } catch (e) {
        const msg = String(e?.message || e || '')
        if (!(msg.includes('Could not find') || msg.includes('column') || msg.includes('unknown'))) throw e
      }
    }
    if (!usuarioModulos.length) {
      for (const uk of MOD_LINK_USER_KEYS) {
        try {
          const rows = await apiGet('usuarios_modulos', { select: '*', [uk]: `eq.${userId}` })
          usuarioModulos = Array.isArray(rows) ? rows : []
          break
        } catch (e) {
          const msg = String(e?.message || e || '')
          if (msg.includes('Could not find') || msg.includes('column') || msg.includes('unknown')) continue
          throw e
        }
      }
    }

    let modulos = []
    let modulosIdKey = 'id'
    const MOD_CODE_KEYS = ['codigo', 'tela', 'slug', 'nome', 'modulo']
    try {
      const rows = await apiList('modulos')
      modulos = Array.isArray(rows) ? rows : []
      modulosIdKey = firstExistingKey(modulos[0] || {}, ['id', 'modulo_id', 'codigo']) || 'id'
    } catch {}

    const allowedNorm = new Set()
    usuarioModulos.forEach(um => {
      const midVal = firstExistingValue(um, MOD_LINK_MOD_KEYS)
      const mid = midVal === null ? '' : String(midVal).trim()
      if (!mid) return
      let m = modulos.find(x => String(x?.[modulosIdKey] ?? '').trim() === mid)
      if (!m) {
        const midNorm = normalizeText(mid)
        m = modulos.find(x => MOD_CODE_KEYS.some(k => normalizeText(String(x?.[k] ?? '')) === midNorm))
      }
      if (m) {
        MOD_CODE_KEYS.forEach(k => {
          const v = m?.[k]
          if (typeof v === 'string' && v.trim()) allowedNorm.add(normalizeText(v))
        })
        const anyStrKey = Object.keys(m || {}).find(k => typeof m?.[k] === 'string' && String(m?.[k] ?? '').trim())
        if (anyStrKey) allowedNorm.add(normalizeText(String(m?.[anyStrKey] ?? '')))
      } else {
        allowedNorm.add(normalizeText(mid))
      }
    })

    authState.userId = userId
    authState.usuario = String(row?.[loginKey] ?? login ?? '').trim()
    authState.allowedNorm = allowedNorm
    saveAuth()
    await refreshAfterAuth()
    try { setMenuCollapsed(false) } catch {}
    await maybePromptEnablePushAfterLogin(row, userId, showStatus)
    showStatus('Logado.', 'success')
  }

  const card = document.createElement('section')
  card.className = 'card'
  const h = document.createElement('h2')
  h.textContent = 'Login'
  card.appendChild(h)

  if (authState.userId) {
    const info = document.createElement('div')
    info.className = 'field'
    const label = document.createElement('label')
    label.textContent = 'Usuário Logado'
    const v = document.createElement('div')
    v.textContent = authState.usuario || authState.userId
    info.appendChild(label)
    info.appendChild(v)
    const actions = document.createElement('div')
    actions.className = 'actions'
    const btnEnablePush = document.createElement('button')
    btnEnablePush.type = 'button'
    btnEnablePush.className = 'btn-secondary'
    btnEnablePush.textContent = 'Ativar Notificações'
    btnEnablePush.style.display = 'none'
    btnEnablePush.onclick = async () => {
      btnEnablePush.disabled = true
      try {
        await pushEnableForUser(authState.userId)
        showStatus('Notificações ativadas.', 'success')
        btnEnablePush.style.display = 'none'
      } catch (e) {
        showStatus(String(e?.message || e || 'Falha ao ativar notificações.'), 'error')
      } finally {
        btnEnablePush.disabled = false
      }
    }
    const btnLogout = document.createElement('button')
    btnLogout.type = 'button'
    btnLogout.className = 'danger'
    btnLogout.textContent = 'Sair'
    btnLogout.onclick = async () => {
      clearAuth()
      renderTabs(schemaCache)
      activateTab('login')
    }
    actions.appendChild(btnEnablePush)
    actions.appendChild(btnLogout)
    card.appendChild(info)
    card.appendChild(actions)
    screens.appendChild(card)

    ;(async () => {
      try {
        const id = String(authState.userId || '').trim()
        if (!id) return
        let row = null
        const keys = ['id', 'usuario_id', 'usuarios_id']
        for (const k of keys) {
          try {
            const rows = await apiGet('usuarios', { select: '*', [k]: `eq.${id}` })
            if (Array.isArray(rows) && rows.length) { row = rows[0]; break }
          } catch (e) {
            const msg = String(e?.message || e || '')
            if (msg.includes('Could not find') || msg.includes('column') || msg.includes('unknown')) continue
            throw e
          }
        }
        if (!row) return
        const receives = isTruthyDb(firstExistingValue(row, ['recebe_notificacoes', 'recebeNotificacoes', 'receber_notificacoes', 'notificacoes']))
        if (!receives) return
        const has = await pushHasSubscriptionForUser(id)
        if (has) return
        btnEnablePush.style.display = ''
      } catch {}
    })()

    return
  }

  const form = document.createElement('div')
  const fUser = document.createElement('div')
  fUser.className = 'field'
  const lUser = document.createElement('label')
  lUser.textContent = 'Usuário'
  const iUser = document.createElement('input')
  iUser.type = 'text'
  iUser.autocomplete = 'username'
  iUser.style.textTransform = 'uppercase'
  iUser.setAttribute('autocapitalize', 'characters')
  iUser.setAttribute('autocorrect', 'off')
  iUser.spellcheck = false
  iUser.addEventListener('input', (e) => {
    const t = e.target
    const v = String(t.value || '').toUpperCase()
    if (t.value !== v) t.value = v
  })
  fUser.appendChild(lUser)
  fUser.appendChild(iUser)

  const fPass = document.createElement('div')
  fPass.className = 'field'
  const lPass = document.createElement('label')
  lPass.textContent = 'Senha'
  const iPass = document.createElement('input')
  iPass.type = 'password'
  iPass.autocomplete = 'off'
  iPass.setAttribute('autocapitalize', 'none')
  iPass.setAttribute('autocorrect', 'off')
  iPass.spellcheck = false
  iPass.readOnly = true
  iPass.onfocus = () => { iPass.readOnly = false }
  const passWrap = document.createElement('div')
  passWrap.className = 'input-with-icon'
  const btnEye = document.createElement('button')
  btnEye.type = 'button'
  btnEye.className = 'eye-btn'
  btnEye.setAttribute('aria-label', 'Mostrar senha')
  setButtonIcon(btnEye, 'eye')
  let passVisible = false
  function setVisible(v) {
    passVisible = !!v
    iPass.type = passVisible ? 'text' : 'password'
    setButtonIcon(btnEye, passVisible ? 'eyeOff' : 'eye')
    btnEye.setAttribute('aria-label', passVisible ? 'Ocultar senha' : 'Mostrar senha')
  }
  btnEye.onclick = () => setVisible(!passVisible)
  passWrap.appendChild(iPass)
  passWrap.appendChild(btnEye)
  fPass.appendChild(lPass)
  fPass.appendChild(passWrap)

  form.appendChild(fUser)
  form.appendChild(fPass)
  card.appendChild(form)

  const actions = document.createElement('div')
  actions.className = 'actions'
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.textContent = 'Entrar'
  btn.onclick = async () => {
    const login = String(iUser.value ?? '').trim().toUpperCase()
    const pass = String(iPass.value ?? '')
    if (!login) { showStatus('Informe o usuário.', 'error'); return }
    btn.disabled = true
    showStatus('Validando...', 'success')
    try {
      await doLogin(login, pass)
    } catch (e) {
      showStatus(String(e?.message || e), 'error')
    } finally {
      btn.disabled = false
    }
  }
  actions.appendChild(btn)
  card.appendChild(actions)
  screens.appendChild(card)
  requestAnimationFrame(() => { try { iPass.value = '' } catch {} })
}

function renderUsuariosScreen(schema, table) {
  const screens = el('screens')
  clear(screens)
  const status = document.createElement('div')
  status.className = 'status'
  screens.appendChild(status)
  let statusTimer = null
  function showStatus(text, type) {
    status.textContent = text
    status.classList.remove('success', 'error')
    if (type === 'success') status.classList.add('success')
    if (type === 'error') status.classList.add('error')
    status.style.display = 'block'
    if (statusTimer) clearTimeout(statusTimer)
    if (type !== 'error') statusTimer = setTimeout(() => { status.style.display = 'none' }, 2500)
  }

  const subtabs = document.createElement('div')
  subtabs.className = 'subtabs'
  const btnLista = document.createElement('button')
  btnLista.className = 'subtab active'
  btnLista.textContent = 'Lista'
  const btnCadastro = document.createElement('button')
  btnCadastro.className = 'subtab'
  btnCadastro.textContent = 'Cadastro'
  subtabs.appendChild(btnLista)
  subtabs.appendChild(btnCadastro)
  screens.appendChild(subtabs)

  const panelLista = document.createElement('div')
  const panelCadastro = document.createElement('div')
  panelCadastro.style.display = 'none'
  screens.appendChild(panelLista)
  screens.appendChild(panelCadastro)

  const USERS_TABLE = 'usuarios'
  const MODULOS_TABLE = 'modulos'
  const USERS_MODS_TABLE = 'usuarios_modulos'
  const USERS_MEMBERS_TABLE = 'usuarios_membros'

  const MEMBRO_KEYS = ['id_membro', 'membro_id', 'membros_id', 'idMembro', 'membro']
  const LOGIN_KEYS = ['usuario', 'login', 'username', 'user', 'email']
  const PASS_KEYS = ['senha_hash', 'senha', 'password', 'pass', 'pwd', 'hash']
  const USERS_MODS_USER_KEYS = ['id_membro', ...MEMBRO_KEYS]
  const USERS_MODS_MOD_KEYS = ['id_modulo', 'modulo_id', 'modulos_id', 'module_id', 'idModule', 'moduleId', 'modulo']
  const USERS_MEMBERS_USER_KEYS = ['id_usuario', 'usuario_id', 'usuarios_id', 'user_id', 'idUser', 'userId', 'usuario']
  const USERS_MEMBERS_MEMBRO_KEYS = ['id_membro', 'membro_id', 'membros_id', 'member_id', 'idMembro', 'idMember', 'membro']

  let usuariosPkKey = table.pk || 'id'
  let usuariosMembroKey = 'id_membro'
  let usuariosLoginKey = 'usuario'
  let usuariosPassKey = 'senha'
  let usuariosModsUserKey = 'id_membro'
  let usuariosModsModKey = 'id_modulo'
  let modulosIdKey = 'id'
  let modulosLabelKey = 'nome'

  const membrosById = new Map()
  let modulosCache = []

  async function detectLinkKeys(tableName, userKeyCandidates, otherKeyCandidates) {
    for (const uk of userKeyCandidates) {
      for (const ok of otherKeyCandidates) {
        try {
          await apiGet(tableName, { select: `${uk},${ok}`, limit: 1 })
          return { userKey: uk, otherKey: ok }
        } catch (e) {
          const msg = String(e?.message || e || '')
          if (msg.includes('PGRST204') || msg.includes('Could not find') || msg.includes('column')) continue
        }
      }
    }
    return null
  }

  async function ensureUsuariosModulosKeys() {
    if (String(usuariosModsUserKey || '').trim() && String(usuariosModsModKey || '').trim()) return
    const found = await detectLinkKeys(USERS_MODS_TABLE, USERS_MODS_USER_KEYS, USERS_MODS_MOD_KEYS)
    if (found) {
      usuariosModsUserKey = found.userKey
      usuariosModsModKey = found.otherKey
    }
  }

  function usernameFromNome(nome) {
    const parts = String(nome ?? '').trim().split(/\s+/).filter(Boolean)
    if (!parts.length) return ''
    const first = normalizeText(parts[0]).toUpperCase()
    const last = normalizeText(parts.length > 1 ? parts[parts.length - 1] : parts[0]).toUpperCase()
    if (!first) return ''
    if (!last || last === first) return first
    return `${first}.${last}`
  }

  function createChecklistField(labelText) {
    const wrap = document.createElement('div')
    wrap.className = 'field'
    const label = document.createElement('label')
    label.textContent = labelText
    const details = document.createElement('details')
    details.className = 'checklist'
    const summary = document.createElement('summary')
    summary.textContent = 'Selecionar...'
    const items = document.createElement('div')
    items.className = 'checklist-items'
    details.appendChild(summary)
    details.appendChild(items)
    wrap.appendChild(label)
    wrap.appendChild(details)
    const state = { selected: new Set(), items, summary }
    function setOptions(options) {
      items.innerHTML = ''
      options.forEach(opt => {
        const row = document.createElement('label')
        row.className = 'checklist-item'
        row.dataset.value = String(opt.value)
        const cb = document.createElement('input')
        cb.type = 'checkbox'
        cb.checked = state.selected.has(String(opt.value))
        cb.onchange = () => {
          const v = String(opt.value)
          if (cb.checked) state.selected.add(v)
          else state.selected.delete(v)
          summary.textContent = state.selected.size ? `${state.selected.size} selecionado(s)` : 'Selecionar...'
        }
        const t = document.createElement('span')
        t.textContent = opt.label
        row.appendChild(cb)
        row.appendChild(t)
        items.appendChild(row)
      })
      summary.textContent = state.selected.size ? `${state.selected.size} selecionado(s)` : 'Selecionar...'
    }
    function setSelected(values) {
      state.selected = new Set((values || []).map(x => String(x)))
      Array.from(items.querySelectorAll('input[type="checkbox"]')).forEach(cb => {
        const labelEl = cb.parentElement
        const textEl = labelEl?.querySelector('span')
        const label = String(textEl?.textContent ?? '')
        cb.checked = state.selected.has(String(labelEl?.dataset?.value || ''))
      })
      summary.textContent = state.selected.size ? `${state.selected.size} selecionado(s)` : 'Selecionar...'
    }
    function getSelected() { return Array.from(state.selected) }
    return { wrap, setOptions, setSelected, getSelected, state }
  }

  const cardList = document.createElement('section')
  cardList.className = 'card'
  const hList = document.createElement('h2')
  hList.textContent = 'Usuários'
  const listWrap = document.createElement('div')
  cardList.appendChild(hList)
  cardList.appendChild(listWrap)
  panelLista.appendChild(cardList)

  const cardCad = document.createElement('section')
  cardCad.className = 'card'
  const hCad = document.createElement('h2')
  hCad.textContent = 'Cadastro de Usuário'
  cardCad.appendChild(hCad)
  const idWrap = document.createElement('div')
  idWrap.className = 'field'
  const idLabel = document.createElement('label')
  idLabel.textContent = 'ID'
  const idInput = document.createElement('input')
  idInput.type = 'text'
  idInput.readOnly = true
  idWrap.appendChild(idLabel)
  idWrap.appendChild(idInput)

  const fMembro = document.createElement('div')
  fMembro.className = 'field'
  const lMembro = document.createElement('label')
  lMembro.textContent = 'Membro'
  const sMembro = document.createElement('select')
  fMembro.appendChild(lMembro)
  fMembro.appendChild(sMembro)
  cardCad.appendChild(fMembro)

  const fUsuario = document.createElement('div')
  fUsuario.className = 'field'
  const lUsuario = document.createElement('label')
  lUsuario.textContent = 'Usuário'
  const iUsuario = document.createElement('input')
  iUsuario.type = 'text'
  iUsuario.style.textTransform = 'uppercase'
  iUsuario.setAttribute('autocapitalize', 'characters')
  iUsuario.setAttribute('autocorrect', 'off')
  iUsuario.spellcheck = false
  iUsuario.addEventListener('input', (e) => {
    const t = e.target
    const v = String(t.value || '').toUpperCase()
    if (t.value !== v) t.value = v
  })
  fUsuario.appendChild(lUsuario)
  fUsuario.appendChild(iUsuario)
  cardCad.appendChild(fUsuario)

  const fRecebeNotificacoes = document.createElement('div')
  fRecebeNotificacoes.className = 'field'
  const lRecebeNotificacoes = document.createElement('label')
  lRecebeNotificacoes.textContent = 'Receber Notificações'
  const iRecebeNotificacoes = document.createElement('input')
  iRecebeNotificacoes.type = 'checkbox'
  iRecebeNotificacoes.dataset.key = 'recebe_notificacoes'
  fRecebeNotificacoes.appendChild(lRecebeNotificacoes)
  fRecebeNotificacoes.appendChild(iRecebeNotificacoes)
  cardCad.appendChild(fRecebeNotificacoes)

  const modsField = createChecklistField('Módulos')
  cardCad.appendChild(modsField.wrap)

  const actions = document.createElement('div')
  actions.className = 'actions'
  actions.style.justifyContent = 'flex-end'
  let cadastroEditMode = true
  const btnAlterar = document.createElement('button')
  btnAlterar.type = 'button'
  btnAlterar.title = 'Alterar'
  btnAlterar.setAttribute('aria-label', 'Alterar')
  btnAlterar.className = 'icon-btn'
  setButtonIcon(btnAlterar, 'edit')
  const btnSalvar = document.createElement('button')
  btnSalvar.type = 'button'
  btnSalvar.title = 'Salvar'
  btnSalvar.setAttribute('aria-label', 'Salvar')
  btnSalvar.className = 'icon-btn'
  setButtonIcon(btnSalvar, 'save')
  actions.appendChild(btnAlterar)
  actions.appendChild(btnSalvar)
  cardCad.appendChild(actions)
  panelCadastro.appendChild(cardCad)

  function setCadastroMode(edit) {
    cadastroEditMode = !!edit
    const hasId = !!String(idInput.value ?? '').trim()
    const disabled = !cadastroEditMode && hasId
    sMembro.disabled = disabled
    iUsuario.disabled = disabled
    iRecebeNotificacoes.disabled = disabled
    modsField.wrap.querySelectorAll('button,input,select,textarea').forEach(el => {
      el.disabled = disabled
    })
    btnAlterar.disabled = !disabled
    btnSalvar.disabled = disabled
  }
  btnAlterar.onclick = () => {
    setCadastroMode(true)
    const first = panelCadastro.querySelector('input:not([type="hidden"]),select,textarea')
    if (first && typeof first.focus === 'function') first.focus()
  }

  function setActiveLista() {
    btnLista.classList.add('active')
    btnCadastro.classList.remove('active')
    panelLista.style.display = ''
    panelCadastro.style.display = 'none'
    refreshList().catch(e => showStatus(String(e?.message || e), 'error'))
  }
  function setActiveCadastro(opts) {
    btnCadastro.classList.add('active')
    btnLista.classList.remove('active')
    panelCadastro.style.display = ''
    panelLista.style.display = 'none'
    if (!opts || !opts.keep) {
      idInput.value = ''
      sMembro.value = ''
      iUsuario.value = ''
      iRecebeNotificacoes.checked = false
      modsField.state.selected = new Set()
      modsField.setOptions(modulosCache.map(m => ({ value: String(m?.[modulosIdKey] ?? ''), label: String(m?.[modulosLabelKey] ?? m?.[modulosIdKey] ?? '') })).filter(x => x.value))
      setCadastroMode(true)
    }
  }
  btnLista.onclick = setActiveLista
  btnCadastro.onclick = () => setActiveCadastro()

  sMembro.onchange = () => {
    const mid = String(sMembro.value ?? '').trim()
    const nome = membrosById.get(mid) || ''
    iUsuario.value = usernameFromNome(nome)
  }

  async function loadUserModuleIds(membroId) {
    await ensureUsuariosModulosKeys()
    for (const uk of [usuariosModsUserKey, ...USERS_MODS_USER_KEYS].filter(Boolean)) {
      try {
        const rows = await apiGet(USERS_MODS_TABLE, { select: usuariosModsModKey ? `${usuariosModsModKey}` : '*', [uk]: `eq.${membroId}` })
        const list = Array.isArray(rows) ? rows : []
        if (uk) usuariosModsUserKey = uk
        list.forEach(r => {
          const mk = firstExistingKey(r, USERS_MODS_MOD_KEYS)
          if (mk) usuariosModsModKey = mk
        })
        return list.map(r => firstExistingValue(r, USERS_MODS_MOD_KEYS)).filter(v => v !== null && v !== undefined).map(v => String(v).trim()).filter(Boolean)
      } catch (e) {
        const msg = String(e?.message || e || '')
        if (msg.includes('Could not find') || msg.includes('column') || msg.includes('unknown')) continue
        throw e
      }
    }
    return []
  }

  async function fillCadastro(userRow) {
    try {
      const id = String(userRow?.[usuariosPkKey] ?? userRow?.id ?? '').trim()
      idInput.value = id
      const membroVal = firstExistingValue(userRow, MEMBRO_KEYS)
      if (membroVal !== null && membroVal !== undefined) {
        const mv = String(membroVal).trim()
        if (mv) {
          const mk = firstExistingKey(userRow, MEMBRO_KEYS)
          if (mk) usuariosMembroKey = mk
          sMembro.value = mv
        }
      }
      const lk = firstExistingKey(userRow, LOGIN_KEYS)
      if (lk) usuariosLoginKey = lk
      iUsuario.value = String(userRow?.[usuariosLoginKey] ?? '').trim().toUpperCase()
      const rn = userRow?.recebe_notificacoes
      iRecebeNotificacoes.checked = rn === true || rn === 1 || rn === '1' || String(rn ?? '').trim().toLowerCase() === 'true'
      const pk = firstExistingKey(userRow, PASS_KEYS)
      if (pk) usuariosPassKey = pk
      const mid = String(sMembro.value ?? '').trim()
      const selected = mid ? await loadUserModuleIds(mid) : []
      modsField.state.selected = new Set(selected)
      const opts = modulosCache.map(m => ({ value: String(m?.[modulosIdKey] ?? ''), label: String(m?.[modulosLabelKey] ?? m?.[modulosIdKey] ?? '') })).filter(x => x.value)
      modsField.setOptions(opts)
    } catch (e) {
      showStatus(String(e?.message || e), 'error')
    } finally {
      setActiveCadastro({ keep: true })
      setCadastroMode(false)
    }
  }

  async function refreshList() {
    listWrap.innerHTML = ''
    showStatus('Carregando...', 'success')

    const membrosRows = await apiGet('membros', { select: 'id,nome' })
    const membros = (Array.isArray(membrosRows) ? membrosRows : [])
      .map(r => ({ id: String(r?.id ?? '').trim(), nome: String(r?.nome ?? '').trim() }))
      .filter(x => x.id && x.nome)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))

    membrosById.clear()
    sMembro.innerHTML = ''
    const opt0 = document.createElement('option')
    opt0.value = ''
    opt0.textContent = ''
    sMembro.appendChild(opt0)
    membros.forEach(m => {
      membrosById.set(m.id, m.nome)
      const opt = document.createElement('option')
      opt.value = m.id
      opt.textContent = m.nome
      sMembro.appendChild(opt)
    })

    try {
      const mods = await apiList(MODULOS_TABLE)
      modulosCache = Array.isArray(mods) ? mods : []
      const sample = modulosCache[0] || {}
      modulosIdKey = firstExistingKey(sample, ['id', 'modulo_id', 'codigo']) || 'id'
      modulosLabelKey = Object.keys(sample || {}).find(k => typeof sample?.[k] === 'string' && String(sample?.[k] ?? '').trim()) || 'nome'
    } catch (e) {
      modulosCache = []
      showStatus(String(e?.message || e), 'error')
    }
    await ensureUsuariosModulosKeys()
    modsField.state.selected = modsField.state.selected || new Set()
    modsField.setOptions(modulosCache.map(m => ({ value: String(m?.[modulosIdKey] ?? ''), label: String(m?.[modulosLabelKey] ?? m?.[modulosIdKey] ?? '') })).filter(x => x.value))

    let users = []
    try {
      const rows = await apiList(USERS_TABLE)
      users = Array.isArray(rows) ? rows : []
      const sample = users[0] || {}
      usuariosPkKey = firstExistingKey(sample, [usuariosPkKey, 'id', 'usuario_id']) || usuariosPkKey
      usuariosMembroKey = firstExistingKey(sample, MEMBRO_KEYS) || usuariosMembroKey
      usuariosLoginKey = firstExistingKey(sample, LOGIN_KEYS) || usuariosLoginKey
      usuariosPassKey = firstExistingKey(sample, PASS_KEYS) || usuariosPassKey
    } catch (e) {
      users = []
      showStatus(String(e?.message || e), 'error')
    }

    users = users.slice().sort((a, b) => {
      const la = String(a?.[usuariosLoginKey] ?? '').trim()
      const lb = String(b?.[usuariosLoginKey] ?? '').trim()
      if (!la && !lb) return 0
      if (!la) return 1
      if (!lb) return -1
      return la.localeCompare(lb, 'pt-BR', { sensitivity: 'base' })
    })

    users.forEach(u => {
      const div = document.createElement('div')
      div.className = 'list-item'
      const main = document.createElement('div')
      main.className = 'list-main'
      const title = document.createElement('div')
      title.className = 'title'
      const login = String(u?.[usuariosLoginKey] ?? '').trim() || '(sem usuário)'
      const membroId = String(u?.[usuariosMembroKey] ?? '').trim()
      const membroNome = membrosById.get(membroId) || ''
      title.textContent = login
      title.style.cursor = 'pointer'
      title.onclick = async () => fillCadastro(u)
      const subtitle = document.createElement('div')
      subtitle.className = 'subtitle'
      subtitle.textContent = membroNome ? `Membro: ${membroNome}` : (membroId ? `Membro ID: ${membroId}` : '')
      const actionsDiv = document.createElement('div')
      actionsDiv.className = 'grid-actions'
      const btnDelete = document.createElement('button')
      btnDelete.type = 'button'
      btnDelete.title = 'Excluir'
      btnDelete.setAttribute('aria-label', 'Excluir')
      btnDelete.className = 'danger icon-btn'
      setButtonIcon(btnDelete, 'trash')
      btnDelete.onclick = async (ev) => {
        try { ev?.stopPropagation?.() } catch {}
        const id = String(u?.[usuariosPkKey] ?? '').trim()
        if (!id) { showStatus('ID do usuário não encontrado.', 'error'); return }
        const ok = await confirmModal({ title: 'Confirmar exclusão', message: `Excluir o usuário "${login}"?`, confirmText: 'Excluir', cancelText: 'Cancelar', danger: true })
        if (!ok) return
        showStatus('Excluindo...', 'success')
        const membroId = String(u?.[usuariosMembroKey] ?? '').trim()
        if (membroId) {
          try { await apiDeleteWhere(USERS_MODS_TABLE, { id_membro: `eq.${membroId}` }) } catch {}
        }
        await apiDelete(USERS_TABLE, usuariosPkKey, id)
        showStatus('Excluído.', 'success')
        refreshList().catch(() => {})
      }
      actionsDiv.appendChild(btnDelete)
      main.appendChild(title)
      main.appendChild(subtitle)
      div.appendChild(main)
      div.appendChild(actionsDiv)
      listWrap.appendChild(div)
    })

    showStatus('Pronto.', 'success')
  }

  btnSalvar.onclick = async () => {
    if (!cadastroEditMode && String(idInput.value ?? '').trim()) return
    const id = String(idInput.value ?? '').trim()
    const membroId = String(sMembro.value ?? '').trim()
    const login = String(iUsuario.value ?? '').trim().toUpperCase()
    const recebeNotificacoes = !!iRecebeNotificacoes.checked
    if (!membroId) { showStatus('Selecione o membro.', 'error'); return }
    if (!login) { showStatus('Informe o usuário.', 'error'); return }

    btnSalvar.disabled = true
    showStatus('Salvando...', 'success')
    try {
      const membroVal = /^\d+$/.test(membroId) ? Number(membroId) : membroId
      const userPayloads = []
      const loginKeys = [usuariosLoginKey, ...LOGIN_KEYS].filter(Boolean)
      const membroKeys = [usuariosMembroKey, ...MEMBRO_KEYS].filter(Boolean)
      const passKeys = [usuariosPassKey, ...PASS_KEYS].filter(Boolean)
      let userId = id
      if (!id) {
        membroKeys.forEach(mk => {
          loginKeys.forEach(lk => {
            passKeys.forEach(pk => userPayloads.push({ [mk]: membroVal, [lk]: login, [pk]: null, recebe_notificacoes: recebeNotificacoes }))
          })
        })
        const created = await tryCreateOne(USERS_TABLE, userPayloads)
        userId = String(created?.[usuariosPkKey] ?? created?.id ?? '').trim()
        if (!userId) throw new Error('Não foi possível identificar o usuário criado.')
      } else {
        const payloads = []
        membroKeys.forEach(mk => loginKeys.forEach(lk => payloads.push({ [mk]: membroVal, [lk]: login, recebe_notificacoes: recebeNotificacoes })))
        let updated = false
        for (const p of payloads) {
          try {
            await apiUpdate(USERS_TABLE, usuariosPkKey, id, p)
            updated = true
            break
          } catch (e) {
            const msg = String(e?.message || e || '')
            if (msg.includes('Could not find') || msg.includes('column') || msg.includes('unknown')) continue
            throw e
          }
        }
        if (!updated) throw new Error('Não foi possível atualizar o usuário.')
      }

    try {
      await tryDeleteWhere(USERS_MEMBERS_TABLE, USERS_MEMBERS_USER_KEYS.map(k => ({ [k]: `eq.${userId}` })))
      const payloads = []
      const userKeys = USERS_MEMBERS_USER_KEYS
      const membroKeys = USERS_MEMBERS_MEMBRO_KEYS
      userKeys.forEach(uk => membroKeys.forEach(mk => payloads.push({ [uk]: /^\d+$/.test(userId) ? Number(userId) : userId, [mk]: membroVal })))
      await tryCreateOne(USERS_MEMBERS_TABLE, payloads)
    } catch (e) {
      const msg = String(e?.message || e || '')
      if (!(msg.includes('Could not find') || msg.includes('does not exist') || msg.includes('Not Found') || msg.includes('404'))) throw e
    }

      const selectedMods = modsField.getSelected().map(x => String(x).trim()).filter(Boolean)
      if (!selectedMods.length) { showStatus('Selecione pelo menos um módulo.', 'error'); return }
      try { await apiDeleteWhere(USERS_MODS_TABLE, { id_membro: `eq.${membroId}` }) } catch {}
      await ensureUsuariosModulosKeys()
      for (const mid of selectedMods) {
        const modVal = /^\d+$/.test(mid) ? Number(mid) : mid
        const membroVal2 = /^\d+$/.test(membroId) ? Number(membroId) : membroId
        await apiCreate(USERS_MODS_TABLE, [{ [usuariosModsUserKey]: membroVal2, [usuariosModsModKey]: modVal }])
      }
      const savedMods = await loadUserModuleIds(membroId)
      if (savedMods.length < selectedMods.length) throw new Error('Não foi possível gravar os módulos do usuário em usuarios_modulos.')

      showStatus(id ? 'Alterações salvas.' : 'Usuário criado. Defina a senha no primeiro acesso.', 'success')
      setActiveLista()
    } catch (e) {
      const msg = String(e?.message || e || '')
      const friendly = friendlyUsuariosModulosError(msg) || friendlySalvarError(msg) || msg
      showStatus(friendly, 'error')
    } finally {
      btnSalvar.disabled = false
    }
  }

  setActiveLista()
  setCadastroMode(true)
}

function renderEbdScreen(schema, table) {
  const screens = el('screens')
  clear(screens)
  const status = document.createElement('div')
  status.className = 'status'
  screens.appendChild(status)
  let statusTimer = null
  function showStatus(text, type) {
    status.textContent = text
    status.classList.remove('success', 'error')
    if (type === 'success') status.classList.add('success')
    if (type === 'error') status.classList.add('error')
    status.style.display = 'block'
    if (statusTimer) clearTimeout(statusTimer)
    if (type !== 'error') statusTimer = setTimeout(() => { status.style.display = 'none' }, 2500)
  }

  const subtabs = document.createElement('div')
  subtabs.className = 'subtabs'
  const btnFreq = document.createElement('button')
  btnFreq.className = 'subtab active'
  btnFreq.textContent = 'Frequência'
  const btnRel = document.createElement('button')
  btnRel.className = 'subtab'
  btnRel.textContent = 'Relatórios'
  const btnCaixa = document.createElement('button')
  btnCaixa.className = 'subtab'
  btnCaixa.textContent = 'Caixa'
  subtabs.appendChild(btnFreq)
  subtabs.appendChild(btnRel)
  subtabs.appendChild(btnCaixa)
  screens.appendChild(subtabs)

  const panelFreq = document.createElement('div')
  const panelRel = document.createElement('div')
  const panelCaixa = document.createElement('div')
  panelRel.style.display = 'none'
  panelCaixa.style.display = 'none'
  screens.appendChild(panelFreq)
  screens.appendChild(panelRel)
  screens.appendChild(panelCaixa)

  const card = document.createElement('section')
  card.className = 'card'
  const h = document.createElement('h2')
  h.textContent = 'EBD - 2026'
  card.appendChild(h)

  const wrap = document.createElement('div')
  wrap.className = 'ebd-wrap ebd-one-day'
  const tableEl = document.createElement('table')
  tableEl.className = 'ebd-table'
  wrap.appendChild(tableEl)
  card.appendChild(wrap)
  panelFreq.appendChild(card)

  const cardRel = document.createElement('section')
  cardRel.className = 'card'
  const hRel = document.createElement('h2')
  hRel.textContent = 'Relatórios'
  cardRel.appendChild(hRel)
  const wrapRel = document.createElement('div')
  wrapRel.className = 'ebd-wrap ebd-report'
  const tableRel = document.createElement('table')
  tableRel.className = 'ebd-table'
  wrapRel.appendChild(tableRel)
  cardRel.appendChild(wrapRel)
  panelRel.appendChild(cardRel)

  const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
  function pad2(n) { return String(n).padStart(2, '0') }
  function isoDate(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` }
  function dateOnly(v) {
    const s = String(v ?? '').trim()
    if (!s) return ''
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
    return s
  }
  function getSundays(year) {
    const d = new Date(year, 0, 1)
    while (d.getDay() !== 0) d.setDate(d.getDate() + 1)
    const out = []
    while (d.getFullYear() === year) {
      out.push(new Date(d.getTime()))
      d.setDate(d.getDate() + 7)
    }
    return out
  }
  function pickKey(obj, keys) {
    for (const k of keys) if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return k
    return keys[0]
  }
  function guessLabelKey(obj) {
    const candidates = ['nome', 'descricao', 'name', 'titulo', 'label']
    for (const k of candidates) if (obj && Object.prototype.hasOwnProperty.call(obj, k) && typeof obj[k] === 'string') return k
    for (const k of Object.keys(obj || {})) if (typeof obj?.[k] === 'string') return k
    return 'nome'
  }

  const year = 2026
  const todayIso = isoDate(new Date())
  const sundays = getSundays(year).map(d => ({ d, iso: isoDate(d), month: d.getMonth(), day: d.getDate() }))
  const sundayIsosToDate = sundays.filter(x => x.iso <= todayIso).map(x => x.iso)
  const denomToDate = sundayIsosToDate.length

  const EBD_TURMAS_TABLE = 'ebd_turmas'
  const EBD_TURMAS_MEMBROS_TABLE = 'ebd_turmas_membros'
  const EBD_PRESENCA_MEMBROS_TABLE = 'ebd_presenca_membros'
  const EBD_RELATORIOS_TABLE = 'ebd_relatorios'
  let turmasCache = []
  let turmasIdKey = 'id'
  let turmasLabelKey = 'nome'
  let turmasMembrosMembroKey = 'id_membro'
  let turmasMembrosTurmaKey = 'id_turma'
  let presencaMembrosMembroKey = 'id_membro'
  let presencaMembrosDataKey = 'data'
  const turmasByMembro = new Map()
  const presSet = new Set()
  let membrosCache = []
  let turmaOptionsCache = []
  const relByTurmaDay = new Map()
  const relSaveTimers = new Map()

  const MEMBRO_KEYS = ['id_membro', 'membro_id', 'membros_id', 'idMembro', 'id_aluno', 'aluno_id', 'idAluno', 'aluno', 'membro']
  const TURMA_KEYS = ['id_turma', 'turma_id', 'turmas_id', 'idTurma', 'ebd_turma_id', 'id_ebd_turma', 'ebdTurmaId', 'turma', 'id_ebd_turmas', 'ebd_turmas_id']
  const DATA_KEYS = ['data', 'dia', 'data_aula', 'data_domingo', 'data_presenca', 'dataDomingo', 'dataPresenca']

  function firstExistingKey(obj, keys) {
    for (const k of keys) if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return k
    return ''
  }
  function firstExistingValue(obj, keys) {
    const k = firstExistingKey(obj, keys)
    if (!k) return null
    const v = obj?.[k]
    if (v === undefined || v === null) return null
    const s = String(v).trim()
    return s ? v : null
  }
  async function tryDeleteWhere(tableName, filtersList) {
    let lastErr = null
    for (const filters of filtersList) {
      try {
        await apiDeleteWhere(tableName, filters)
        return
      } catch (e) {
        lastErr = e
        const msg = String(e?.message || e || '')
        if (msg.includes('Could not find the') || msg.includes('Could not find') || msg.includes('column') || msg.includes('unknown')) continue
        throw e
      }
    }
    if (lastErr) throw lastErr
  }
  async function tryCreateOne(tableName, payloads) {
    let lastErr = null
    for (const p of payloads) {
      try {
        await apiCreate(tableName, [p])
        return
      } catch (e) {
        lastErr = e
        const msg = String(e?.message || e || '')
        if (msg.includes('Could not find the') || msg.includes('Could not find') || msg.includes('column') || msg.includes('unknown')) continue
        throw e
      }
    }
    if (lastErr) throw lastErr
  }

  function freqTextForMember(memberId) {
    if (!denomToDate) return '0,00%'
    let present = 0
    for (const iso of sundayIsosToDate) {
      if (presSet.has(`${memberId}|${iso}`)) present += 1
    }
    const pct = (present / denomToDate) * 100
    return `${pct.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
  }

  function buildHeader() {
    const thead = document.createElement('thead')
    const rowMonth = document.createElement('tr')
    const rowDay = document.createElement('tr')

    const thNome = document.createElement('th')
    thNome.textContent = 'Nome'
    thNome.className = 'ebd-sticky ebd-sticky-1'
    thNome.rowSpan = 2

    const thTurma = document.createElement('th')
    thTurma.textContent = 'Turma'
    thTurma.rowSpan = 2

    const thFreq = document.createElement('th')
    thFreq.textContent = '%FREQ'
    thFreq.rowSpan = 2

    rowMonth.appendChild(thNome)
    rowMonth.appendChild(thTurma)

    let i = 0
    while (i < sundays.length) {
      const month = sundays[i].month
      let j = i
      while (j < sundays.length && sundays[j].month === month) j += 1
      const th = document.createElement('th')
      th.className = 'ebd-month-group'
      th.textContent = MONTHS[month]
      th.colSpan = j - i
      rowMonth.appendChild(th)
      i = j
    }
    rowMonth.appendChild(thFreq)

    sundays.forEach(s => {
      const th = document.createElement('th')
      th.textContent = String(s.day)
      th.className = 'ebd-day'
      th.dataset.iso = s.iso
      th.dataset.month = MONTHS[s.month]
      rowDay.appendChild(th)
    })
    thead.appendChild(rowMonth)
    thead.appendChild(rowDay)
    return thead
  }

  function applyStickyOffsets() {
    const firstEls = Array.from(tableEl.querySelectorAll('.ebd-sticky-1'))
    if (!firstEls.length) return
    const firstWidth = Math.ceil(Math.max(...firstEls.map(x => x.getBoundingClientRect().width || 0), 0))
    tableEl.querySelectorAll('.ebd-sticky-2').forEach(el => {
      el.style.left = `${firstWidth}px`
    })
    const headRow1 = tableEl.querySelector('thead tr')
    if (headRow1) {
      const h = Math.ceil(headRow1.getBoundingClientRect().height || 0)
      tableEl.style.setProperty('--ebd-head1', `${h}px`)
    }
  }

  function focusNearestDay() {
    let targetIso = ''
    for (let i = sundays.length - 1; i >= 0; i--) {
      if (sundays[i].iso <= todayIso) { targetIso = sundays[i].iso; break }
    }
    if (!targetIso && sundays.length) targetIso = sundays[0].iso
    if (!targetIso) return
    const th = tableEl.querySelector(`thead tr:last-child th[data-iso="${targetIso}"]`)
    if (!th) return
    try { th.scrollIntoView({ block: 'nearest', inline: 'center' }) } catch {}
  }

  function applyHeaderOffsetForTable(t) {
    const headRow1 = t.querySelector('thead tr')
    if (headRow1) {
      const h = Math.ceil(headRow1.getBoundingClientRect().height || 0)
      t.style.setProperty('--ebd-head1', `${h}px`)
    }
  }

  function focusNearestDayForTable(t, days) {
    let targetIso = ''
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].iso <= todayIso) { targetIso = days[i].iso; break }
    }
    if (!targetIso && days.length) targetIso = days[0].iso
    if (!targetIso) return
    const th = t.querySelector(`thead tr:last-child th[data-iso="${targetIso}"]`)
    if (!th) return
    try { th.scrollIntoView({ block: 'nearest', inline: 'center' }) } catch {}
  }

  function buildReportHeader() {
    const thead = document.createElement('thead')
    const rowMonth = document.createElement('tr')
    const rowDay = document.createElement('tr')

    const thTurma = document.createElement('th')
    thTurma.textContent = 'Turma'
    thTurma.className = 'ebd-sticky ebd-sticky-1'
    thTurma.rowSpan = 2
    rowMonth.appendChild(thTurma)

    let i = 0
    while (i < sundays.length) {
      const month = sundays[i].month
      let j = i
      while (j < sundays.length && sundays[j].month === month) j += 1
      const th = document.createElement('th')
      th.className = 'ebd-month-group'
      th.textContent = MONTHS[month]
      th.colSpan = j - i
      rowMonth.appendChild(th)
      i = j
    }

    const thTotal = document.createElement('th')
    thTotal.textContent = 'TOTAL'
    thTotal.rowSpan = 2
    rowMonth.appendChild(thTotal)

    sundays.forEach(s => {
      const th = document.createElement('th')
      th.textContent = String(s.day)
      th.className = 'ebd-day'
      th.dataset.iso = s.iso
      th.dataset.month = MONTHS[s.month]
      rowDay.appendChild(th)
    })

    thead.appendChild(rowMonth)
    thead.appendChild(rowDay)
    return thead
  }

  function relKey(turmaId, iso) {
    return `${String(turmaId)}|${String(iso)}`
  }

  function parseDecimal(raw) {
    const s = String(raw ?? '').trim()
    if (!s) return null
    const n = Number(s.replace(',', '.'))
    if (!Number.isFinite(n)) return null
    return n
  }

  function parseIntNonNeg(raw) {
    const s = String(raw ?? '').trim()
    if (!s) return null
    const n = Number(s.replace(',', '.'))
    if (!Number.isFinite(n)) return null
    const i = Math.trunc(n)
    if (i < 0) return null
    return i
  }

  function getRelRow(turmaId, iso) {
    return relByTurmaDay.get(relKey(turmaId, iso)) || null
  }

  function getRelNumber(turmaId, iso, field) {
    const row = getRelRow(turmaId, iso)
    if (!row) return 0
    const dbField = field === 'ofertas' ? 'oferta' : field
    const v = row?.[dbField]
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }

  function setRelValueFromInput(turmaId, iso, field, rawValue) {
    const dbField = field === 'ofertas' ? 'oferta' : field
    const next = getRelRow(turmaId, iso) || { id: null, id_turma: String(turmaId), data: String(iso), oferta: null, biblias: null, revistas: null }
    if (dbField === 'oferta') next.oferta = parseDecimal(rawValue)
    if (dbField === 'biblias') next.biblias = parseIntNonNeg(rawValue)
    if (dbField === 'revistas') next.revistas = parseIntNonNeg(rawValue)
    relByTurmaDay.set(relKey(turmaId, iso), next)
  }

  function isRelRowEmpty(row) {
    if (!row) return true
    const of = row.oferta
    const bi = row.biblias
    const re = row.revistas
    const hasOferta = of !== null && of !== undefined && of !== '' && Number.isFinite(Number(of)) && Number(of) !== 0
    const hasBiblias = bi !== null && bi !== undefined && bi !== '' && Number.isFinite(Number(bi)) && Number(bi) !== 0
    const hasRevistas = re !== null && re !== undefined && re !== '' && Number.isFinite(Number(re)) && Number(re) !== 0
    return !(hasOferta || hasBiblias || hasRevistas)
  }

  async function persistRelRow(turmaId, iso) {
    const k = relKey(turmaId, iso)
    const row = getRelRow(turmaId, iso)
    if (!row) return

    const tid = String(turmaId ?? '').trim()
    const tidVal = /^\d+$/.test(tid) ? Number(tid) : tid
    const payload = {
      id_turma: tidVal,
      data: String(iso),
      oferta: row.oferta === null || row.oferta === undefined || row.oferta === '' ? null : Number(row.oferta),
      biblias: row.biblias === null || row.biblias === undefined || row.biblias === '' ? null : Number(row.biblias),
      revistas: row.revistas === null || row.revistas === undefined || row.revistas === '' ? null : Number(row.revistas)
    }

    if (row.id && isRelRowEmpty(row)) {
      try {
        await apiDelete(EBD_RELATORIOS_TABLE, 'id', row.id)
        relByTurmaDay.delete(k)
      } catch (e) {
        showStatus(String(e?.message || e), 'error')
      }
      return
    }

    if (row.id) {
      try {
        const res = await apiUpdate(EBD_RELATORIOS_TABLE, 'id', row.id, payload)
        const updated = Array.isArray(res) ? (res[0] || null) : (res || null)
        if (updated) {
          const dt = dateOnly(updated?.data ?? iso)
          relByTurmaDay.set(k, {
            id: updated?.id ?? row.id,
            id_turma: String(updated?.id_turma ?? tid).trim(),
            data: dt,
            oferta: updated?.oferta ?? payload.oferta,
            biblias: updated?.biblias ?? payload.biblias,
            revistas: updated?.revistas ?? payload.revistas
          })
        }
      } catch (e) {
        showStatus(String(e?.message || e), 'error')
      }
      return
    }

    if (isRelRowEmpty(row)) return

    try {
      const res = await apiCreate(EBD_RELATORIOS_TABLE, [payload])
      const created = Array.isArray(res) ? (res[0] || null) : (res || null)
      if (created) {
        relByTurmaDay.set(k, {
          id: created?.id ?? null,
          id_turma: String(created?.id_turma ?? tid).trim(),
          data: dateOnly(created?.data ?? iso),
          oferta: created?.oferta ?? payload.oferta,
          biblias: created?.biblias ?? payload.biblias,
          revistas: created?.revistas ?? payload.revistas
        })
      }
    } catch (e) {
      showStatus(String(e?.message || e), 'error')
    }
  }

  function schedulePersistRelRow(turmaId, iso) {
    const k = relKey(turmaId, iso)
    if (relSaveTimers.has(k)) clearTimeout(relSaveTimers.get(k))
    const t = setTimeout(() => {
      relSaveTimers.delete(k)
      persistRelRow(turmaId, iso)
    }, 800)
    relSaveTimers.set(k, t)
  }

  function refreshReports() {
    tableRel.innerHTML = ''
    tableRel.appendChild(buildReportHeader())

    const turmas = (turmaOptionsCache || [])
      .filter(t => String(t?.value ?? '').trim())
      .map(t => ({ id: String(t.value).trim(), label: String(t.label ?? t.value).trim() }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }))

    const sundaySet = new Set(sundays.map(x => x.iso))
    const countsByTurmaDay = new Map()
    for (const entry of presSet) {
      const parts = String(entry).split('|')
      const mid = String(parts[0] ?? '').trim()
      const dt = String(parts[1] ?? '').trim()
      if (!mid || !dt) continue
      if (!sundaySet.has(dt)) continue
      const tid = String(turmasByMembro.get(mid) ?? '').trim()
      if (!tid) continue
      const k = `${tid}|${dt}`
      countsByTurmaDay.set(k, (countsByTurmaDay.get(k) || 0) + 1)
    }

    function presenceCount(turmaId, iso) {
      return countsByTurmaDay.get(`${turmaId}|${iso}`) || 0
    }

    function money(v) {
      const n = Number(v)
      if (!Number.isFinite(n)) return 'R$ 0,00'
      return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    function formatField(field, v) {
      if (field === 'ofertas') return money(v)
      const n = Number(v)
      if (!Number.isFinite(n)) return '0'
      return String(Math.trunc(n))
    }

    function sumInputsAllTurmas(iso, field) {
      let s = 0
      turmas.forEach(t => { s += getRelNumber(t.id, iso, field) })
      return s
    }

    const tbody = document.createElement('tbody')

    function addGroupHeader(label) {
      const tr = document.createElement('tr')
      tr.className = 'ebd-group'
      const td0 = document.createElement('td')
      td0.textContent = label
      td0.className = 'ebd-sticky ebd-sticky-1'
      const td = document.createElement('td')
      td.colSpan = sundays.length + 1
      tr.appendChild(td0)
      tr.appendChild(td)
      tbody.appendChild(tr)
    }

    function addPresenceRow(label, turmaId, isTotalRow) {
      const tr = document.createElement('tr')
      const tdLabel = document.createElement('td')
      tdLabel.textContent = label
      tdLabel.className = 'ebd-sticky ebd-sticky-1'
      tr.appendChild(tdLabel)
      let rowTotal = 0
      sundays.forEach(s => {
        const td = document.createElement('td')
        td.className = 'ebd-report-cell'
        const v = isTotalRow ? turmas.reduce((acc, t) => acc + presenceCount(t.id, s.iso), 0) : presenceCount(turmaId, s.iso)
        rowTotal += v
        td.textContent = String(v || 0)
        tr.appendChild(td)
      })
      const tdTot = document.createElement('td')
      tdTot.textContent = String(rowTotal || 0)
      tr.appendChild(tdTot)
      tbody.appendChild(tr)
    }

    function addInputRow(label, turmaId, field, isTotalRow) {
      const tr = document.createElement('tr')
      const tdLabel = document.createElement('td')
      tdLabel.textContent = label
      tdLabel.className = 'ebd-sticky ebd-sticky-1'
      tr.appendChild(tdLabel)

      let rowTotal = 0
      const totalsRowCells = new Map()

      sundays.forEach(s => {
        const td = document.createElement('td')
        td.className = 'ebd-report-cell'
        if (isTotalRow) {
          const v = sumInputsAllTurmas(s.iso, field)
          rowTotal += v
          td.textContent = formatField(field, v)
          totalsRowCells.set(s.iso, td)
        } else {
          const inp = document.createElement('input')
          inp.type = 'number'
          inp.min = '0'
          if (field === 'ofertas') {
            inp.step = '0.01'
            inp.inputMode = 'decimal'
          } else {
            inp.step = '1'
            inp.inputMode = 'numeric'
          }
          inp.className = 'report-input'
          const row = getRelRow(turmaId, s.iso)
          const dbField = field === 'ofertas' ? 'oferta' : field
          const stored = row ? row?.[dbField] : null
          inp.value = stored === null || stored === undefined ? '' : String(stored)
          rowTotal += getRelNumber(turmaId, s.iso, field)
          inp.oninput = () => {
            setRelValueFromInput(turmaId, s.iso, field, inp.value)
            schedulePersistRelRow(turmaId, s.iso)
            if (rowTotalCell) rowTotalCell.textContent = formatField(field, sumRowInputs(turmaId, field) || 0)
            if (totalRowUpdaters[field] && totalRowUpdaters[field].cells.has(s.iso)) {
              totalRowUpdaters[field].cells.get(s.iso).textContent = formatField(field, sumInputsAllTurmas(s.iso, field) || 0)
              totalRowUpdaters[field].totalCell.textContent = formatField(field, sumAllDaysAllTurmas(field) || 0)
            }
          }
          inp.onblur = () => { persistRelRow(turmaId, s.iso) }
          td.appendChild(inp)
        }
        tr.appendChild(td)
      })

      function sumRowInputs(tid, f) {
        let total = 0
        sundays.forEach(s => { total += getRelNumber(tid, s.iso, f) })
        return total
      }

      const rowTotalCell = document.createElement('td')
      rowTotalCell.textContent = formatField(field, rowTotal || 0)
      tr.appendChild(rowTotalCell)
      tbody.appendChild(tr)

      return { tr, totalsRowCells, totalCell: rowTotalCell }
    }

    function sumAllDaysAllTurmas(field) {
      let total = 0
      sundays.forEach(s => { total += sumInputsAllTurmas(s.iso, field) })
      return total
    }

    const totalRowUpdaters = {}

    turmas.forEach(t => {
      addGroupHeader(t.label)
      addPresenceRow('Presentes', t.id, false)
      addInputRow('Oferta', t.id, 'ofertas', false)
      addInputRow('Bíblias', t.id, 'biblias', false)
      addInputRow('Revistas', t.id, 'revistas', false)
    })

    addGroupHeader('Total')
    addPresenceRow('Presentes', '', true)
    const totOferta = addInputRow('Oferta', '', 'ofertas', true)
    const totBibs = addInputRow('Bíblias', '', 'biblias', true)
    const totRevs = addInputRow('Revistas', '', 'revistas', true)

    totalRowUpdaters.ofertas = { cells: totOferta.totalsRowCells, totalCell: totOferta.totalCell }
    totalRowUpdaters.biblias = { cells: totBibs.totalsRowCells, totalCell: totBibs.totalCell }
    totalRowUpdaters.revistas = { cells: totRevs.totalsRowCells, totalCell: totRevs.totalCell }

    tableRel.appendChild(tbody)
    applyHeaderOffsetForTable(tableRel)
    focusNearestDayForTable(tableRel, sundays)
  }

  async function load() {
    showStatus('Carregando...', 'success')
    let membros = []
    try {
      const rows = await apiGet('membros', { select: 'id,nome' })
      membros = (Array.isArray(rows) ? rows : [])
        .map(r => ({ id: String(r?.id ?? '').trim(), nome: String(r?.nome ?? '').trim() }))
        .filter(x => x.id && x.nome)
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
    } catch (e) {
      showStatus(String(e?.message || e), 'error')
      membros = []
    }
    membrosCache = membros

    const turmaOptions = [{ value: '', label: '' }]
    try {
      const rows = await apiList(EBD_TURMAS_TABLE)
      turmasCache = Array.isArray(rows) ? rows : []
      const sample = turmasCache[0] || {}
      turmasIdKey = pickKey(sample, ['id', 'turma_id', 'codigo'])
      turmasLabelKey = guessLabelKey(sample)
      turmasCache.forEach(t => {
        const v = t?.[turmasIdKey]
        const l = String(t?.[turmasLabelKey] ?? v ?? '')
        if (v === undefined || v === null || String(v) === '') return
        turmaOptions.push({ value: String(v), label: l })
      })
    } catch (e) {
      turmasCache = []
      showStatus(String(e?.message || e), 'error')
    }
    turmaOptionsCache = turmaOptions.slice()

    turmasByMembro.clear()
    try {
      const rows = await apiGet(EBD_TURMAS_MEMBROS_TABLE, { select: '*' })
      const list = Array.isArray(rows) ? rows : []
      list.forEach(r => {
        const midVal = firstExistingValue(r, MEMBRO_KEYS)
        const tidVal = firstExistingValue(r, TURMA_KEYS)
        const mid = midVal === null ? '' : String(midVal).trim()
        const tid = tidVal === null ? '' : String(tidVal).trim()
        if (!mid || !tid) return
        if (!turmasByMembro.has(mid)) turmasByMembro.set(mid, tid)
        const mk = firstExistingKey(r, MEMBRO_KEYS)
        const tk = firstExistingKey(r, TURMA_KEYS)
        if (mk) turmasMembrosMembroKey = mk
        if (tk) turmasMembrosTurmaKey = tk
      })
    } catch (e) {
      turmasByMembro.clear()
      showStatus(String(e?.message || e), 'error')
    }

    presSet.clear()
    try {
      const rows = await apiGet(EBD_PRESENCA_MEMBROS_TABLE, { select: '*' })
      const list = Array.isArray(rows) ? rows : []
      list.forEach(r => {
        const midVal = firstExistingValue(r, MEMBRO_KEYS)
        const dtVal = firstExistingValue(r, DATA_KEYS)
        const mid = midVal === null ? '' : String(midVal).trim()
        const dt = dateOnly(dtVal === null ? '' : String(dtVal).trim())
        if (!mid || !dt) return
        if (!dt.startsWith(`${year}-`)) return
        presSet.add(`${mid}|${dt}`)
        const mk = firstExistingKey(r, MEMBRO_KEYS)
        const dk = firstExistingKey(r, DATA_KEYS)
        if (mk) presencaMembrosMembroKey = mk
        if (dk) presencaMembrosDataKey = dk
      })
    } catch (e) {
      presSet.clear()
      showStatus(String(e?.message || e), 'error')
    }

    relByTurmaDay.clear()
    try {
      const rows = await apiGet(EBD_RELATORIOS_TABLE, {
        select: '*',
        data: [`gte.${year}-01-01`, `lte.${year}-12-31`]
      })
      const list = Array.isArray(rows) ? rows : []
      list.forEach(r => {
        const tid = String(r?.id_turma ?? '').trim()
        const dt = dateOnly(r?.data ?? '')
        if (!tid || !dt) return
        if (!dt.startsWith(`${year}-`)) return
        relByTurmaDay.set(relKey(tid, dt), {
          id: r?.id ?? null,
          id_turma: tid,
          data: dt,
          oferta: r?.oferta ?? null,
          biblias: r?.biblias ?? null,
          revistas: r?.revistas ?? null
        })
      })
    } catch (e) {
      relByTurmaDay.clear()
      showStatus(String(e?.message || e), 'error')
    }

    tableEl.innerHTML = ''
    tableEl.appendChild(buildHeader())
    const tbody = document.createElement('tbody')
    const frag = document.createDocumentFragment()
    const freqCells = new Map()

    membros.forEach(m => {
      const tr = document.createElement('tr')

      const tdNome = document.createElement('td')
      tdNome.textContent = m.nome
      tdNome.className = 'ebd-sticky ebd-sticky-1'
      tr.appendChild(tdNome)

      const tdTurma = document.createElement('td')
      const sel = document.createElement('select')
      sel.className = 'ebd-turma'
      turmaOptions.forEach(o => {
        const opt = document.createElement('option')
        opt.value = o.value
        opt.textContent = o.label
        sel.appendChild(opt)
      })
      sel.value = String(turmasByMembro.get(m.id) ?? '')
      sel.onchange = async () => {
        const desiredTurmaId = String(sel.value ?? '').trim()
        const membroVal = /^\d+$/.test(String(m.id)) ? Number(m.id) : m.id
        try {
          await tryDeleteWhere(EBD_TURMAS_MEMBROS_TABLE, MEMBRO_KEYS.map(k => ({ [k]: `eq.${m.id}` })))
          if (desiredTurmaId) {
            const turmaVal = /^\d+$/.test(desiredTurmaId) ? Number(desiredTurmaId) : desiredTurmaId
            const payloads = []
            payloads.push({ [turmasMembrosMembroKey]: membroVal, [turmasMembrosTurmaKey]: turmaVal })
            MEMBRO_KEYS.forEach(mk => TURMA_KEYS.forEach(tk => payloads.push({ [mk]: membroVal, [tk]: turmaVal })))
            await tryCreateOne(EBD_TURMAS_MEMBROS_TABLE, payloads)
            turmasByMembro.set(m.id, desiredTurmaId)
          } else {
            turmasByMembro.delete(m.id)
          }
        } catch (e) {
          showStatus(String(e?.message || e), 'error')
          sel.value = String(turmasByMembro.get(m.id) ?? '')
        }
        if (panelRel.style.display !== 'none') refreshReports()
      }
      tdTurma.appendChild(sel)
      tr.appendChild(tdTurma)

      sundays.forEach(s => {
        const td = document.createElement('td')
        td.className = 'ebd-cell'
        const k = `${m.id}|${s.iso}`
        const present = presSet.has(k)
        if (present) {
          td.textContent = 'P'
          td.classList.add('present')
        } else {
          td.textContent = ''
        }
        td.onclick = async () => {
          const membroVal = /^\d+$/.test(String(m.id)) ? Number(m.id) : m.id
          const wasPresent = presSet.has(k)
          if (wasPresent) {
            presSet.delete(k)
            td.textContent = ''
            td.classList.remove('present')
          } else {
            presSet.add(k)
            td.textContent = 'P'
            td.classList.add('present')
          }
          const fc0 = freqCells.get(m.id)
          if (fc0) fc0.textContent = freqTextForMember(m.id)
          try {
            if (wasPresent) {
              await tryDeleteWhere(EBD_PRESENCA_MEMBROS_TABLE, DATA_KEYS.flatMap(dk => MEMBRO_KEYS.map(mk => ({ [mk]: `eq.${m.id}`, [dk]: `eq.${s.iso}` }))))
            } else {
              const payloads = []
              payloads.push({ [presencaMembrosMembroKey]: membroVal, [presencaMembrosDataKey]: s.iso })
              MEMBRO_KEYS.forEach(mk => DATA_KEYS.forEach(dk => payloads.push({ [mk]: membroVal, [dk]: s.iso })))
              await tryCreateOne(EBD_PRESENCA_MEMBROS_TABLE, payloads)
            }
            const fc = freqCells.get(m.id)
            if (fc) fc.textContent = freqTextForMember(m.id)
          } catch (e) {
            showStatus(String(e?.message || e), 'error')
            if (wasPresent) {
              presSet.add(k)
              td.textContent = 'P'
              td.classList.add('present')
            } else {
              presSet.delete(k)
              td.textContent = ''
              td.classList.remove('present')
            }
            const fc = freqCells.get(m.id)
            if (fc) fc.textContent = freqTextForMember(m.id)
          }
        }
        tr.appendChild(td)
      })

      const tdFreq = document.createElement('td')
      tdFreq.textContent = freqTextForMember(m.id)
      tdFreq.className = 'ebd-freq'
      tr.appendChild(tdFreq)
      freqCells.set(m.id, tdFreq)

      frag.appendChild(tr)
    })
    tbody.appendChild(frag)
    tableEl.appendChild(tbody)
    applyStickyOffsets()
    focusNearestDay()
    showStatus('Pronto.', 'success')
  }

  window.addEventListener('resize', applyStickyOffsets)
  load().catch(e => showStatus(String(e?.message || e), 'error'))

  const cardCx = document.createElement('section')
  cardCx.className = 'card'
  const hCx = document.createElement('h2')
  hCx.textContent = 'EBD - Caixa'
  cardCx.appendChild(hCx)
  const formCx = document.createElement('div')
  const fData = document.createElement('div'); fData.className = 'field'
  const lData = document.createElement('label'); lData.textContent = 'Data'
  const iData = document.createElement('input'); iData.type = 'date'
  fData.appendChild(lData); fData.appendChild(iData)
  const fEntrada = document.createElement('div'); fEntrada.className = 'field'
  const lEntrada = document.createElement('label'); lEntrada.textContent = 'Entrada'
  const iEntrada = document.createElement('input'); iEntrada.type = 'number'; iEntrada.step = '0.01'; iEntrada.inputMode = 'decimal'
  fEntrada.appendChild(lEntrada); fEntrada.appendChild(iEntrada)
  const fSaida = document.createElement('div'); fSaida.className = 'field'
  const lSaida = document.createElement('label'); lSaida.textContent = 'Saída'
  const iSaida = document.createElement('input'); iSaida.type = 'number'; iSaida.step = '0.01'; iSaida.inputMode = 'decimal'
  fSaida.appendChild(lSaida); fSaida.appendChild(iSaida)
  const fDesc = document.createElement('div'); fDesc.className = 'field'
  const lDesc = document.createElement('label'); lDesc.textContent = 'Descrição'
  const iDesc = document.createElement('input'); iDesc.type = 'text'
  fDesc.appendChild(lDesc); fDesc.appendChild(iDesc)
  const actionsCx = document.createElement('div'); actionsCx.className = 'actions'
  const btnSalvarCx = document.createElement('button'); btnSalvarCx.type = 'button'; btnSalvarCx.className = 'icon-btn'; btnSalvarCx.title = 'Salvar'; btnSalvarCx.setAttribute('aria-label','Salvar'); setButtonIcon(btnSalvarCx,'save')
  actionsCx.appendChild(btnSalvarCx)
  formCx.appendChild(fData)
  formCx.appendChild(fEntrada)
  formCx.appendChild(fSaida)
  formCx.appendChild(fDesc)
  formCx.appendChild(actionsCx)
  cardCx.appendChild(formCx)
  const listCard = document.createElement('section'); listCard.className = 'card'
  const hList = document.createElement('h2'); hList.textContent = 'Lançamentos'
  const listWrap = document.createElement('div'); listWrap.className = 'ebd-wrap'
  const tableCx = document.createElement('table'); tableCx.className = 'ebd-table'
  listWrap.appendChild(tableCx)
  const saldoWrap = document.createElement('div'); saldoWrap.className = 'saldo'
  listCard.appendChild(hList); listCard.appendChild(listWrap); listCard.appendChild(saldoWrap)
  panelCaixa.appendChild(cardCx)
  panelCaixa.appendChild(listCard)
  let editId = ''
  function todayStr() {
    const d = new Date()
    const p = (n) => String(n).padStart(2,'0')
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`
  }
  function clearForm() {
    iData.value = todayStr()
    iEntrada.value = ''
    iSaida.value = ''
    iDesc.value = ''
    editId = ''
  }
  async function refreshList() {
    tableCx.innerHTML = ''
    let rows = []
    try {
      rows = await apiList('ebd_caixa')
    } catch (e) {
      saldoWrap.textContent = ''
      showStatus(String(e?.message || e), 'error')
      return
    }
    rows = Array.isArray(rows) ? rows : []
    rows.sort((a,b) => {
      const ad = String(a?.data ?? '')
      const bd = String(b?.data ?? '')
      if (ad !== bd) return ad.localeCompare(bd)
      const ai = Number(a?.id ?? 0), bi = Number(b?.id ?? 0)
      return ai - bi
    })
    function money(v) {
      if (v === null || v === undefined || v === '') return ''
      const n = Number(v)
      if (!Number.isFinite(n)) return ''
      return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    const thead = document.createElement('thead')
    const hr1 = document.createElement('tr')
    const thData1 = document.createElement('th'); thData1.textContent = 'DATA'
    const thDesc = document.createElement('th'); thDesc.textContent = 'DESCRICAO'; thDesc.colSpan = 2
    const thBtns1 = document.createElement('th'); thBtns1.textContent = ''
    hr1.appendChild(thData1)
    hr1.appendChild(thDesc)
    hr1.appendChild(thBtns1)
    const hr2 = document.createElement('tr')
    const thData2 = document.createElement('th'); thData2.textContent = ''
    const thEntrada = document.createElement('th'); thEntrada.textContent = 'ENTRADA'
    const thSaida = document.createElement('th'); thSaida.textContent = 'SAIDA'
    const thBtns2 = document.createElement('th'); thBtns2.textContent = ''
    hr2.appendChild(thData2)
    hr2.appendChild(thEntrada)
    hr2.appendChild(thSaida)
    hr2.appendChild(thBtns2)
    thead.appendChild(hr1)
    thead.appendChild(hr2)
    tableCx.appendChild(thead)

    const tbody = document.createElement('tbody')
    let totalIn = 0, totalOut = 0
    rows.forEach(r => {
      const dd = String(r?.data ?? '').slice(0, 10)
      const entrada = Number(r?.entrada ?? 0)
      const saida = Number(r?.saida ?? 0)
      if (Number.isFinite(entrada)) totalIn += entrada
      if (Number.isFinite(saida)) totalOut += saida

      const actions = document.createElement('div'); actions.className = 'grid-actions'
      const btnEdit = document.createElement('button'); btnEdit.type = 'button'; btnEdit.className = 'icon-btn'; btnEdit.title = 'Editar'; setButtonIcon(btnEdit, 'edit')
      const btnDel = document.createElement('button'); btnDel.type = 'button'; btnDel.className = 'danger icon-btn'; btnDel.title = 'Excluir'; setButtonIcon(btnDel, 'trash')

      btnEdit.onclick = (ev) => {
        try { ev?.stopPropagation?.() } catch {}
        editId = String(r?.id ?? '').trim()
        iData.value = String(r?.data ?? '').slice(0, 10) || todayStr()
        iEntrada.value = (r?.entrada === null || r?.entrada === undefined) ? '' : String(r?.entrada ?? '')
        iSaida.value = (r?.saida === null || r?.saida === undefined) ? '' : String(r?.saida ?? '')
        iDesc.value = String(r?.descricao ?? '')
      }
      btnDel.onclick = async (ev) => {
        try { ev?.stopPropagation?.() } catch {}
        const id = String(r?.id ?? '').trim()
        if (!id) return
        const ok = await confirmModal({ title: 'Confirmar exclusão', message: 'Excluir lançamento?', confirmText: 'Excluir', cancelText: 'Cancelar', danger: true })
        if (!ok) return
        try { await apiDelete('ebd_caixa', 'id', id); refreshList() } catch (e) { showStatus(String(e?.message || e), 'error') }
      }
      actions.appendChild(btnEdit); actions.appendChild(btnDel)

      const tr1 = document.createElement('tr')
      const tr2 = document.createElement('tr')

      const tdData = document.createElement('td'); tdData.textContent = dd || ''; tdData.rowSpan = 2
      const tdDesc = document.createElement('td')
      tdDesc.colSpan = 2
      tdDesc.className = 'caixa-desc'
      tdDesc.textContent = String(r?.descricao ?? '')
      const tdBtns = document.createElement('td'); tdBtns.rowSpan = 2; tdBtns.className = 'caixa-actions'
      tdBtns.appendChild(actions)

      const tdEntrada = document.createElement('td'); tdEntrada.textContent = Number.isFinite(entrada) && entrada ? money(entrada) : ''
      const tdSaida = document.createElement('td'); tdSaida.textContent = Number.isFinite(saida) && saida ? money(saida) : ''

      tr1.appendChild(tdData)
      tr1.appendChild(tdDesc)
      tr1.appendChild(tdBtns)
      tr2.appendChild(tdEntrada)
      tr2.appendChild(tdSaida)

      tr1.onclick = () => btnEdit.onclick()
      tr2.onclick = () => btnEdit.onclick()

      tbody.appendChild(tr1)
      tbody.appendChild(tr2)
    })
    tableCx.appendChild(tbody)
    const saldo = totalIn - totalOut
    saldoWrap.textContent = `Saldo final: ${money(saldo)}`
    const trs = tbody.querySelectorAll('tr')
    if (trs.length) trs[trs.length - 1].scrollIntoView({ block: 'nearest' })
  }
  btnSalvarCx.onclick = async () => {
    const entrada = iEntrada.value === '' ? null : Number(iEntrada.value)
    const saida = iSaida.value === '' ? null : Number(iSaida.value)
    if (!((entrada !== null && Number.isFinite(entrada)) || (saida !== null && Number.isFinite(saida)))) {
      showStatus('Informe um valor em "Entrada" ou "Saída".', 'error')
      return
    }
    const payload = {
      data: (iData.value || null),
      entrada: entrada !== null && Number.isFinite(entrada) ? entrada : null,
      saida: saida !== null && Number.isFinite(saida) ? saida : null,
      descricao: iDesc.value || null
    }
    try {
      if (editId) await apiUpdate('ebd_caixa','id', editId, payload)
      else await apiCreate('ebd_caixa', [payload])
      showStatus('Salvo.', 'success')
      clearForm()
      refreshList()
    } catch (e) {
      showStatus(String(e?.message || e), 'error')
    }
  }
  clearForm()
  refreshList()

  function setActiveFreq() { btnFreq.classList.add('active'); btnRel.classList.remove('active'); btnCaixa.classList.remove('active'); panelFreq.style.display=''; panelRel.style.display='none'; panelCaixa.style.display='none' }
  function setActiveRel() { btnRel.classList.add('active'); btnFreq.classList.remove('active'); btnCaixa.classList.remove('active'); panelRel.style.display=''; panelFreq.style.display='none'; panelCaixa.style.display='none'; refreshReports() }
  function setActiveCaixa() { btnCaixa.classList.add('active'); btnFreq.classList.remove('active'); btnRel.classList.remove('active'); panelCaixa.style.display=''; panelFreq.style.display='none'; panelRel.style.display='none' }
  btnFreq.onclick = setActiveFreq
  btnRel.onclick = setActiveRel
  btnCaixa.onclick = setActiveCaixa
}

function renderCirculoOracaoScreen(schema, table) {
  const screens = el('screens')
  clear(screens)

  const status = document.createElement('div')
  status.className = 'status'
  screens.appendChild(status)
  let statusTimer = null
  function showStatus(text, type) {
    status.textContent = text
    status.classList.remove('success', 'error')
    if (type === 'success') status.classList.add('success')
    if (type === 'error') status.classList.add('error')
    status.style.display = 'block'
    if (statusTimer) clearTimeout(statusTimer)
    if (type !== 'error') statusTimer = setTimeout(() => { status.style.display = 'none' }, 2500)
  }

  const nm = normalizeText(table?.name)
  const ln = normalizeText(table?.label)
  if (!authState.userId || !authState.allowedNorm || !authState.allowedNorm.size || !(authState.allowedNorm.has(nm) || authState.allowedNorm.has(ln))) {
    showStatus('Sem permissão para acessar este módulo.', 'error')
    const card = document.createElement('section')
    card.className = 'card'
    const h = document.createElement('h2')
    h.textContent = table?.label || table?.name || 'Módulo'
    card.appendChild(h)
    screens.appendChild(card)
    return
  }

  const subtabs = document.createElement('div')
  subtabs.className = 'subtabs'
  const btnEnsaios = document.createElement('button')
  btnEnsaios.className = 'subtab active'
  btnEnsaios.textContent = 'Ensaios'
  subtabs.appendChild(btnEnsaios)
  screens.appendChild(subtabs)

  const panelEnsaios = document.createElement('div')
  screens.appendChild(panelEnsaios)

  const card = document.createElement('section')
  card.className = 'card'
  const h = document.createElement('h2')
  h.textContent = 'Círculo de Oração - Ensaios'
  card.appendChild(h)

  const wrap = document.createElement('div')
  wrap.className = 'ebd-wrap ebd-one-day'
  const tableEl = document.createElement('table')
  tableEl.className = 'ebd-table'
  wrap.appendChild(tableEl)
  card.appendChild(wrap)
  panelEnsaios.appendChild(card)

  const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
  function pad2(n) { return String(n).padStart(2, '0') }
  function isoDate(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` }
  function dateOnly(v) {
    const s = String(v ?? '').trim()
    if (!s) return ''
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
    return s
  }
  function getMondays(year) {
    const d = new Date(year, 0, 1)
    while (d.getDay() !== 1) d.setDate(d.getDate() + 1)
    const out = []
    while (d.getFullYear() === year) {
      out.push(new Date(d.getTime()))
      d.setDate(d.getDate() + 7)
    }
    return out
  }
  function pickKey(obj, keys) {
    for (const k of keys) if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return k
    return keys[0]
  }
  function guessLabelKey(obj) {
    const candidates = ['nome', 'descricao', 'name', 'titulo', 'label']
    for (const k of candidates) if (obj && Object.prototype.hasOwnProperty.call(obj, k) && typeof obj[k] === 'string') return k
    for (const k of Object.keys(obj || {})) if (typeof obj?.[k] === 'string') return k
    return 'nome'
  }
  function firstExistingKey(obj, keys) {
    for (const k of keys) if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return k
    return ''
  }
  function firstExistingValue(obj, keys) {
    for (const k of keys) if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return obj[k]
    return null
  }

  const year = new Date().getFullYear()
  const todayIso = isoDate(new Date())
  const mondays = getMondays(year).map(d => ({ d, iso: isoDate(d), month: d.getMonth(), day: d.getDate() }))
  const mondayIsosToDate = mondays.filter(x => x.iso <= todayIso).map(x => x.iso)
  const denomToDate = mondayIsosToDate.length

  const ENSAIOS_PRESENCA_TABLE_PRIMARY = 'ensaios_presenca'
  const ENSAIOS_PRESENCA_TABLE_FALLBACK = 'ebd_presenca_membros'
  let presencaTable = ENSAIOS_PRESENCA_TABLE_PRIMARY
  const ENSAIOS_VISITANTES_TABLE = 'ensaios_visitantes'
  const ENSAIOS_VISITANTES_PRESENCA_TABLE = 'ensaios_visitantes_presenca'
  const VISITANTES_LS_KEY = 'ieadm_ensaios_circulo_visitantes_v1'
  const VISITANTES_PRES_LS_KEY = 'ieadm_ensaios_circulo_visitantes_pres_v1'

  const GRUPOS_TABLE = 'grupos'
  const MEMBROS_GRUPO_TABLE = 'membros_grupo'
  const alvoGrupoNorm = normalizeText('circulo de oracao')

  const MEMBRO_KEYS = ['id_membro', 'membro_id', 'membros_id', 'idMembro', 'membro']
  const GRUPO_KEYS = ['id_grupo', 'grupo_id', 'grupos_id', 'idGrupo', 'grupo']
  const DATA_KEYS = ['data', 'dia', 'data_aula', 'data_evento', 'data_presenca', 'dataPresenca']

  let presencaMembrosMembroKey = 'id_membro'
  let presencaMembrosDataKey = 'data_presenca'
  const presSet = new Set()
  const VISITANTE_KEYS = ['id_visitante', 'visitante_id', 'visitantes_id', 'idVisitante', 'visitante', 'id']
  let presencaVisitantesVisitanteKey = 'id_visitante'
  let presencaVisitantesDataKey = 'data'
  let visitantesMode = 'local'
  let visitantesPresencaMode = 'local'
  let visitantes = []
  const visPresSet = new Set()

  function freqTextForMember(memberId) {
    if (!denomToDate) return '0,00%'
    let present = 0
    for (const iso of mondayIsosToDate) {
      if (presSet.has(`${memberId}|${iso}`)) present += 1
    }
    const pct = (present / denomToDate) * 100
    return `${pct.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
  }

  function freqTextForVisitor(visitorId) {
    if (!denomToDate) return '0,00%'
    let present = 0
    for (const iso of mondayIsosToDate) {
      if (visPresSet.has(`${visitorId}|${iso}`)) present += 1
    }
    const pct = (present / denomToDate) * 100
    return `${pct.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
  }

  function lsReadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return fallback
      return JSON.parse(raw)
    } catch {
      return fallback
    }
  }
  function lsWriteJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
  }
  function loadVisitantesLocal() {
    const list = lsReadJson(VISITANTES_LS_KEY, [])
    return (Array.isArray(list) ? list : [])
      .map(x => ({ id: String(x?.id ?? '').trim(), nome: String(x?.nome ?? '').trim() }))
      .filter(x => x.id && x.nome)
  }
  function saveVisitantesLocal(list) {
    lsWriteJson(VISITANTES_LS_KEY, Array.isArray(list) ? list : [])
  }
  function loadVisitantesPresLocal() {
    const arr = lsReadJson(VISITANTES_PRES_LS_KEY, [])
    return new Set((Array.isArray(arr) ? arr : []).map(x => String(x ?? '').trim()).filter(Boolean))
  }
  function saveVisitantesPresLocal() {
    lsWriteJson(VISITANTES_PRES_LS_KEY, Array.from(visPresSet))
  }

  function buildHeader() {
    const thead = document.createElement('thead')
    const rowMonth = document.createElement('tr')
    const rowDay = document.createElement('tr')

    const thNome = document.createElement('th')
    thNome.textContent = 'Nome'
    thNome.className = 'ebd-sticky ebd-sticky-1'
    thNome.rowSpan = 2

    const thFreq = document.createElement('th')
    thFreq.textContent = '%FREQ'
    thFreq.rowSpan = 2

    rowMonth.appendChild(thNome)

    let i = 0
    while (i < mondays.length) {
      const month = mondays[i].month
      let j = i
      while (j < mondays.length && mondays[j].month === month) j += 1
      const th = document.createElement('th')
      th.className = 'ebd-month-group'
      th.textContent = MONTHS[month]
      th.colSpan = j - i
      rowMonth.appendChild(th)
      i = j
    }
    rowMonth.appendChild(thFreq)

    mondays.forEach(s => {
      const th = document.createElement('th')
      th.textContent = String(s.day)
      th.className = 'ebd-day'
      th.dataset.iso = s.iso
      th.dataset.month = MONTHS[s.month]
      rowDay.appendChild(th)
    })
    thead.appendChild(rowMonth)
    thead.appendChild(rowDay)
    return thead
  }

  function applyStickyOffsets() {
    const headRow1 = tableEl.querySelector('thead tr')
    if (headRow1) {
      const h = Math.ceil(headRow1.getBoundingClientRect().height || 0)
      tableEl.style.setProperty('--ebd-head1', `${h}px`)
    }
  }

  function focusNearestDay() {
    let targetIso = ''
    for (let i = mondays.length - 1; i >= 0; i--) {
      if (mondays[i].iso <= todayIso) { targetIso = mondays[i].iso; break }
    }
    if (!targetIso && mondays.length) targetIso = mondays[0].iso
    if (!targetIso) return
    const th = tableEl.querySelector(`thead tr:last-child th[data-iso="${targetIso}"]`)
    if (!th) return
    try { th.scrollIntoView({ block: 'nearest', inline: 'center' }) } catch {}
  }

  const visitantesField = document.createElement('div')
  visitantesField.className = 'field'
  const visitantesLabel = document.createElement('label')
  visitantesLabel.textContent = 'Adicionar visitante'
  visitantesField.appendChild(visitantesLabel)
  const visitantesActions = document.createElement('div')
  visitantesActions.className = 'actions'
  const iVisitante = document.createElement('input')
  iVisitante.placeholder = 'Nome do visitante'
  iVisitante.style.flex = '1 1 auto'
  const btnAddVisitante = document.createElement('button')
  btnAddVisitante.type = 'button'
  btnAddVisitante.textContent = 'Adicionar'
  visitantesActions.appendChild(iVisitante)
  visitantesActions.appendChild(btnAddVisitante)
  visitantesField.appendChild(visitantesActions)
  card.appendChild(visitantesField)

  async function load() {
    showStatus('Carregando...', 'success')
    btnAddVisitante.disabled = true

    let grupoId = ''
    try {
      const rows = await apiList(GRUPOS_TABLE)
      const grupos = Array.isArray(rows) ? rows : []
      const sample = grupos[0] || {}
      const gruposIdKey = pickKey(sample, ['id', 'grupo_id', 'codigo'])
      const gruposLabelKey = guessLabelKey(sample)
      const found = grupos.find(g => normalizeText(String(g?.[gruposLabelKey] ?? '')) === alvoGrupoNorm)
      grupoId = found ? String(found?.[gruposIdKey] ?? '').trim() : ''
      if (!grupoId) {
        showStatus('Grupo "Círculo de Oração" não encontrado em "grupos".', 'error')
      }
    } catch (e) {
      showStatus(String(e?.message || e), 'error')
    }

    const membrosPermitidos = new Set()
    if (grupoId) {
      try {
        const rows = await apiGet(MEMBROS_GRUPO_TABLE, { select: '*' })
        const list = Array.isArray(rows) ? rows : []
        const sample = list[0] || {}
        const membroKey = firstExistingKey(sample, MEMBRO_KEYS) || 'id_membro'
        const grupoKey = firstExistingKey(sample, GRUPO_KEYS) || 'id_grupo'
        list.forEach(r => {
          const gid = String(r?.[grupoKey] ?? '').trim()
          if (!gid || gid !== grupoId) return
          const mid = String(r?.[membroKey] ?? '').trim()
          if (mid) membrosPermitidos.add(mid)
        })
      } catch (e) {
        showStatus(String(e?.message || e), 'error')
      }
    }

    let membros = []
    try {
      const rows = await apiGet('membros', { select: 'id,nome' })
      membros = (Array.isArray(rows) ? rows : [])
        .map(r => ({ id: String(r?.id ?? '').trim(), nome: String(r?.nome ?? '').trim() }))
        .filter(x => x.id && x.nome && (!membrosPermitidos.size || membrosPermitidos.has(x.id)))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
    } catch (e) {
      showStatus(String(e?.message || e), 'error')
      membros = []
    }

    presSet.clear()
    async function loadPresenca(tableName) {
      const rows = await apiGet(tableName, { select: '*' })
      const list = Array.isArray(rows) ? rows : []
      list.forEach(r => {
        const midVal = firstExistingValue(r, MEMBRO_KEYS)
        const dtVal = firstExistingValue(r, DATA_KEYS)
        const mid = midVal === null ? '' : String(midVal).trim()
        const dt = dateOnly(dtVal === null ? '' : String(dtVal).trim())
        if (!mid || !dt) return
        if (!dt.startsWith(`${year}-`)) return
        if (!membrosPermitidos.size || membrosPermitidos.has(mid)) presSet.add(`${mid}|${dt}`)
        const mk = firstExistingKey(r, MEMBRO_KEYS)
        const dk = firstExistingKey(r, DATA_KEYS)
        if (mk) presencaMembrosMembroKey = mk
        if (dk) presencaMembrosDataKey = dk
      })
    }
    try {
      await loadPresenca(ENSAIOS_PRESENCA_TABLE_PRIMARY)
      presencaTable = ENSAIOS_PRESENCA_TABLE_PRIMARY
    } catch (e) {
      const msg = String(e?.message || e || '')
      if (msg.includes('Could not find') || msg.includes('relation') || msg.includes('404')) {
        try {
          await loadPresenca(ENSAIOS_PRESENCA_TABLE_FALLBACK)
          presencaTable = ENSAIOS_PRESENCA_TABLE_FALLBACK
        } catch (e2) {
          presSet.clear()
          showStatus(String(e2?.message || e2), 'error')
        }
      } else {
        presSet.clear()
        showStatus(String(e?.message || e), 'error')
      }
    }

    visitantes = []
    visPresSet.clear()
    visitantesMode = 'local'
    visitantesPresencaMode = 'local'
    try {
      const rows = await apiGet(ENSAIOS_VISITANTES_TABLE, { select: '*' })
      const list = Array.isArray(rows) ? rows : []
      const sample = list[0] || {}
      const idKey = firstExistingKey(sample, ['id', 'visitante_id', 'id_visitante']) || 'id'
      const nomeKey = guessLabelKey(sample)
      visitantes = list
        .map(r => ({ id: String(r?.[idKey] ?? '').trim(), nome: String(r?.[nomeKey] ?? '').trim() }))
        .filter(x => x.id && x.nome)
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
      visitantesMode = 'db'
    } catch (e) {
      const msg = String(e?.message || e || '')
      if (msg.includes('Could not find') || msg.includes('relation') || msg.includes('404')) {
        visitantes = loadVisitantesLocal()
      } else {
        visitantes = loadVisitantesLocal()
      }
    }
    try {
      if (visitantesMode === 'db') {
        const rows = await apiGet(ENSAIOS_VISITANTES_PRESENCA_TABLE, { select: '*' })
        const list = Array.isArray(rows) ? rows : []
        list.forEach(r => {
          const vidVal = firstExistingValue(r, VISITANTE_KEYS)
          const dtVal = firstExistingValue(r, DATA_KEYS)
          const vid = vidVal === null ? '' : String(vidVal).trim()
          const dt = dateOnly(dtVal === null ? '' : String(dtVal).trim())
          if (!vid || !dt) return
          if (!dt.startsWith(`${year}-`)) return
          visPresSet.add(`${vid}|${dt}`)
          const vk = firstExistingKey(r, VISITANTE_KEYS)
          const dk = firstExistingKey(r, DATA_KEYS)
          if (vk) presencaVisitantesVisitanteKey = vk
          if (dk) presencaVisitantesDataKey = dk
        })
        visitantesPresencaMode = 'db'
      } else {
        const set = loadVisitantesPresLocal()
        set.forEach(k => {
          const parts = String(k || '').split('|')
          if (parts.length !== 2) return
          const dt = dateOnly(parts[1])
          if (!dt.startsWith(`${year}-`)) return
          visPresSet.add(`${parts[0]}|${dt}`)
        })
        visitantesPresencaMode = 'local'
      }
    } catch (e) {
      const msg = String(e?.message || e || '')
      if (msg.includes('Could not find') || msg.includes('relation') || msg.includes('404')) {
        const set = loadVisitantesPresLocal()
        set.forEach(k => {
          const parts = String(k || '').split('|')
          if (parts.length !== 2) return
          const dt = dateOnly(parts[1])
          if (!dt.startsWith(`${year}-`)) return
          visPresSet.add(`${parts[0]}|${dt}`)
        })
        visitantesPresencaMode = 'local'
      } else {
        visitantesPresencaMode = 'local'
      }
    }

    tableEl.innerHTML = ''
    tableEl.appendChild(buildHeader())
    const tbody = document.createElement('tbody')
    const frag = document.createDocumentFragment()
    const freqCells = new Map()
    const freqCellsVisitantes = new Map()

    membros.forEach(m => {
      const tr = document.createElement('tr')

      const tdNome = document.createElement('td')
      tdNome.textContent = m.nome
      tdNome.className = 'ebd-sticky ebd-sticky-1'
      tr.appendChild(tdNome)

      mondays.forEach(s => {
        const td = document.createElement('td')
        td.className = 'ebd-cell'
        const k = `${m.id}|${s.iso}`
        const present = presSet.has(k)
        if (present) {
          td.textContent = 'P'
          td.classList.add('present')
        } else {
          td.textContent = ''
        }
        td.onclick = async () => {
          const membroVal = /^\d+$/.test(String(m.id)) ? Number(m.id) : m.id
          const wasPresent = presSet.has(k)
          if (wasPresent) {
            presSet.delete(k)
            td.textContent = ''
            td.classList.remove('present')
          } else {
            presSet.add(k)
            td.textContent = 'P'
            td.classList.add('present')
          }
          const fc0 = freqCells.get(m.id)
          if (fc0) fc0.textContent = freqTextForMember(m.id)
          try {
            if (wasPresent) {
              await tryDeleteWhere(presencaTable, DATA_KEYS.flatMap(dk => MEMBRO_KEYS.map(mk => ({ [mk]: `eq.${m.id}`, [dk]: `eq.${s.iso}` }))))
            } else {
              const payloads = []
              payloads.push({ [presencaMembrosMembroKey]: membroVal, [presencaMembrosDataKey]: s.iso })
              MEMBRO_KEYS.forEach(mk => DATA_KEYS.forEach(dk => payloads.push({ [mk]: membroVal, [dk]: s.iso })))
              await tryCreateOne(presencaTable, payloads)
            }
            const fc = freqCells.get(m.id)
            if (fc) fc.textContent = freqTextForMember(m.id)
          } catch (e) {
            showStatus(String(e?.message || e), 'error')
            if (wasPresent) {
              presSet.add(k)
              td.textContent = 'P'
              td.classList.add('present')
            } else {
              presSet.delete(k)
              td.textContent = ''
              td.classList.remove('present')
            }
            const fc = freqCells.get(m.id)
            if (fc) fc.textContent = freqTextForMember(m.id)
          }
        }
        tr.appendChild(td)
      })

      const tdFreq = document.createElement('td')
      tdFreq.textContent = freqTextForMember(m.id)
      tdFreq.className = 'ebd-freq'
      tr.appendChild(tdFreq)
      freqCells.set(m.id, tdFreq)

      frag.appendChild(tr)
    })

    const trGroup = document.createElement('tr')
    trGroup.className = 'ebd-group'
    const tdGroup = document.createElement('td')
    tdGroup.textContent = 'Visitantes'
    tdGroup.className = 'ebd-sticky ebd-sticky-1'
    trGroup.appendChild(tdGroup)
    const tdGroupRest = document.createElement('td')
    tdGroupRest.colSpan = mondays.length + 1
    tdGroupRest.textContent = ''
    trGroup.appendChild(tdGroupRest)
    frag.appendChild(trGroup)

    visitantes.forEach(v => {
      const tr = document.createElement('tr')

      const tdNome = document.createElement('td')
      tdNome.textContent = v.nome
      tdNome.className = 'ebd-sticky ebd-sticky-1'
      tr.appendChild(tdNome)

      mondays.forEach(s => {
        const td = document.createElement('td')
        td.className = 'ebd-cell'
        const k = `${v.id}|${s.iso}`
        const present = visPresSet.has(k)
        if (present) {
          td.textContent = 'P'
          td.classList.add('present')
        } else {
          td.textContent = ''
        }
        td.onclick = async () => {
          const visitanteVal = /^\d+$/.test(String(v.id)) ? Number(v.id) : v.id
          const wasPresent = visPresSet.has(k)
          if (wasPresent) {
            visPresSet.delete(k)
            td.textContent = ''
            td.classList.remove('present')
          } else {
            visPresSet.add(k)
            td.textContent = 'P'
            td.classList.add('present')
          }
          const fc0 = freqCellsVisitantes.get(v.id)
          if (fc0) fc0.textContent = freqTextForVisitor(v.id)
          try {
            if (visitantesMode === 'db' && visitantesPresencaMode === 'db') {
              if (wasPresent) {
                await tryDeleteWhere(ENSAIOS_VISITANTES_PRESENCA_TABLE, DATA_KEYS.flatMap(dk => VISITANTE_KEYS.map(vk => ({ [vk]: `eq.${v.id}`, [dk]: `eq.${s.iso}` }))))
              } else {
                const payloads = []
                payloads.push({ [presencaVisitantesVisitanteKey]: visitanteVal, [presencaVisitantesDataKey]: s.iso })
                VISITANTE_KEYS.forEach(vk => DATA_KEYS.forEach(dk => payloads.push({ [vk]: visitanteVal, [dk]: s.iso })))
                await tryCreateOne(ENSAIOS_VISITANTES_PRESENCA_TABLE, payloads)
              }
            } else {
              saveVisitantesPresLocal()
            }
            const fc = freqCellsVisitantes.get(v.id)
            if (fc) fc.textContent = freqTextForVisitor(v.id)
          } catch (e) {
            showStatus(String(e?.message || e), 'error')
            if (wasPresent) {
              visPresSet.add(k)
              td.textContent = 'P'
              td.classList.add('present')
            } else {
              visPresSet.delete(k)
              td.textContent = ''
              td.classList.remove('present')
            }
            const fc = freqCellsVisitantes.get(v.id)
            if (fc) fc.textContent = freqTextForVisitor(v.id)
          }
        }
        tr.appendChild(td)
      })

      const tdFreq = document.createElement('td')
      tdFreq.textContent = freqTextForVisitor(v.id)
      tdFreq.className = 'ebd-freq'
      tr.appendChild(tdFreq)
      freqCellsVisitantes.set(v.id, tdFreq)

      frag.appendChild(tr)
    })
    tbody.appendChild(frag)
    tableEl.appendChild(tbody)
    applyStickyOffsets()
    focusNearestDay()
    showStatus('Pronto.', 'success')
    btnAddVisitante.disabled = false
  }

  async function addVisitante() {
    const nome = String(iVisitante.value || '').trim()
    if (!nome) return
    const nmNorm = normalizeText(nome)
    const has = (Array.isArray(visitantes) ? visitantes : []).some(v => normalizeText(String(v?.nome || '')) === nmNorm)
    if (has) {
      iVisitante.value = ''
      return
    }
    btnAddVisitante.disabled = true
    try {
      if (visitantesMode === 'db') {
        await tryCreateOne(ENSAIOS_VISITANTES_TABLE, [{ nome }, { name: nome }, { descricao: nome }, { visitante: nome }])
      } else {
        const list = loadVisitantesLocal()
        const id = `v_${Date.now()}_${Math.random().toString(16).slice(2)}`
        list.push({ id, nome })
        saveVisitantesLocal(list)
      }
      iVisitante.value = ''
      await load()
    } catch (e) {
      showStatus(String(e?.message || e), 'error')
      btnAddVisitante.disabled = false
    }
  }

  btnAddVisitante.onclick = () => { addVisitante().catch(e => showStatus(String(e?.message || e), 'error')) }
  iVisitante.onkeydown = (ev) => {
    if (ev.key !== 'Enter') return
    try { ev.preventDefault() } catch {}
    addVisitante().catch(e => showStatus(String(e?.message || e), 'error'))
  }

  window.addEventListener('resize', () => {
    applyStickyOffsets()
  })
  load().catch(e => showStatus(String(e?.message || e), 'error'))
}


let current = null
let schemaCache = null
function activateTab(name, opts) {
  const all = Array.isArray(schemaCache?.tables) ? schemaCache.tables : []
  const visible = (!LOGIN_ENABLED
    ? all.filter(t => normalizeText(t?.name) !== 'login')
    : all.filter(t => {
      const nm = normalizeText(t?.name)
      if (nm === 'login') return true
      if (!authState.userId) return false
      if (!authState.allowedNorm || !authState.allowedNorm.size) return false
      const ln = normalizeText(t?.label)
      return authState.allowedNorm.has(nm) || authState.allowedNorm.has(ln)
    }))
  let chosen = visible.find(x => x.name === name) || visible[0]
  if (!chosen && normalizeText(name) === 'login') {
    chosen = { name: 'login', label: 'Login', pk: 'id', fields: [] }
  }
  if (!chosen) return
  current = chosen.name
  document.querySelectorAll('.tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.name === current)
  })
  renderTableScreen(schemaCache, chosen)
  if (!opts || opts.route !== false) {
    __pushRoute({ page: 'tab', tab: chosen.name }, !!opts?.replace)
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const h1 = document.querySelector('.app-header h1')
    if (h1) {
      h1.textContent = 'IEADM-ITAPEVA'
      h1.style.cursor = 'pointer'
      h1.setAttribute('role', 'button')
      h1.tabIndex = 0
      h1.onclick = () => {
        navigateHome()
      }
      h1.onkeydown = (ev) => {
        if (ev.key !== 'Enter' && ev.key !== ' ') return
        try { ev.preventDefault() } catch {}
        navigateHome()
      }
    }
    const header = document.querySelector('.app-header')
    if (header && !header.querySelector('.header-actions')) {
      const right = document.createElement('div')
      right.className = 'header-actions'
      const btnLogin = document.createElement('button')
      btnLogin.type = 'button'
      btnLogin.title = 'Login'
      btnLogin.setAttribute('aria-label', 'Login')
      btnLogin.className = 'icon-btn'
      setButtonIcon(btnLogin, 'user')
      btnLogin.onclick = () => activateTab('login')
      right.appendChild(btnLogin)
      header.appendChild(right)
    }
    const btnToggleMenu = document.getElementById('btnToggleMenu')
    if (btnToggleMenu) {
      setButtonIcon(btnToggleMenu, 'menu')
      let collapsed = false
      try { collapsed = localStorage.getItem(MENU_COLLAPSED_KEY) === '1' } catch {}
      try { document.body.classList.toggle('menu-collapsed', collapsed) } catch {}
      btnToggleMenu.onclick = () => {
        const next = !document.body.classList.contains('menu-collapsed')
        setMenuCollapsed(next)
      }
    }
    document.title = 'IEADM-ITAPEVA'
    document.documentElement.dataset.build = APP_BUILD
    console.log('APP_BUILD', APP_BUILD)
  } catch {}
  try {
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/sw.js')
    }
  } catch {}
  if (LOGIN_ENABLED) loadAuth()
  else clearAuth()
  schemaCache = await loadSchema()
  renderTabs(schemaCache)
  const hasHash = !!String(location.hash || '').trim() && String(location.hash || '').trim() !== '#'
  if (hasHash) {
    const r = (history.state && typeof history.state === 'object') ? history.state : __parseRouteFromHash()
    try { history.replaceState(r, '', __routeToHash(r)) } catch {}
    await __applyRoute(r)
    __routeInitDone = true
    return
  }
  if (!LOGIN_ENABLED) {
    const all = Array.isArray(schemaCache?.tables) ? schemaCache.tables : []
    const visible = all.filter(t => normalizeText(t?.name) !== 'login')
    const first = visible[0]
    if (first) activateTab(first.name, { replace: true })
    __routeInitDone = true
    return
  }
  if (!authState.userId) {
    activateTab('login', { replace: true })
    __routeInitDone = true
    return
  }
  navigateHome({ replace: true })
  __routeInitDone = true
})
