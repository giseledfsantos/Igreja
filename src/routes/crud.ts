import { Router } from 'express'
import { listAll, getById, create, update, remove } from '../services/crudService.js'

export const crudRouter = Router()

crudRouter.get('/:table', async (req, res) => {
  try {
    const { table } = req.params
    const data = await listAll(table)
    res.json(data)
  } catch (err: any) {
    res.status(400).json({ error: err.message ?? 'Erro' })
  }
})

crudRouter.get('/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params
    const data = await getById(table, id)
    res.json(data)
  } catch (err: any) {
    res.status(404).json({ error: err.message ?? 'Não encontrado' })
  }
})

crudRouter.post('/:table', async (req, res) => {
  try {
    const { table } = req.params
    const payload = req.body ?? {}
    const data = await create(table, payload)
    res.status(201).json(data)
  } catch (err: any) {
    res.status(400).json({ error: err.message ?? 'Erro ao criar' })
  }
})

crudRouter.put('/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params
    const payload = req.body ?? {}
    const data = await update(table, id, payload)
    res.json(data)
  } catch (err: any) {
    res.status(400).json({ error: err.message ?? 'Erro ao atualizar' })
  }
})

crudRouter.delete('/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params
    await remove(table, id)
    res.status(204).send()
  } catch (err: any) {
    res.status(400).json({ error: err.message ?? 'Erro ao excluir' })
  }
})
