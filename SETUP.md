# Connect Boys & Girlz

1. Create/select the free Supabase project.
2. Save its Project URL and public publishable/anon key as SUPABASE_URL and SUPABASE_ANON_KEY in the ignored .env file.
3. Save its server-only service-role key as SUPABASE_SERVICE_ROLE_KEY. It is used for image uploads; it never enters browser data.
4. Save that project's direct or session-pooler database URL as DATABASE_URL. Use the session pooler on networks without IPv6. Auth, database and images must belong to the same project.
   PostgreSQL connections verify the server certificate using the official Supabase CA in supabase/certs. Do not disable certificate verification.
5. Run npm install and npm run setup. Setup applies tracked Supabase migrations transactionally, creates access policies and the image bucket, and adds the initial shop/categories/accounts. It does not erase the earlier local data or automatically upload customer backups.
6. Create the owner in Supabase Auth → Users. In SQL Editor execute INSERT INTO public.owners(id) VALUES ('the-owner-auth-user-uuid');. Public sign-up cannot create owner access. One owner is supported.
7. Run npm start. Sign in with that Supabase Auth account at http://127.0.0.1:5181/admin.
8. Open WhatsApp campaigns, choose Connect / show QR, then scan it from Linked devices on the Boys & Girlz business phone. Add real E.164 customer numbers and explicitly record their consent before sending.

The public catalog uses the anon key and selects only public fields. RLS hides POS-only products; column grants hide product/variant costs. Campaign and session-key tables are private. Images are stored in the project's product-images bucket. Catalog revision notifications refresh the storefront when products or stock change.

For this local workspace, the existing owner login was provisioned in Supabase Auth and allowlisted. The private .data/admin-login.txt file contains the login. The 12 original sample products and 60 variants were imported; fictional customer and order history remains in the private backup. Settings includes a testing-workspace switch that labels new sales as samples.

If this project already has unrelated or incompatible tables, do not reset it: choose a dedicated project or review an explicit import/migration plan first. The setup script rolls a failed migration back. Prior .data files remain private backups and are never runtime fallbacks.
