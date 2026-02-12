import { supabase } from '../db/supabase.js'

export async function listAll(table: string) {
  const { data, error } = await supabase.from(table).select('*')
  if (error) throw error
  return data
}

export async function getById(table: string, id: string | number) {
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function create(table: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.from(table).insert(payload).select('*').single()
  if (error) throw error
  return data
}

export async function update(table: string, id: string | number, payload: Record<string, unknown>) {
  const { data, error } = await supabase.from(table).update(payload).eq('id', id).select('*').single()
  if (error) throw error
  return data
}

export async function remove(table: string, id: string | number) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}
