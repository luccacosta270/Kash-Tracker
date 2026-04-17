ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS insight_preferences jsonb NOT NULL DEFAULT '{"enabled":true,"categories":["smart"],"refresh":"daily","length":"short","humor":true}'::jsonb;