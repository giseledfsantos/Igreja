import { describe, it, expect, beforeAll, vi } from 'vitest'
import request from 'supertest'

vi.mock('../src/services/crudService', () => {
  return {
    listAll: vi.fn(async () => [{ id: 1, name: 'A' }]),
    getById: vi.fn(async (_table: string, id: string) => ({ id: Number(id), name: 'A' })),
    create: vi.fn(async (_table: string, payload: any) => ({ id: 2, ...payload })),
    update: vi.fn(async (_table: string, id: string, payload: any) => ({ id: Number(id), ...payload })),
    remove: vi.fn(async () => {})
  }
})

import app from '../src/server'

beforeAll(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_KEY = 'anon-key'
})

describe('CRUD genérico', () => {
  it('lista registros', async () => {
    const res = await request(app).get('/api/items')
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThan(0)
  })

  it('busca por id', async () => {
    const res = await request(app).get('/api/items/1')
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(1)
  })

  it('cria registro', async () => {
    const res = await request(app).post('/api/items').send({ name: 'B' })
    expect(res.status).toBe(201)
    expect(res.body.id).toBeGreaterThan(0)
  })

  it('atualiza registro', async () => {
    const res = await request(app).put('/api/items/2').send({ name: 'C' })
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(2)
    expect(res.body.name).toBe('C')
  })

  it('remove registro', async () => {
    const res = await request(app).delete('/api/items/2')
    expect(res.status).toBe(204)
  })
})
