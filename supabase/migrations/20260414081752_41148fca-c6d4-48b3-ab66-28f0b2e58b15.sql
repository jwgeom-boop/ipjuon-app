ALTER TABLE public.consultation_requests ADD COLUMN memo text DEFAULT '';

CREATE POLICY "Anyone can update consultation requests"
ON public.consultation_requests
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);