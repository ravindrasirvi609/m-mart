-- Migration: Add image_urls, net_qty, product_highlights to products table
-- Run this against your existing Supabase database

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_urls jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS net_qty text;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_highlights jsonb;
