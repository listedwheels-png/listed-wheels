import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://listedwheels.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/search", "/listings/", "/dealers/", "/terms", "/privacy", "/refund-policy", "/pricing-terms"],
        disallow: ["/admin", "/dashboard", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
