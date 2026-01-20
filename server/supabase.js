
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Use Service Role Key only if you need admin access, otherwise Anon Key

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase env variables in server.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
