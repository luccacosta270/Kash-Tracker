ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS deleted_auto_logs jsonb NOT NULL DEFAULT '{}'::jsonb;