const SUPABASE_URL = 'https://xytuuccwylwbefgkqxlr.supabase.co'
const API_KEY = 'sb_publishable_kmvt5bwvVonTji9qWqgjKg_r8oKsCRs'
const PROXY_BASE = '/api/rest'
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
  return res.json()
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

const ICONS = { edit: iconEdit, trash: iconTrash, save: iconSave }
const APP_BUILD = '2026-03-23-27'

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
    field1.appendChild(label1)
    field1.appendChild(input1)

    const field2 = document.createElement('div')
    field2.className = 'field'
    const label2 = document.createElement('label')
    label2.textContent = 'Confirmar senha'
    const input2 = document.createElement('input')
    input2.type = 'password'
    field2.appendChild(label2)
    field2.appendChild(input2)

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

    __passwordModalEls = { backdrop, input1, input2, err, btnCancel, btnOk, resolve: null, keyHandler: null }

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
  const tables = (!LOGIN_ENABLED
    ? allTables.filter(t => normalizeText(t?.name) !== 'login')
    : allTables.filter(t => {
    const nm = normalizeText(t?.name)
    if (nm === 'login') return true
    if (!authState.userId) return false
    if (!authState.allowedNorm || !authState.allowedNorm.size) return false
    const ln = normalizeText(t?.label)
    return authState.allowedNorm.has(nm) || authState.allowedNorm.has(ln)
  }))
  tables.forEach((t) => {
    const b = document.createElement('button')
    b.className = 'tab'
    b.textContent = t.label || t.name
    b.dataset.name = t.name
    b.onclick = () => activateTab(t.name)
    tabs.appendChild(b)
  })
}

