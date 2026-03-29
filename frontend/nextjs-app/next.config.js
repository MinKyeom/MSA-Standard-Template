/** @type {import('next').NextConfig} */
const nextConfig = {
  staticPageGenerationTimeout: 600,
  // GitHub Actions 등 CI: 로컬과 다른 ESLint 규칙/플러그인으로 빌드만 실패하는 것 방지
  eslint: { ignoreDuringBuilds: true },
  // API는 게이트웨이(기본 8085)로 직접 호출(src/config/apiBase.js). 서비스별 포트 직결 rewrite 는 쓰지 않음(게이트웨이·쿠키·CORS 일관).
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      fs: false,
    };
    return config;
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // 실제 배포 시에는 백엔드 URL로 제한해야 합니다.
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;