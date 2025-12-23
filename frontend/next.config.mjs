/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'images.unsplash.com'],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  // 성능 최적화 설정
  compress: true, // gzip 압축 활성화
  poweredByHeader: false, // X-Powered-By 헤더 제거
  reactStrictMode: true,
  swcMinify: true, // SWC 최소화 활성화
  // 컴파일러 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // 프로덕션에서 console 제거
  },
  // 헤더 최적화
  async headers() {
    return [
      {
        // 동적 페이지는 캐시하지 않음
        source: '/macro',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

