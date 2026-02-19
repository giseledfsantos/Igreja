const SUPABASE_URL = 'https://xytuuccwylwbefgkqxlr.supabase.co'
const API_KEY = 'sb_publishable_kmvt5bwvVonTji9qWqgjKg_r8oKsCRs'

function headers() {
  return {
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

function el(id) { return document.getElementById(id) }
function txt(el, data) { el.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2) }

async function loadSchema() {
  let configured = { tables: [] }
  try {
    const resCfg = await fetch('/schema.json')
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
  btnUpdate.textContent = 'Atualizar'
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
  btnDelete.textContent = 'Excluir'
  btnDelete.className = 'danger'
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
  function showStatus(text, type) {
    status.textContent = text
    status.classList.remove('success', 'error')
    if (type === 'success') status.classList.add('success')
    if (type === 'error') status.classList.add('error')
    status.style.display = ''
    setTimeout(() => { status.style.display = 'none' }, 2500)
  }

  const panelConsulta = document.createElement('div')
  const cardList = document.createElement('section')
  cardList.className = 'card'
  const hList = document.createElement('h2')
  hList.textContent = 'Lista de membros'
  const listWrap = document.createElement('div')
  listWrap.className = 'list-items'
  async function refreshList() {
    listWrap.innerHTML = ''
    try {
      const data = await apiList(table.name)
      console.log('Consulta:list', { count: Array.isArray(data) ? data.length : 0, sample: Array.isArray(data) ? data.slice(0, 3) : data })
      data.forEach(item => {
        const div = document.createElement('div')
        div.className = 'list-item'
        const title = document.createElement('div'); title.className = 'title'; title.textContent = item.nome || (item.matricula || '')
        const actionsDiv = document.createElement('div'); actionsDiv.className = 'grid-actions'
        const btnEdit = document.createElement('button'); btnEdit.title = 'Editar'; btnEdit.textContent = 'Editar'
        btnEdit.onclick = () => {
          fillCadastro(item)
          setActiveCadastro()
        }
        const btnDelete = document.createElement('button'); btnDelete.title = 'Excluir'; btnDelete.className = 'danger'; btnDelete.textContent = 'Excluir'
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

  const form = document.createElement('div')
  table.fields.forEach(f => form.appendChild(renderField(f)))
  const actions = document.createElement('div')
  actions.className = 'actions'
  const btnSalvar = document.createElement('button')
  btnSalvar.textContent = 'Salvar'

  btnSalvar.onclick = async () => {
    try { 
      const payload = collectPayload(form)
      if (!idInput.value.trim()) {
        const res = await apiCreate(table.name, payload)
        console.log('Cadastro:salvar:create', { payload, res })
        const created = Array.isArray(res) ? res[0] : res
        idInput.value = created?.[table.pk] ?? ''
        showStatus('Membro criado', 'success')
      } else {
        const id = idInput.value.trim()
        const res = await apiUpdate(table.name, table.pk, id, payload) 
        console.log('Cadastro:salvar:update', { id, payload, res })
        showStatus('Alterações salvas', 'success')
      }
      listWrap.innerHTML = ''
      setActiveConsulta()
    } catch (e) { console.log('Cadastro:salvar:error', e); showStatus(String(e.message || e), 'error') }
  }

  function fillCadastro(item) {
    idInput.value = item?.[table.pk] ?? ''
    form.querySelectorAll('input,textarea,select').forEach(i => {
      const k = i.dataset.key
      const v = item?.[k]
      if (i.type === 'checkbox') i.checked = !!v
      else if (i.tagName === 'SELECT') i.value = v ?? ''
      else i.value = v ?? ''
    })
  }

  actions.appendChild(btnSalvar)

  cardCad.appendChild(hCad)
  cardCad.appendChild(idWrap)
  cardCad.appendChild(form)
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
