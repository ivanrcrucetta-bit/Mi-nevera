import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mi Nevera",
    short_name: "Mi Nevera",
    description: "Menú semanal con lo que hay en la nevera",
    start_url: "/",
    display: "standalone",
    background_color: "#1B2420",
    theme_color: "#1B2420",
    icons: [
      { src: "/icon", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
