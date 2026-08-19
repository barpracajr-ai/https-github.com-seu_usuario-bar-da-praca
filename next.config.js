/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração limpa. A Vercel gerencia o resto em produção.
  experimental: {
    turbo: {
      resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    },
  },
};

module.exports = nextConfig;
