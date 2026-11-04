The PostgreSQL root certificate is downloaded from the Supabase dashboard’s
Database Settings → SSL configuration → Download certificate link:
https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt

The setup script and Prisma adapter use it with certificate and hostname
verification enabled. This is a public CA certificate, not a private key.
