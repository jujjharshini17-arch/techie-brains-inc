import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vexemcdcxdrpefzwfwfx.supabase.co';
const supabaseAnonKey = 'sb_publishable_EUR3L6UlkVJ7tb9DfBMPDQ_mOxOqXah';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing Supabase Connection...');
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      console.error('Error querying profiles:', error);
    } else {
      console.log('Query successful, profiles count:', data.length);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

test();
