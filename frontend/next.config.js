/** @type {import('next').NextConfig} */
module.exports = {
  eslint: {
    // Warning: Completely disables ESLint during build
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  env: {
    // These values will be overridden by .env.local or environment variables on Vercel
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NODE_ENV === 'development'
        ? 'http://127.0.0.1:8000'
        : 'https://stellar-sleep-patient-dashboard.onrender.com',
  },
};
