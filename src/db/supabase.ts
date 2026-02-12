import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_KEY } from '../config/env.js'

export function getSupabase() {
  const url = process.env.SUPABASE_URL || SUPABASE_URL
  const key = process.env.SUPABASE_KEY || SUPABASE_KEY
  if (!url || !key) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, key)
}
