import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
  ssr: true,
  // Query-specific language variants must reach the server. Static path-only HTML
  // would otherwise serve the English document for ?lang=ar as well.
} satisfies Config;
