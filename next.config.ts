import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Desactivado: toda la app es un panel autenticado (cada ruta depende de la
  // sesión/cookies), así que no hay nada que cachear como estático y
  // Cache Components solo obliga a envolver cada página en Suspense sin beneficio.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
