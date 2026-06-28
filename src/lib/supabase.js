import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const allStatuses = ['Pending', 'Accepted', 'Rejected'];
export const progressStatuses = ['Pending', 'Accepted'];

export function sanitizeText(value = '') {
  return String(value).replace(/[<>]/g, '').trim();
}

export async function adminExists() {
  const { data, error } = await supabase.from('profiles').select('id').eq('role', 'Admin').limit(1);
  if (error) throw error;
  return data && data.length > 0;
}

export async function getProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfile(profile) {
  const clean = {
    id: profile.id,
    name: sanitizeText(profile.name),
    email: sanitizeText(profile.email).toLowerCase(),
    phone: sanitizeText(profile.phone || ''),
    role: profile.role || 'User',
    created_at: profile.created_at || new Date().toISOString()
  };
  const { data, error } = await supabase.from('profiles').upsert(clean).select().single();
  if (error) throw error;
  return data;
}

export async function createAdminAccount(values) {
  if (await adminExists()) throw new Error('Admin account already exists. Please use Admin Login.');
  const email = sanitizeText(values.email).toLowerCase();
  const password = String(values.password || '');
  if (password.length < 8) throw new Error('Admin password must be at least 8 characters.');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: values.name || 'Administrator',
        phone: '',
        role: 'Admin'
      }
    }
  });
  if (error) throw error;

  const profile = { 
    id: data.user.id, 
    name: values.name || 'Administrator', 
    email, 
    phone: '', 
    role: 'Admin' 
  };

  return { session: data.session, profile };
}

export async function registerUser(values) {
  const email = sanitizeText(values.email).toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: values.password,
    options: {
      data: {
        name: values.name,
        phone: values.phone || '',
        role: 'User'
      }
    }
  });
  if (error) throw error;
  return { data, error: null };
}

export async function loginWithPassword({ email, password }) {
  const cleanEmail = sanitizeText(email).toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password
  });
  if (error) throw error;

  const profile = await getProfile(data.user.id);
  return { session: data.session, profile };
}

export async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/login`
    }
  });
  if (error) throw error;
}

export async function saveContactMessage(values) {
  const payload = {
    name: sanitizeText(values.name),
    email: sanitizeText(values.email).toLowerCase(),
    phone: sanitizeText(values.phone || ''),
    subject: sanitizeText(values.subject),
    message: sanitizeText(values.message),
    is_read: false
  };
  const { error } = await supabase.from('contact_messages').insert(payload);
  if (error) throw error;
  return payload;
}

export async function fetchContactMessages() {
  const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateContactMessage(id, patch) {
  const { data, error } = await supabase.from('contact_messages').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteContactMessage(id) {
  const { error } = await supabase.from('contact_messages').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadResume({ user, profile, file }) {
  if (!file) throw new Error('Please choose a resume file.');
  if (!/\.(pdf|doc|docx)$/i.test(file.name)) throw new Error('Upload PDF, DOC, or DOCX only.');
  if (!user?.id) throw new Error('Please login again before uploading your resume.');
  
  const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '-');
  const storagePath = `${user.id}/${Date.now()}-${cleanName}`;
  
  const { error: uploadError } = await supabase.storage.from('resumes').upload(storagePath, file);
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from('resumes').getPublicUrl(storagePath);

  const payload = {
    user_id: user.id,
    user_name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Techie Brains User',
    email: profile?.email || user.email,
    resume_path: storagePath,
    resume_file_name: cleanName,
    resume_url: publicUrlData.publicUrl,
    status: 'Pending'
  };

  const { data, error } = await supabase.from('resumes').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function fetchUserResume(userId) {
  const { data, error } = await supabase.from('resumes').select('*').eq('user_id', userId).order('uploaded_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchResumes() {
  const { data, error } = await supabase.from('resumes').select('*').order('uploaded_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateResumeStatus(id, status) {
  const { data, error } = await supabase.from('resumes').update({ status }).eq('id', id).select().single();
  if (error) throw error;

  // Add Notification
  const notification = {
    user_id: data.user_id,
    title: 'Application status updated',
    message: 'Your application status is now ' + status + '.',
    is_read: false
  };
  await supabase.from('notifications').insert(notification);

  return data;
}

export async function getResumeDownloadUrl(path) {
  const { data, error } = await supabase.storage.from('resumes').createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

export async function fetchUsers() {
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'User');
  if (error) throw error;
  return data;
}

export async function fetchStats() {
  const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'User');
  const { count: resumesCount } = await supabase.from('resumes').select('*', { count: 'exact', head: true });
  const { count: messagesCount } = await supabase.from('contact_messages').select('*', { count: 'exact', head: true });
  
  const { count: acceptedCount } = await supabase.from('resumes').select('*', { count: 'exact', head: true }).eq('status', 'Accepted');
  const { count: rejectedCount } = await supabase.from('resumes').select('*', { count: 'exact', head: true }).eq('status', 'Rejected');
  const { count: pendingCount } = await supabase.from('resumes').select('*', { count: 'exact', head: true }).eq('status', 'Pending');

  return {
    users: usersCount || 0,
    resumes: resumesCount || 0,
    messages: messagesCount || 0,
    accepted: acceptedCount || 0,
    rejected: rejectedCount || 0,
    pending: pendingCount || 0
  };
}
