import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración de Turbopack para evitar warnings
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
