import { createClient } from "@supabase/supabase-js";

const checkedBuckets = new Set<string>();

export function createAdminClient() {
  // Support both current and legacy env names in server environments.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getAdminStorageClientOrThrow(bucket: string, context: string) {
  const client = createAdminClient();

  if (!client) {
    throw new Error(
      `${context}: falta configurar NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY`
    );
  }

  if (!checkedBuckets.has(bucket)) {
    const { data, error } = await client.storage.getBucket(bucket);

    if (error) {
      const { error: createError } = await client.storage.createBucket(bucket, {
        public: true,
      });

      if (createError) {
        throw new Error(
          `${context}: bucket \"${bucket}\" no disponible y no se pudo crear (${createError.message})`
        );
      }
    } else if (data && data.public === false) {
      const { error: updateError } = await client.storage.updateBucket(bucket, {
        public: true,
      });

      if (updateError) {
        throw new Error(
          `${context}: bucket \"${bucket}\" existe pero no se pudo volver público (${updateError.message})`
        );
      }
    }

    checkedBuckets.add(bucket);
  }

  return client;
}