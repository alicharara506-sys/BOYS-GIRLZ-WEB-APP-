-- PRODUCT COLORS: per-color swatch, photo set and availability, plus Arabic product copy.
-- Additive only: existing products, variants, orders and stock are not changed. Products saved
-- before this keep working with their single photo and no color rows.
ALTER TABLE public.products ADD COLUMN name_ar text NOT NULL DEFAULT '';
ALTER TABLE public.products ADD COLUMN description_ar text NOT NULL DEFAULT '';
ALTER TABLE public.products ADD COLUMN color_mode text NOT NULL DEFAULT 'multiple';
ALTER TABLE public.products ADD CONSTRAINT product_color_mode CHECK(color_mode IN ('single','multiple'));
GRANT SELECT(name_ar,description_ar,color_mode) ON public.products TO anon;

-- One row per color of a product. "name" matches product_variants.color, which still holds the
-- stock for each size of that color. "images" is the color's ordered photo list; the first is
-- its cover. "available" is the shop's own switch for selling that color online.
CREATE TABLE public.product_colors(
 id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 40),
 name_ar text NOT NULL DEFAULT '' CHECK(length(name_ar)<=40),
 hex text NOT NULL CHECK(hex ~ '^#[0-9a-f]{6}$'),
 images jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(images)='array' AND jsonb_array_length(images)<=12),
 available boolean NOT NULL DEFAULT true,
 position integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(product_id,name)
);
CREATE INDEX product_colors_product ON public.product_colors(product_id,position);

-- Same access model as the other shop tables: the owner manages everything; the storefront may
-- read the colors of products it can already see.
ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.product_colors FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.product_colors TO authenticated;
CREATE POLICY owner_full ON public.product_colors FOR ALL TO authenticated USING(public.is_shop_owner()) WITH CHECK(public.is_shop_owner());
GRANT SELECT(id,product_id,name,name_ar,hex,images,available,position) ON public.product_colors TO anon;
CREATE POLICY storefront_colors ON public.product_colors FOR SELECT TO anon USING(EXISTS(SELECT 1 FROM public.products p WHERE p.id=product_id AND p.visibility='website_and_pos' AND NOT p.archived));
CREATE TRIGGER touch_timestamp BEFORE UPDATE ON public.product_colors FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
-- The storefront refreshes when colors change, as it does for products and variants.
CREATE TRIGGER color_catalog_change AFTER INSERT OR UPDATE OR DELETE ON public.product_colors FOR EACH STATEMENT EXECUTE FUNCTION public.bump_catalog_revision();
