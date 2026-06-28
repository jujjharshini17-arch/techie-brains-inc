// Script to create the 'resumes' storage bucket and set storage policies via Supabase Management API
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

if (!SUPABASE_URL || !SERVICE_KEY || !PROJECT_REF) {
  console.error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_PROJECT_REF before running this script.');
  process.exit(1);
}

async function runSQL(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function createBucketViaStorageAPI() {
  // Try creating bucket via Supabase Storage REST API
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY
    },
    body: JSON.stringify({
      id: 'resumes',
      name: 'resumes',
      public: true,
      file_size_limit: 10485760, // 10MB
      allowed_mime_types: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    })
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function getBuckets() {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY
    }
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function main() {
  console.log('=== Checking existing buckets ===');
  const existing = await getBuckets();
  console.log('Status:', existing.status);
  console.log('Buckets:', JSON.stringify(existing.json, null, 2));

  const bucketExists = Array.isArray(existing.json) && existing.json.some(b => b.id === 'resumes');
  
  if (bucketExists) {
    console.log('\n✅ Bucket "resumes" already exists!');
  } else {
    console.log('\n=== Creating "resumes" bucket ===');
    const result = await createBucketViaStorageAPI();
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.json, null, 2));

    if (result.status === 200 || result.status === 201) {
      console.log('\n✅ Bucket "resumes" created successfully!');
    } else {
      console.log('\n❌ Failed to create bucket. Response above.');
    }
  }

  console.log('\n=== Final bucket list ===');
  const final = await getBuckets();
  console.log(JSON.stringify(final.json, null, 2));
}

main().catch(console.error);
