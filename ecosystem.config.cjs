module.exports = {
  apps: [
    {
      name: 'chambing-frontend',
      script: 'node_modules/.bin/react-router-serve',
      args: 'build/server/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        // Fetch server-side (loaders SSR) → NestJS local, sin pasar por Nginx
        API_INTERNAL_URL: 'http://localhost:3000/api',
        // Fetch client-side (Axios en el navegador) → pasa por Nginx /api
        VITE_API_URL: 'https://chambing.pro/api',
      },
    },
  ],
};
