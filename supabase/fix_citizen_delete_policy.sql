
-- Allow users to delete their own complaints
CREATE POLICY "Citizens can delete own complaints" 
ON public.complaints 
FOR DELETE 
USING (auth.uid() = user_id);
