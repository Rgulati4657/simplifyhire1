-- Fix RLS policies for offer_templates table and storage bucket

-- Enable RLS on offer_templates table
ALTER TABLE public.offer_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own offer templates" ON public.offer_templates;
DROP POLICY IF EXISTS "Users can insert their own offer templates" ON public.offer_templates;
DROP POLICY IF EXISTS "Users can update their own offer templates" ON public.offer_templates;
DROP POLICY IF EXISTS "Users can delete their own offer templates" ON public.offer_templates;

-- Create new RLS policies for offer_templates
CREATE POLICY "Users can view their own offer templates" ON public.offer_templates
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own offer templates" ON public.offer_templates
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own offer templates" ON public.offer_templates
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own offer templates" ON public.offer_templates
  FOR DELETE USING (created_by = auth.uid());

-- Storage bucket policies for offer-templates
-- Note: These need to be run in the Supabase dashboard storage settings

/*
Storage bucket policies to add in Supabase dashboard:

1. CREATE POLICY "Users can upload their own templates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'offer-templates' AND auth.uid()::text = (storage.foldername(name))[1]);

2. CREATE POLICY "Users can view their own templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'offer-templates' AND auth.uid()::text = (storage.foldername(name))[1]);

3. CREATE POLICY "Users can delete their own templates"
ON storage.objects FOR DELETE
USING (bucket_id = 'offer-templates' AND auth.uid()::text = (storage.foldername(name))[1]);

4. CREATE POLICY "Users can update their own templates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'offer-templates' AND auth.uid()::text = (storage.foldername(name))[1]);
*/

-- Create the storage bucket if it doesn't exist (this needs to be done in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('offer-templates', 'offer-templates', false);
