import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ihtttedhoxktluparnue.supabase.co'
const supabaseAnonKey = 'sb_publishable_NALXtKEp9GeclGSbgytmZQ_pOk-9_Nz'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
