// Pull the Supabase library directly from the web
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ⚠️ PASTE YOUR KEYS HERE
const SUPABASE_URL = 'https://gnerjkoehkmirpboxbqo.supabase.co';
const SUPABASE_KEY = ' sb_publishable_VQAaG-rxjVcCd7jojX9dzA_uNRtjO7X ';

// Create and export the database connection
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);