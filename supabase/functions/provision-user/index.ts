import { createClient } from 'npm:@supabase/supabase-js@2';

type ProvisionableRole = 'teacher' | 'parent' | 'specialist' | 'school_admin';

const ALLOWED_ROLES = new Set<ProvisionableRole>(['teacher', 'parent', 'specialist', 'school_admin']);
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function defaultSecretKey() {
  const rawKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (!rawKeys) return null;
  try {
    const keys = JSON.parse(rawKeys);
    return typeof keys?.default === 'string' && keys.default ? keys.default : null;
  } catch {
    return null;
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'Method not allowed.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  // Hosted Supabase provides the project's default sb_secret_* key here.
  // It remains available only to this Edge Function, never to the browser.
  const secretKey = defaultSecretKey();
  const authorization = request.headers.get('Authorization');
  if (!supabaseUrl || !supabaseAnonKey || !secretKey || !authorization) return response({ error: 'Provisioning service is not configured.' }, 500);

  const callerClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !caller) return response({ error: 'Authentication required.' }, 401);

  let input: { email?: unknown; displayName?: unknown; role?: unknown; schoolId?: unknown; redirectTo?: unknown };
  try {
    input = await request.json();
  } catch {
    return response({ error: 'A JSON request body is required.' }, 400);
  }

  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const displayName = typeof input.displayName === 'string' ? input.displayName.trim() : '';
  const role = typeof input.role === 'string' ? input.role as ProvisionableRole : null;
  const schoolId = typeof input.schoolId === 'string' && input.schoolId.trim() ? input.schoolId.trim() : null;
  const redirectTo = typeof input.redirectTo === 'string' && input.redirectTo.startsWith('http') ? input.redirectTo : undefined;
  if (!/^\S+@\S+\.\S+$/.test(email) || !role || !ALLOWED_ROLES.has(role)) return response({ error: 'A valid email and provisionable role are required.' }, 400);
  if (displayName.length > 120) return response({ error: 'Display name is too long.' }, 400);
  if (role === 'teacher' && !schoolId) return response({ error: 'A school is required when provisioning a teacher.' }, 400);

  const serviceClient = createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: callerAdminRole, error: callerRoleError } = await serviceClient.from('user_roles').select('role').eq('user_id', caller.id).eq('role', 'school_admin').maybeSingle();
  if (callerRoleError || !callerAdminRole) return response({ error: 'School-admin authorization is required.' }, 403);

  if (schoolId) {
    const { data: membership, error: membershipError } = await serviceClient.from('school_memberships').select('school_id').eq('school_id', schoolId).eq('user_id', caller.id).eq('role', 'school_admin').maybeSingle();
    if (membershipError || !membership) return response({ error: 'You are not an administrator for the specified school.' }, 403);
  }

  const { data: invite, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    data: displayName ? { display_name: displayName } : undefined,
    redirectTo,
  });
  const invitedUser = invite?.user;
  if (inviteError || !invitedUser) return response({ error: inviteError?.message || 'Unable to invite this user.' }, 422);

  const rollback = async () => { await serviceClient.auth.admin.deleteUser(invitedUser.id); };
  const { error: profileError } = await serviceClient.from('profiles').upsert({ id: invitedUser.id, display_name: displayName || email.split('@')[0] }, { onConflict: 'id', ignoreDuplicates: true });
  if (profileError) { await rollback(); return response({ error: 'Unable to initialize the invited profile.' }, 500); }

  // The MVP model has one role per account. The Auth trigger creates the
  // baseline student row, so trusted provisioning replaces that row here.
  const { error: roleError } = await serviceClient.from('user_roles').upsert({ user_id: invitedUser.id, role }, { onConflict: 'user_id' });
  if (roleError) { await rollback(); return response({ error: 'Unable to assign the invited role.' }, 500); }

  if (schoolId && (role === 'teacher' || role === 'school_admin')) {
    const { error: schoolError } = await serviceClient.from('school_memberships').insert({ school_id: schoolId, user_id: invitedUser.id, role });
    if (schoolError) { await rollback(); return response({ error: 'Unable to assign the invited school membership.' }, 500); }
  }

  const { error: auditError } = await serviceClient.from('admin_provisioning_audit').insert({ invited_by: caller.id, invited_user_id: invitedUser.id, invited_email: email, assigned_role: role, school_id: schoolId });
  if (auditError) { await rollback(); return response({ error: 'Unable to record the provisioning action.' }, 500); }

  return response({ userId: invitedUser.id, email, role, schoolId, invited: true }, 201);
});
