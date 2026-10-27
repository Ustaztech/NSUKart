import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NSUKart",
    short_name: "NSUKart",
    description: "Your Campus. Your Marketplace.",
    start_url: "/",
    display: "standalone",
    background_color: "#fcfcf9",
    theme_color: "#065f46",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
