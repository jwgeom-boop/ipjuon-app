CREATE TABLE public.consultation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_name TEXT NOT NULL,
  resident_phone TEXT NOT NULL,
  preferred_time TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_type TEXT NOT NULL,
  complex_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '대기중',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert consultation requests"
  ON public.consultation_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read consultation requests"
  ON public.consultation_requests
  FOR SELECT
  TO anon, authenticated
  USING (true);