import type { MetadataRoute } from "next";
import { indexingAllowed } from "@/lib/indexing";

// Read per request, so the switch works without rebuilding.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return indexingAllowed()
    ? { rules: { userAgent: "*", allow: "/", disallow: ["/api/"] } }
    : { rules: { userAgent: "*", disallow: "/" } };
}
