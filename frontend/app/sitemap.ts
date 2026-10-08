import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://listedwheels.in";
  const now = new Date();

  const staticRoutes = [
    "",
    "/search",
    "/search?category=cars",
    "/search?category=bikes",
    "/search?category=cycles",
    "/search?category=other",
    "/sell",
    "/terms",
    "/privacy",
    "/refund-policy",
    "/pricing-terms",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : route.startsWith("/search") ? 0.9 : 0.7,
  }));

  const popularCityRoutes = [
    "Chennai",
    "Bengaluru",
    "Mumbai",
    "Delhi+NCR",
    "Hyderabad",
    "Pune",
    "Coimbatore",
    "Kochi",
  ].map((city) => ({
    url: `${baseUrl}/search?city=${city}`,
    lastModified: now,
    changeFrequency: "hourly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...popularCityRoutes];
}
