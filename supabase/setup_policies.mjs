// Script to create storage policies on Supabase
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = process.env.SUPABASE_PROJECT_REF;

if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.');
  process.exit(1);
}

const sql = `
drop policy if exists "Users upload own protected resumes" on storage.objects;
drop policy if exists "Users read own protected resumes" on storage.objects;
drop policy if exists "Admins manage protected resumes" on storage.objects;

create policy "Users upload own protected resumes" on storage.objects 
  for insert with check (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users read own protected resumes" on storage.objects 
  for select using (
    bucket_id = 'resumes' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

create policy "Admins manage protected resumes" on storage.objects 
  for all using (
    bucket_id = 'resumes' and public.is_admin()
  ) with check (
    bucket_id = 'resumes' and public.is_admin()
  );
`;

async function run() {
  // Try the pg-meta query endpoint
  const endpoints = [
    `${url}/pg/query`,
    `${url}/rest/v1/rpc/`,
  ];

  // Attempt via pg-meta
  console.log('Attempting to run SQL via Supabase API...');
  
  try {
    const res = await fetch(`${url}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'x-connection-encrypted': 'true',
      },
      body: JSON.stringify({ query: sql }),
    });
    
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${text}`);
    
    if (res.ok) {
      console.log('\n✅ Storage policies created successfully!');
      return;
    }
  } catch (e) {
    console.log('pg/query endpoint not available:', e.message);
  }

  // If that didn't work, try the SQL endpoint
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
    });
    console.log(`REST API status: ${res.status}`);
  } catch (e) {
    console.log('REST check failed:', e.message);
  }

  const sqlEditorUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
    : 'https://supabase.com/dashboard';
  console.log('\n⚠️  Could not run SQL via API. Please paste the SQL manually in the Supabase SQL Editor.');
  console.log(`SQL Editor URL: ${sqlEditorUrl}`);
}

run();
