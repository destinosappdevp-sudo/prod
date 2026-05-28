-- Permite que cada usuario autenticado gestione solo sus propios archivos
-- en el bucket "images" bajo rutas:
--   profiles/{uid}/...
--   verification-docs/{uid}/...

DROP POLICY IF EXISTS "images_user_select_own_files" ON storage.objects;
DROP POLICY IF EXISTS "images_user_insert_own_files" ON storage.objects;
DROP POLICY IF EXISTS "images_user_update_own_files" ON storage.objects;
DROP POLICY IF EXISTS "images_user_delete_own_files" ON storage.objects;

CREATE POLICY "images_user_select_own_files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] IN ('profiles', 'verification-docs')
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "images_user_insert_own_files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] IN ('profiles', 'verification-docs')
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "images_user_update_own_files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] IN ('profiles', 'verification-docs')
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] IN ('profiles', 'verification-docs')
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "images_user_delete_own_files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] IN ('profiles', 'verification-docs')
  AND (storage.foldername(name))[2] = auth.uid()::text
);
