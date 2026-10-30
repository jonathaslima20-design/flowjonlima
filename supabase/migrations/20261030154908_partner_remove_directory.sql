-- O diretório público de parceiros saiu: os parceiros é que trazem clientes, o site não os divulga
DROP FUNCTION IF EXISTS public.partner_directory();

CREATE OR REPLACE FUNCTION public.partner_update_profile(p jsonb)
RETURNS partners
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row partners;
BEGIN
  UPDATE partners SET
    whatsapp = CASE WHEN p ? 'whatsapp' AND public.normalize_whatsapp(p->>'whatsapp') <> '' THEN public.normalize_whatsapp(p->>'whatsapp') ELSE whatsapp END,
    channels = COALESCE(left(btrim(p->>'channels'), 500), channels),
    pix_key = COALESCE(left(btrim(p->>'pix_key'), 140), pix_key),
    pix_full_name = COALESCE(left(btrim(p->>'pix_full_name'), 140), pix_full_name),
    updated_at = now()
  WHERE profile_id = auth.uid()
  RETURNING * INTO v_row;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Você não é parceiro' USING ERRCODE = '42501';
  END IF;
  RETURN v_row;
END;
$$;

ALTER TABLE partners
  DROP COLUMN directory_listed,
  DROP COLUMN directory_bio,
  DROP COLUMN city,
  DROP COLUMN specialties;
