import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ✅ Validation to avoid undefined env errors (Render sometimes skips .env)
if (!SUPABASE_URL) throw new Error('❌ Missing SUPABASE_URL in environment variables');
if (!SUPABASE_ANON_KEY) throw new Error('❌ Missing SUPABASE_ANON_KEY in environment variables');
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment variables');

/**
 * 🟢 Public Supabase client (safe for frontend use)
 *    Used for readonly / anon operations
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 🔒 Admin Supabase client (backend only)
 *    Used for inserts, updates, deletes with full access
 */
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
