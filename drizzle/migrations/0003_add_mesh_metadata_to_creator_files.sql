ALTER TABLE public.creator_files
  ADD COLUMN IF NOT EXISTS dim_x numeric,
  ADD COLUMN IF NOT EXISTS dim_y numeric,
  ADD COLUMN IF NOT EXISTS dim_z numeric,
  ADD COLUMN IF NOT EXISTS triangle_count integer;