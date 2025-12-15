import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type SupabaseAdminInit = {
  client: SupabaseClient | null;
  missing: { SUPABASE_URL: boolean; SUPABASE_SERVICE_ROLE_KEY: boolean };
  envSource: { url: string | null; key: string | null };
  runtime: { vercelEnv: string | null; vercelUrl: string | null; vercelGitCommitSha: string | null };
};

const resolveEnv = () => {
  const supabaseUrlRaw = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
  const serviceRoleKeyRaw =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_KEY ?? '';

  const supabaseUrl = supabaseUrlRaw.trim();
  const serviceRoleKey = serviceRoleKeyRaw.trim();

  const missing = {
    SUPABASE_URL: supabaseUrl.length === 0,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey.length === 0,
  };

  const envSource = {
    url: missing.SUPABASE_URL ? null : process.env.SUPABASE_URL ? 'SUPABASE_URL' : 'VITE_SUPABASE_URL',
    key: missing.SUPABASE_SERVICE_ROLE_KEY
      ? null
      : process.env.SUPABASE_SERVICE_ROLE_KEY
        ? 'SUPABASE_SERVICE_ROLE_KEY'
        : process.env.SUPABASE_SECRET_KEY
          ? 'SUPABASE_SECRET_KEY'
          : 'SUPABASE_KEY',
  };

  return { supabaseUrl, serviceRoleKey, missing, envSource };
};

export const initSupabaseAdmin = (): SupabaseAdminInit => {
  const { supabaseUrl, serviceRoleKey, missing, envSource } = resolveEnv();

  const runtime = {
    vercelEnv: process.env.VERCEL_ENV ?? null,
    vercelUrl: process.env.VERCEL_URL ?? null,
    vercelGitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  };

  if (missing.SUPABASE_URL || missing.SUPABASE_SERVICE_ROLE_KEY) {
    return { client: null, missing, envSource, runtime };
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return { client, missing, envSource, runtime };
};

