import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mmart Grocery Store",
    short_name: "Mmart",
    description: "Order groceries online from Mmart.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e10600",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
