-- CATEGORY DETAILS: an Arabic name, a web address (slug) and a short intro for each product category,
-- so the owner can add categories in the admin (Menu & categories) and show them in the website menu.
-- Additive only: existing categories, products, stock and orders are not changed. The website menu
-- itself is stored in public.settings under the key 'menu' and needs no table.
ALTER TABLE public.categories ADD COLUMN name_ar text NOT NULL DEFAULT '' CHECK(length(name_ar)<=60);
ALTER TABLE public.categories ADD COLUMN slug text;
ALTER TABLE public.categories ADD COLUMN intro text NOT NULL DEFAULT '' CHECK(length(intro)<=600);
ALTER TABLE public.categories ADD COLUMN intro_ar text NOT NULL DEFAULT '' CHECK(length(intro_ar)<=600);

-- Existing categories get an address from their name ("Sleepwear" → "sleepwear").
UPDATE public.categories
SET slug = coalesce(nullif(btrim(regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'), '-'), ''), 'category-' || left(id, 8));

-- Arabic names for the categories the shop started with.
UPDATE public.categories c SET name_ar = v.ar
FROM (VALUES ('Tops','بلوزات'),('Bottoms','بناطيل'),('Dresses','فساتين'),('Outerwear','ملابس خارجية'),
             ('Accessories','إكسسوارات'),('Sets','أطقم'),('Sleepwear','ملابس نوم'),('Toys','ألعاب')) AS v(en, ar)
WHERE c.name = v.en AND c.name_ar = '';

ALTER TABLE public.categories ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.categories ADD CONSTRAINT category_slug CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 60);
CREATE UNIQUE INDEX categories_slug ON public.categories(slug);