function clear(node) { while (node.firstChild) node.removeChild(node.firstChild) }

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
  hList.textContent = 'Lista de membros'
  const filtersWrap = document.createElement('div')
  filtersWrap.className = 'filters'
  const listWrap = document.createElement('div')
  listWrap.className = 'list-items'
  let filtroNomeInput = null
  let filtroDataNascInput = null
  let filtroGruposField = null
  let filtroCargosInternosField = null
  let filtroMesesField = null
  let membrosGrupoIndex = null
  let membrosGrupoIndexError = null
  let membrosCargosInternosIndex = null
  let membrosCargosInternosIndexError = null

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
    listWrap.innerHTML = ''
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
      filtered.forEach(item => {
        const div = document.createElement('div')
        div.className = 'list-item'
        const title = document.createElement('div'); title.className = 'title'; title.textContent = item.nome || (item.matricula || '')
        title.style.cursor = 'pointer'
        title.onclick = async () => {
          await fillCadastro(item)
          setActiveCadastro()
        }
        const actionsDiv = document.createElement('div'); actionsDiv.className = 'grid-actions'
        const btnDelete = document.createElement('button'); btnDelete.type = 'button'; btnDelete.title = 'Excluir'; btnDelete.setAttribute('aria-label', 'Excluir'); btnDelete.className = 'danger icon-btn'; setButtonIcon(btnDelete, 'trash')
        btnDelete.onclick = async (ev) => {
          try { ev?.stopPropagation?.() } catch {}
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
            refreshList()
          } catch (e) {
            showStatus(String(e.message || e), 'error')
          }
        }
        actionsDiv.appendChild(btnDelete)
        div.appendChild(title)
        div.appendChild(actionsDiv)
        listWrap.appendChild(div)
      })
    } catch (e) {
      listWrap.textContent = String(e.message || e)
    }
  }
  cardList.appendChild(hList)
  cardList.appendChild(filtersWrap)
  cardList.appendChild(listWrap)
  panelConsulta.appendChild(cardList)

  const panelCadastro = document.createElement('div')
  const cardCad = document.createElement('section')
  cardCad.className = 'card'
  const hCad = document.createElement('h2')
  hCad.textContent = 'Cadastro de membro'
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
  const membrosCargosInternosMembroKey = 'id_membro'
  const membrosCargosInternosCargoKey = 'id_cargos_internos'
  const membrosCargosInternosGrupoKey = 'id_grupo'
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

  async function loadSelectedCargosInternosForMember(memberId) {
    await ensureGruposLoaded()
    await ensureCargosInternosLoaded()
    if (!memberId) {
      cargosInternosUI.forEach(ui => {
        ui.cb.checked = false
        if (ui.porGrupo && ui.gruposPorCargoField) ui.gruposPorCargoField.setSelected([])
      })
      return
    }
    const rows = await apiGet(MEMBROS_CARGOS_INTERNOS_TABLE, {
      select: `${membrosCargosInternosCargoKey},${membrosCargosInternosGrupoKey}`,
      [membrosCargosInternosMembroKey]: `eq.${memberId}`
    })
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
          [membrosCargosInternosCargoKey]: /^\d+$/.test(String(cid)) ? Number(cid) : cid
        })
      }
    })
    const existingRows = await apiGet(MEMBROS_CARGOS_INTERNOS_TABLE, {
      select: `${membrosCargosInternosMembroKey},${membrosCargosInternosCargoKey},${membrosCargosInternosGrupoKey}`,
      [membrosCargosInternosMembroKey]: `eq.${memberId}`
    })
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
  let cadastroEditMode = true
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
    btnAlterar.style.display = !cadastroEditMode && hasId ? '' : 'none'
    btnSalvar.disabled = !cadastroEditMode && hasId
  }

  btnAlterar.onclick = () => {
    setCadastroMode(true)
    const first = form.querySelector('input:not([type="hidden"]),select,textarea')
    if (first && typeof first.focus === 'function') first.focus()
  }
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
    refreshList()
  }
  function setActiveCadastro() {
    btnCadastro.classList.add('active'); btnConsulta.classList.remove('active')
    panelCadastro.style.display = ''; panelConsulta.style.display = 'none'
    setCadastroMode(!idInput.value.trim())
    loadSelectedGruposForMember(idInput.value.trim()).catch(() => {})
    loadSelectedCargosInternosForMember(idInput.value.trim()).catch(() => {})
  }
  btnConsulta.onclick = setActiveConsulta
  btnCadastro.onclick = setActiveCadastro
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
    const tabs = Array.from(document.querySelectorAll('.tab'))
    const firstNonLogin = tabs.find(t => normalizeText(t?.dataset?.name) !== 'login')
    const name = String((firstNonLogin || tabs[0])?.dataset?.name ?? '').trim()
    if (name) activateTab(name)
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
    const storedPass = passKey ? String(row?.[passKey] ?? '').trim() : ''
    if (!userId) throw new Error('ID do usuário não encontrado.')
    if (!storedPass) throw new Error('Senha do usuário não configurada.')

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
      for (const p of payloads) {
        try {
          await apiUpdate('usuarios', pkKey, userId, p)
          updated = true
          break
        } catch (e) {
          const msg = String(e?.message || e || '')
          if (msg.includes('Could not find') || msg.includes('column') || msg.includes('unknown')) continue
          throw e
        }
      }
      if (!updated) throw new Error('Não foi possível atualizar a senha do usuário.')
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
      const m = modulos.find(x => String(x?.[modulosIdKey] ?? '').trim() === mid)
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
    label.textContent = 'Usuário logado'
    const v = document.createElement('div')
    v.textContent = authState.usuario || authState.userId
    info.appendChild(label)
    info.appendChild(v)
    const actions = document.createElement('div')
    actions.className = 'actions'
    const btnLogout = document.createElement('button')
    btnLogout.type = 'button'
    btnLogout.className = 'danger'
    btnLogout.textContent = 'Sair'
    btnLogout.onclick = async () => {
      clearAuth()
      renderTabs(schemaCache)
      activateTab('login')
    }
    actions.appendChild(btnLogout)
    card.appendChild(info)
    card.appendChild(actions)
    screens.appendChild(card)
    return
  }

  const form = document.createElement('div')
  const fUser = document.createElement('div')
  fUser.className = 'field'
  const lUser = document.createElement('label')
  lUser.textContent = 'Usuário'
  const iUser = document.createElement('input')
  iUser.type = 'text'
  fUser.appendChild(lUser)
  fUser.appendChild(iUser)

  const fPass = document.createElement('div')
  fPass.className = 'field'
  const lPass = document.createElement('label')
  lPass.textContent = 'Senha'
  const iPass = document.createElement('input')
  iPass.type = 'password'
  fPass.appendChild(lPass)
  fPass.appendChild(iPass)

  form.appendChild(fUser)
  form.appendChild(fPass)
  card.appendChild(form)

  const actions = document.createElement('div')
  actions.className = 'actions'
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.textContent = 'Entrar'
  btn.onclick = async () => {
    const login = String(iUser.value ?? '').trim()
    const pass = String(iPass.value ?? '')
    if (!login || !pass) { showStatus('Informe usuário e senha.', 'error'); return }
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
  hCad.textContent = 'Cadastro de usuário'
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
  fUsuario.appendChild(lUsuario)
  fUsuario.appendChild(iUsuario)
  cardCad.appendChild(fUsuario)

  const modsField = createChecklistField('Módulos')
  cardCad.appendChild(modsField.wrap)

  const actions = document.createElement('div')
  actions.className = 'actions'
  const btnNovo = document.createElement('button')
  btnNovo.type = 'button'
  btnNovo.className = 'btn-secondary'
  btnNovo.textContent = 'Novo'
  const btnSalvar = document.createElement('button')
  btnSalvar.type = 'button'
  btnSalvar.textContent = 'Salvar'
  actions.appendChild(btnNovo)
  actions.appendChild(btnSalvar)
  cardCad.appendChild(actions)
  panelCadastro.appendChild(cardCad)

  function setActiveLista() {
    btnLista.classList.add('active')
    btnCadastro.classList.remove('active')
    panelLista.style.display = ''
    panelCadastro.style.display = 'none'
    refreshList().catch(e => showStatus(String(e?.message || e), 'error'))
  }
  function setActiveCadastro() {
    btnCadastro.classList.add('active')
    btnLista.classList.remove('active')
    panelCadastro.style.display = ''
    panelLista.style.display = 'none'
  }
  btnLista.onclick = setActiveLista
  btnCadastro.onclick = setActiveCadastro

  btnNovo.onclick = () => {
    idInput.value = ''
    sMembro.value = ''
    iUsuario.value = ''
    modsField.state.selected = new Set()
    modsField.setOptions(modulosCache.map(m => ({ value: String(m?.[modulosIdKey] ?? ''), label: String(m?.[modulosLabelKey] ?? m?.[modulosIdKey] ?? '') })).filter(x => x.value))
    setActiveCadastro()
  }

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
    iUsuario.value = String(userRow?.[usuariosLoginKey] ?? '').trim()
    const pk = firstExistingKey(userRow, PASS_KEYS)
    if (pk) usuariosPassKey = pk
    const mid = String(sMembro.value ?? '').trim()
    const selected = mid ? await loadUserModuleIds(mid) : []
    modsField.state.selected = new Set(selected)
    const opts = modulosCache.map(m => ({ value: String(m?.[modulosIdKey] ?? ''), label: String(m?.[modulosLabelKey] ?? m?.[modulosIdKey] ?? '') })).filter(x => x.value)
    modsField.setOptions(opts)
    setActiveCadastro()
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
    const id = String(idInput.value ?? '').trim()
    const membroId = String(sMembro.value ?? '').trim()
    const login = String(iUsuario.value ?? '').trim()
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
        const passHash = await hashPasswordPbkdf2(DEFAULT_PASSWORD)
        membroKeys.forEach(mk => {
          loginKeys.forEach(lk => {
            passKeys.forEach(pk => userPayloads.push({ [mk]: membroVal, [lk]: login, [pk]: passHash }))
          })
        })
        const created = await tryCreateOne(USERS_TABLE, userPayloads)
        userId = String(created?.[usuariosPkKey] ?? created?.id ?? '').trim()
        if (!userId) throw new Error('Não foi possível identificar o usuário criado.')
      } else {
        const payloads = []
        membroKeys.forEach(mk => loginKeys.forEach(lk => payloads.push({ [mk]: membroVal, [lk]: login })))
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

      showStatus(id ? 'Alterações salvas.' : 'Usuário criado com senha padrão 12345.', 'success')
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

  const card = document.createElement('section')
  card.className = 'card'
  const h = document.createElement('h2')
  h.textContent = 'EBD - 2026'
  card.appendChild(h)

  const wrap = document.createElement('div')
  wrap.className = 'ebd-wrap'
  const tableEl = document.createElement('table')
  tableEl.className = 'ebd-table'
  wrap.appendChild(tableEl)
  card.appendChild(wrap)
  screens.appendChild(card)

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
  let turmasCache = []
  let turmasIdKey = 'id'
  let turmasLabelKey = 'nome'
  let turmasMembrosMembroKey = 'id_membro'
  let turmasMembrosTurmaKey = 'id_turma'
  let presencaMembrosMembroKey = 'id_membro'
  let presencaMembrosDataKey = 'data'
  const turmasByMembro = new Map()
  const presSet = new Set()

  const MEMBRO_KEYS = ['id_membro', 'membro_id', 'membros_id', 'idMembro', 'id_aluno', 'aluno_id', 'idAluno', 'membro']
  const TURMA_KEYS = ['id_turma', 'turma_id', 'turmas_id', 'idTurma', 'ebd_turma_id', 'id_ebd_turma', 'ebdTurmaId', 'turma']
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
      th.textContent = MONTHS[month]
      th.colSpan = j - i
      rowMonth.appendChild(th)
      i = j
    }
    rowMonth.appendChild(thFreq)

    sundays.forEach(s => {
      const th = document.createElement('th')
      th.textContent = String(s.day)
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
    showStatus('Pronto.', 'success')
  }

  window.addEventListener('resize', applyStickyOffsets)
  load().catch(e => showStatus(String(e?.message || e), 'error'))
}


let current = null
let schemaCache = null
function activateTab(name) {
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
  const chosen = visible.find(x => x.name === name) || visible[0]
  if (!chosen) return
  current = chosen.name
  document.querySelectorAll('.tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.name === current)
  })
  renderTableScreen(schemaCache, chosen)
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const h1 = document.querySelector('.app-header h1')
    if (h1) h1.textContent = 'IEADM-ITAPEVA'
    document.title = 'IEADM-ITAPEVA'
    document.documentElement.dataset.build = APP_BUILD
    console.log('APP_BUILD', APP_BUILD)
  } catch {}
  if (LOGIN_ENABLED) loadAuth()
  else clearAuth()
  schemaCache = await loadSchema()
  renderTabs(schemaCache)
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
  const first = visible[0]
  if (first) activateTab(first.name)
})
