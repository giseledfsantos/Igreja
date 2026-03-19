const SUPABASE_URL = 'https://xytuuccwylwbefgkqxlr.supabase.co'
const API_KEY = 'sb_publishable_kmvt5bwvVonTji9qWqgjKg_r8oKsCRs'

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

async function apiList(table) {
  const res = await fetch(`/api/rest/${encodeURIComponent(table)}?select=*`, { headers: headers() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
async function apiGet(table, params) {
  const qs = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    qs.set(k, String(v))
  })
  const res = await fetch(`/api/rest/${encodeURIComponent(table)}?${qs.toString()}`, { headers: headers() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
async function apiCreate(table, payload) {
  const res = await fetch(`/api/rest/${encodeURIComponent(table)}`, { method: 'POST', headers: headers(), body: JSON.stringify(payload) })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
async function apiUpdate(table, pk, id, payload) {
  const res = await fetch(`/api/rest/${encodeURIComponent(table)}?pk=${encodeURIComponent(pk)}&id=${encodeURIComponent(id)}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(payload) })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
async function apiDelete(table, pk, id) {
  const res = await fetch(`/api/rest/${encodeURIComponent(table)}?pk=${encodeURIComponent(pk)}&id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: headers() })
  if (!res.ok) throw new Error(await res.text())
}
async function apiDeleteWhere(table, params) {
  const qs = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    qs.set(k, String(v))
  })
  const q = qs.toString()
  if (!q) throw new Error('DELETE requires filters')
  const res = await fetch(`/api/rest/${encodeURIComponent(table)}?${q}`, { method: 'DELETE', headers: headers() })
  if (!res.ok) throw new Error(await res.text())
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

function setButtonIcon(button, name) {
  const factory = ICONS[name]
  if (!factory) return
  while (button.firstChild) button.removeChild(button.firstChild)
  button.appendChild(factory())
}

async function loadSchema() {
  let configured = { tables: [] }
  try {
    const resCfg = await fetch('/schema.json?v=2026-03-19-1')
    if (resCfg.ok) configured = await resCfg.json()
  } catch {}
  return configured
}

function renderTabs(schema) {
  const tabs = el('tabs')
  tabs.innerHTML = ''
  schema.tables.forEach((t, i) => {
    const b = document.createElement('button')
    b.className = 'tab' + (i === 0 ? ' active' : '')
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
  if (String(table.name).toLowerCase() === 'membros') {
    return renderMembersScreen(schema, table)
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
    status.style.display = ''
    if (statusTimer) clearTimeout(statusTimer)
    if (type !== 'error') statusTimer = setTimeout(() => { status.style.display = 'none' }, 2500)
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
  let filtroMesesField = null
  let membrosGrupoIndex = null
  let membrosGrupoIndexError = null

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
  async function refreshList() {
    listWrap.innerHTML = ''
    try {
      const data = await apiList(table.name)
      const nomeQ = filtroNomeInput ? normText(filtroNomeInput.value) : ''
      const dataNascQ = filtroDataNascInput ? String(filtroDataNascInput.value || '') : ''
      const mesesQ = new Set(filtroMesesField ? filtroMesesField.getSelected().map(x => String(x)) : [])
      const gruposQ = new Set(filtroGruposField ? filtroGruposField.getSelected().map(x => String(x)) : [])
      if (gruposQ.size) await ensureMembrosGrupoIndexLoaded()
      if (gruposQ.size && membrosGrupoIndexError) {
        showStatus('Sem permissão para filtrar por grupo (RLS em "membros_grupo").', 'error')
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
        const actionsDiv = document.createElement('div'); actionsDiv.className = 'grid-actions'
        const btnEdit = document.createElement('button'); btnEdit.title = 'Alterar'; btnEdit.setAttribute('aria-label', 'Alterar'); btnEdit.className = 'icon-btn'; setButtonIcon(btnEdit, 'edit')
        btnEdit.onclick = async () => {
          await fillCadastro(item)
          setActiveCadastro()
        }
        const btnDelete = document.createElement('button'); btnDelete.title = 'Excluir'; btnDelete.setAttribute('aria-label', 'Excluir'); btnDelete.className = 'danger icon-btn'; setButtonIcon(btnDelete, 'trash')
        btnDelete.onclick = async () => {
          try {
            const id = item[table.pk]
            await apiDelete(table.name, table.pk, id)
            showStatus('Excluído', 'success')
            refreshList()
          } catch (e) {
            showStatus(String(e.message || e), 'error')
          }
        }
        actionsDiv.appendChild(btnEdit)
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

    function updateSummary() {
      if (!options.length) { summary.textContent = 'Sem grupos'; return }
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
        const cb = document.createElement('input')
        cb.type = 'checkbox'
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

    return { wrap, setOptions, setSelected, getSelected }
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
    if (cargosInternosCache) return
    try {
      await ensureGruposLoaded()
      const data = await apiList(CARGOS_INTERNOS_TABLE)
      cargosInternosCache = Array.isArray(data) ? data : []
      const sample = cargosInternosCache[0] || {}
      cargosInternosIdKey = pickKey(sample, ['id_cargos_internos', 'id_cargo_interno', 'cargo_interno_id', 'id', 'codigo'])
      cargosInternosLabelKey = guessLabelKey(sample)
      cargosInternosPorGrupoKey = Object.prototype.hasOwnProperty.call(sample, 'por_grupo') ? 'por_grupo' : (Object.prototype.hasOwnProperty.call(sample, 'porGrupo') ? 'porGrupo' : 'por_grupo')
      const groupOptions = gruposCache
        ? gruposCache.map(g => ({ value: g?.[gruposIdKey], label: String(g?.[gruposLabelKey] ?? g?.[gruposIdKey] ?? '') }))
        : []

      cargosInternosList.innerHTML = ''
      cargosInternosUI.clear()
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
    } catch {
      cargosInternosCache = []
      cargosInternosList.textContent = 'Sem cargos internos.'
      cargosInternosUI.clear()
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
      select: `${membrosCargosInternosCargoKey},${membrosCargosInternosGrupoKey}`,
      [membrosCargosInternosMembroKey]: `eq.${memberId}`
    })
    const existing = new Set()
    ;(Array.isArray(existingRows) ? existingRows : []).forEach(r => {
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
      select: membrosGrupoGrupoKey,
      [membrosGrupoMembroKey]: `eq.${memberId}`
    })
    const selected = (Array.isArray(rows) ? rows : []).map(r => r?.[membrosGrupoGrupoKey])
    gruposField.setSelected(selected)
  }

  async function saveMemberGrupos(memberId, selectedGrupoIds) {
    if (!memberId) return
    const ids = (selectedGrupoIds || []).map(x => String(x)).filter(Boolean)
    const desired = new Set(ids)
    const rows = await apiGet(MEMBROS_GRUPO_TABLE, {
      select: membrosGrupoGrupoKey,
      [membrosGrupoMembroKey]: `eq.${memberId}`
    })
    const existing = new Set((Array.isArray(rows) ? rows : []).map(r => String(r?.[membrosGrupoGrupoKey] ?? '')).filter(Boolean))
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
    finally { btnSalvar.disabled = false }
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
  }

  actions.appendChild(btnSalvar)

  cardCad.appendChild(hCad)
  cardCad.appendChild(idWrap)
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
    loadSelectedGruposForMember(idInput.value.trim()).catch(() => {})
    loadSelectedCargosInternosForMember(idInput.value.trim()).catch(() => {})
  }
  btnConsulta.onclick = setActiveConsulta
  btnCadastro.onclick = setActiveCadastro
  setActiveConsulta()
}


let current = null
let schemaCache = null
function activateTab(name) {
  current = name
  document.querySelectorAll('.tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.name === name)
  })
  const t = schemaCache.tables.find(x => x.name === name)
  if (t) renderTableScreen(schemaCache, t)
}

window.addEventListener('DOMContentLoaded', async () => {
  schemaCache = await loadSchema()
  renderTabs(schemaCache)
  if (schemaCache.tables.length) activateTab(schemaCache.tables[0].name)
})
