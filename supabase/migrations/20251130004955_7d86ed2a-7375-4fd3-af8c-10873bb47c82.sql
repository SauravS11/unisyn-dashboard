-- Add buyer, seller, and legal party information to deals table
ALTER TABLE public.deals
ADD COLUMN buyer_name text,
ADD COLUMN buyer_email text,
ADD COLUMN seller_name text,
ADD COLUMN seller_email text,
ADD COLUMN buyer_legal_name text,
ADD COLUMN buyer_legal_email text,
ADD COLUMN seller_legal_name text,
ADD COLUMN seller_legal_email text;