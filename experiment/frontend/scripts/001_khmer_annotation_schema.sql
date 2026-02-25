-- Create annotation projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create images table
CREATE TABLE IF NOT EXISTS public.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  image_data TEXT NOT NULL, -- Base64 encoded image
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create bounding boxes table
CREATE TABLE IF NOT EXISTS public.bounding_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  x NUMERIC NOT NULL,
  y NUMERIC NOT NULL,
  width NUMERIC NOT NULL,
  height NUMERIC NOT NULL,
  source TEXT CHECK (source IN ('manual', 'yolo')), -- 'manual' or 'yolo' detection
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create OCR results table
CREATE TABLE IF NOT EXISTS public.ocr_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  bounding_box_id UUID REFERENCES public.bounding_boxes(id) ON DELETE CASCADE,
  extracted_text TEXT,
  confidence NUMERIC,
  is_validated BOOLEAN DEFAULT FALSE,
  corrected_text TEXT, -- User's corrected version
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounding_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "projects_select_own" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "projects_insert_own" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update_own" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "projects_delete_own" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for images (through project ownership)
CREATE POLICY "images_select_own" ON public.images FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()
  )
);
CREATE POLICY "images_insert_own" ON public.images FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()
  )
);
CREATE POLICY "images_update_own" ON public.images FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()
  )
);
CREATE POLICY "images_delete_own" ON public.images FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()
  )
);

-- RLS Policies for bounding boxes
CREATE POLICY "bounding_boxes_select_own" ON public.bounding_boxes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.images 
    JOIN public.projects ON images.project_id = projects.id 
    WHERE images.id = image_id AND projects.user_id = auth.uid()
  )
);
CREATE POLICY "bounding_boxes_insert_own" ON public.bounding_boxes FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.images 
    JOIN public.projects ON images.project_id = projects.id 
    WHERE images.id = image_id AND projects.user_id = auth.uid()
  )
);
CREATE POLICY "bounding_boxes_update_own" ON public.bounding_boxes FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.images 
    JOIN public.projects ON images.project_id = projects.id 
    WHERE images.id = image_id AND projects.user_id = auth.uid()
  )
);
CREATE POLICY "bounding_boxes_delete_own" ON public.bounding_boxes FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.images 
    JOIN public.projects ON images.project_id = projects.id 
    WHERE images.id = image_id AND projects.user_id = auth.uid()
  )
);

-- RLS Policies for OCR results
CREATE POLICY "ocr_results_select_own" ON public.ocr_results FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.images 
    JOIN public.projects ON images.project_id = projects.id 
    WHERE images.id = image_id AND projects.user_id = auth.uid()
  )
);
CREATE POLICY "ocr_results_insert_own" ON public.ocr_results FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.images 
    JOIN public.projects ON images.project_id = projects.id 
    WHERE images.id = image_id AND projects.user_id = auth.uid()
  )
);
CREATE POLICY "ocr_results_update_own" ON public.ocr_results FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.images 
    JOIN public.projects ON images.project_id = projects.id 
    WHERE images.id = image_id AND projects.user_id = auth.uid()
  )
);
CREATE POLICY "ocr_results_delete_own" ON public.ocr_results FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.images 
    JOIN public.projects ON images.project_id = projects.id 
    WHERE images.id = image_id AND projects.user_id = auth.uid()
  )
);
