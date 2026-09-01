import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase = null

if (URL && KEY) {
  supabase = createClient(URL, KEY)
}

export { supabase }

