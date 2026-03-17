
-- Allow users to update their own complaints (specifically for latitude/longitude as 'Mark Location')
CREATE POLICY "Citizens can update own complaints" 
ON public.complaints 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
