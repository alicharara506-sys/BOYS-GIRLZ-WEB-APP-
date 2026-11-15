-- EXTEND shared shop schema: visibility, private costs, owner access, image storage.
ALTER TABLE public.liabilities RENAME COLUMN settled TO settled_cents;
CREATE OR REPLACE FUNCTION public.is_shop_owner() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT EXISTS(SELECT 1 FROM public.owners WHERE id=auth.uid()) $$;
REVOKE ALL ON FUNCTION public.is_shop_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_shop_owner() TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$ BEGIN NEW.updated_at=now();RETURN NEW;END $$;
DO $$ DECLARE item record;BEGIN
 FOR item IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',item.tablename);
  EXECUTE format('REVOKE ALL ON public.%I FROM anon,authenticated',item.tablename);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO authenticated',item.tablename);
  IF item.tablename='owners' THEN
   EXECUTE 'REVOKE INSERT,UPDATE,DELETE ON public.owners FROM authenticated';
   EXECUTE 'CREATE POLICY owner_self ON public.owners FOR SELECT TO authenticated USING (id=auth.uid())';
  ELSE EXECUTE format('CREATE POLICY owner_full ON public.%I FOR ALL TO authenticated USING (public.is_shop_owner()) WITH CHECK (public.is_shop_owner())',item.tablename);END IF;
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=item.tablename AND column_name='updated_at') THEN
   EXECUTE format('ALTER TABLE public.%I ALTER COLUMN updated_at SET DEFAULT now()',item.tablename);
   EXECUTE format('CREATE TRIGGER touch_timestamp BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()',item.tablename);
  END IF;
 END LOOP;
