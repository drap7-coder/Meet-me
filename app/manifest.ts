import { BRAND } from "@/src/config/branding";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.displayName,
    short_name: BRAND.name,
    description: BRAND.description,
    start_url: "/",
    display: "standalone",
    background_color: "#F2EFE7",
    theme_color: "#0A1323",
    icons: [
      {
        src: "/branding/koi-favicon.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/branding/koi-app-icon-1024.png",
        sizes: "1024x1024",
        type: "image/png"
      }
    ]
  };
}
