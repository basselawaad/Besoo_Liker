import { createClient } from '@supabase/supabase-js';

// تم تحديث الرابط بناءً على إعداداتك المذكورة (https://omwcmtcxzmmefgvshhjh.supabase.co)
const supabaseUrl = 'https://omwcmtcxzmmefgvshhjh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9td2NtdGN4em1tZWZndnNoaGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjkyMjQsImV4cCI6MjA4MDU0NTIyNH0.vZs-IRBfZFMamkQE1I2wBN2VIZ5VyM3EsWK34eSQoxY';

export const supabase = createClient(supabaseUrl, supabaseKey);