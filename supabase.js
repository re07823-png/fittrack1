import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} from './config.js';

export const isConfigured = () =>
  Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY
  );

let client = null;

export async function db() {
  if (!isConfigured()) {
    return null;
  }

  if (!client) {
    const { createClient } =
      await import(
        'https://esm.sh/@supabase/supabase-js@2.45.4'
      );

    client = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
  }

  return client;
}

export async function getSession() {
  try {
    const c = await db();

    if (!c) {
      return null;
    }

    const { data } =
      await c.auth.getSession();

    return data.session;
  } catch {
    return null;
  }
}

export async function signOut() {
  const c = await db();

  if (!c) {
    return;
  }

  await c.auth.signOut();
}