END $$;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
ALTER TABLE public.owners ADD CONSTRAINT owner_auth_user FOREIGN KEY(id) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX single_shop_owner ON public.owners((true));
ALTER TABLE public.products ADD CONSTRAINT visibility_values CHECK(visibility IN ('website_and_pos','pos_only'));
ALTER TABLE public.products ADD CONSTRAINT product_discount CHECK(discount_type IS NULL OR discount_type IN ('percentage','amount'));
ALTER TABLE public.products ADD CONSTRAINT product_discount_amount CHECK(discount_value>=0 AND (discount_type IS DISTINCT FROM 'percentage' OR discount_value<=100));
ALTER TABLE public.products ADD CONSTRAINT prices_nonnegative CHECK(price_cents>=0 AND online_price_cents>=0 AND cost_cents>=0);
-- Backfill every preexisting item to the requested shared target. No legacy publish flag can hide it.
UPDATE public.products SET visibility='website_and_pos',published=true WHERE visibility IS NULL OR visibility='';
ALTER TABLE public.products ALTER COLUMN visibility SET DEFAULT 'website_and_pos';
CREATE POLICY storefront_products ON public.products FOR SELECT TO anon USING(visibility='website_and_pos' AND NOT archived);
GRANT SELECT(id,slug,name,description,category,category_id,shop_id,gender,brand,season,image_url,image_index,price_cents,online_price_cents,discount_type,discount_value,visibility,archived,featured,created_at,updated_at) ON public.products TO anon;
CREATE POLICY storefront_variants ON public.product_variants FOR SELECT TO anon USING(active AND EXISTS(SELECT 1 FROM public.products p WHERE p.id=product_id AND p.visibility='website_and_pos' AND NOT p.archived));
GRANT SELECT(id,product_id,size,color,stock,active) ON public.product_variants TO anon;
ALTER TABLE public.order_lines ADD CONSTRAINT quick_sale_identity CHECK((is_quick_sale AND product_id IS NULL AND variant_id IS NULL) OR (NOT is_quick_sale AND product_id IS NOT NULL AND variant_id IS NOT NULL));
ALTER TABLE public.order_lines ADD CONSTRAINT sold_quantities CHECK(quantity>0 AND returned>=0 AND returned<=quantity);
ALTER TABLE public.payments ADD CONSTRAINT supported_payment CHECK(method IN ('cash','whish','credit','gift'));
ALTER TABLE public.liabilities ADD CONSTRAINT liability_amounts CHECK(amount_cents>=0 AND settled_cents>=0 AND settled_cents<=amount_cents);
ALTER TABLE public.campaign_recipients ADD CONSTRAINT recipient_status CHECK(status IN('pending','sent','failed'));
CREATE UNIQUE INDEX one_open_drawer ON public.drawers((true)) WHERE closed_at IS NULL;
-- Revision notifications contain no product prices, costs, customer data or auth material.
CREATE TABLE public.catalog_revision(id integer PRIMARY KEY DEFAULT 1 CHECK(id=1),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
INSERT INTO public.catalog_revision(id) VALUES(1);
ALTER TABLE public.catalog_revision ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.catalog_revision TO anon,authenticated;
CREATE POLICY revision_read ON public.catalog_revision FOR SELECT USING(true);
CREATE OR REPLACE FUNCTION public.bump_catalog_revision() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN UPDATE public.catalog_revision SET updated_at=clock_timestamp() WHERE id=1;RETURN NULL;END $$;
CREATE TRIGGER product_catalog_change AFTER INSERT OR UPDATE OR DELETE ON public.products FOR EACH STATEMENT EXECUTE FUNCTION public.bump_catalog_revision();
CREATE TRIGGER variant_catalog_change AFTER INSERT OR UPDATE OR DELETE ON public.product_variants FOR EACH STATEMENT EXECUTE FUNCTION public.bump_catalog_revision();
ALTER PUBLICATION supabase_realtime ADD TABLE public.catalog_revision;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('product-images','product-images',true,5242880,ARRAY['image/jpeg','image/png','image/webp','image/gif']) ON CONFLICT(id) DO UPDATE SET file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
CREATE POLICY owner_image_upload ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='product-images' AND public.is_shop_owner());
CREATE POLICY owner_image_change ON storage.objects FOR UPDATE TO authenticated USING(bucket_id='product-images' AND public.is_shop_owner()) WITH CHECK(bucket_id='product-images' AND public.is_shop_owner());
CREATE POLICY owner_image_remove ON storage.objects FOR DELETE TO authenticated USING(bucket_id='product-images' AND public.is_shop_owner());
-- Exact decimal USD projections for external clients; transactional code keeps integer cents.
ALTER TABLE public.products ADD COLUMN price numeric(12,2) GENERATED ALWAYS AS(price_cents::numeric/100) STORED;
ALTER TABLE public.products ADD COLUMN cost_price numeric(12,2) GENERATED ALWAYS AS(cost_cents::numeric/100) STORED;
ALTER TABLE public.products ADD COLUMN stock numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN total numeric(12,2) GENERATED ALWAYS AS(total_cents::numeric/100) STORED;
ALTER TABLE public.order_lines ADD COLUMN qty numeric(12,2) GENERATED ALWAYS AS(quantity::numeric) STORED;
ALTER TABLE public.order_lines ADD COLUMN unit_price numeric(12,2) GENERATED ALWAYS AS(unit_price_cents::numeric/100) STORED;
ALTER TABLE public.order_lines ADD COLUMN unit_cost numeric(12,2) GENERATED ALWAYS AS(unit_cost_cents::numeric/100) STORED;
ALTER TABLE public.liabilities ADD COLUMN amount numeric(12,2) GENERATED ALWAYS AS(amount_cents::numeric/100) STORED;
ALTER TABLE public.liabilities ADD COLUMN settled numeric(12,2) GENERATED ALWAYS AS(settled_cents::numeric/100) STORED;
GRANT SELECT(price,stock) ON public.products TO anon;
CREATE OR REPLACE FUNCTION public.sync_product_stock() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN UPDATE public.products SET stock=(SELECT coalesce(sum(stock),0) FROM public.product_variants WHERE product_id=coalesce(NEW.product_id,OLD.product_id) AND active) WHERE id=coalesce(NEW.product_id,OLD.product_id);RETURN NULL;END $$;
CREATE TRIGGER sync_variant_stock AFTER INSERT OR UPDATE OR DELETE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.sync_product_stock();
INSERT INTO public.shops(id,name) VALUES(gen_random_uuid()::text,'Boys & Girlz') ON CONFLICT(name) DO NOTHING;
INSERT INTO public.categories(id,name,shop_id) SELECT gen_random_uuid()::text,label,id FROM public.shops CROSS JOIN unnest(ARRAY['Tops','Bottoms','Dresses','Outerwear','Accessories','Sets','Sleepwear','Toys']) label WHERE name='Boys & Girlz' ON CONFLICT(name,shop_id) DO NOTHING;
INSERT INTO public.accounts(code,name,type) VALUES
('1000','Cash on hand','asset'),('1020','Whish wallet','asset'),('1100','Accounts receivable / COD','asset'),('1200','Inventory asset','asset'),('2000','Accounts payable','liability'),('2100','Tax payable','liability'),('2200','Store credit liability','liability'),('2210','Gift card liability','liability'),('3000','Owner equity / opening balances','equity'),('4000','POS sales','income'),('4010','Online sales','income'),('4020','Shipping income','income'),('4090','Sales returns','contra-income'),('5000','Cost of goods sold','expense'),('5010','Stock loss / adjustments','expense'),('5100','Rent','expense'),('5110','Salaries','expense'),('5120','Utilities','expense'),('5130','Marketing','expense'),('5140','Supplies','expense'),('5190','Other expenses','expense'),('5200','Cash variance','expense') ON CONFLICT(code) DO NOTHING;
