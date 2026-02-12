import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_KEY, ensureEnv } from '../config/env.js'

ensureEnv()

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
