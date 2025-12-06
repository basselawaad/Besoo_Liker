import { createClient } from '@supabase/supabase-js';

// ⚠️ هام: يجب استبدال هذه القيم ببيانات مشروع Supabase الخاص بك
// يمكنك الحصول عليها من إعدادات المشروع -> API
const supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co';
const supabaseKey = 'YOUR_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);