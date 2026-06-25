-- Make cloud sync non-destructive and conflict-safe.
-- Keep one row for each local item before adding constraints required by upsert.
DELETE FROM public.categories c
USING public.categories keep
WHERE c.user_id = keep.user_id
  AND c.local_id = keep.local_id
  AND c.id > keep.id;

DELETE FROM public.transactions t
USING public.transactions keep
WHERE t.user_id = keep.user_id
  AND t.local_id = keep.local_id
  AND t.id > keep.id;

ALTER TABLE public.categories
  ADD CONSTRAINT categories_user_id_local_id_key UNIQUE (user_id, local_id);

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_user_id_local_id_key UNIQUE (user_id, local_id);
