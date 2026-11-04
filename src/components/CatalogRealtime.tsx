import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRevalidator, useRouteLoaderData } from "react-router";
export default function CatalogRealtime() {
  const root = useRouteLoaderData<{ supabase?: { url: string; key: string } }>(
    "root",
  );
  const revalidator = useRevalidator();
  const url = root?.supabase?.url;
  const key = root?.supabase?.key;
  const revalidate = revalidator.revalidate;
  useEffect(() => {
    if (!url || !key) return;
    const client = createClient(url, key, {
      auth: { persistSession: false },
    });
    const channel = client
      .channel("catalog-refresh")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "catalog_revision" },
        () => {
          void revalidate();
        },
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [url, key, revalidate]);
  return null;
}
