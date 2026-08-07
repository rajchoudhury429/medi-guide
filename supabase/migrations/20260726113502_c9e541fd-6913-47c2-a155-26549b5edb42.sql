
CREATE POLICY "own health files read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'health-records' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own health files insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'health-records' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own health files update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'health-records' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own health files delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'health-records' AND auth.uid()::text = (storage.foldername(name))[1]);
