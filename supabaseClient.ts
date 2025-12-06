import { createClient } from '@supabase/supabase-js';

// تم تحديث الرابط بناءً على إعداداتك المذكورة (https://omwcmtcxzmmefgvshhjh.supabase.co)
const supabaseUrl = 'https://omwcmtcxzmmefgvshhjh.supabase.co';
const supabaseKey = 'YOUR_ANON_KEY'; // ⚠️ تأكد من وضع مفتاح الـ Anon Key الخاص بك هنا

export const supabase = createClient(supabaseUrl, supabaseKey);