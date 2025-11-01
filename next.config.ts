import type { NextConfig } from "next";

/**
 * Next.js 성능 최적화 설정
 *
 * 1. 이미지 최적화 (AVIF, WebP)
 * 2. 번들 사이즈 분석 (@next/bundle-analyzer)
 * 3. 코드 스플리팅 및 청크 최적화
 * 4. 보안 헤더 설정
 *
 * 번들 분석 실행:
 * ANALYZE=true npm run build
 */

// @next/bundle-analyzer 설정
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // 이미지 최적화 설정
  images: {
    // 최신 이미지 포맷 사용 (AVIF > WebP > 원본)
    formats: ["image/avif", "image/webp"],
    // 반응형 이미지를 위한 디바이스 사이즈
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // 이미지 사이즈 브레이크포인트
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Turbopack 설정 (Next.js 16+)
  // 빈 객체를 설정하여 Turbopack 사용 명시 및 경고 제거
  turbopack: {},

  // Webpack 최적화 설정 (Turbopack 미사용 시)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 클라이언트 번들 최적화
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            // 기본 및 vendors 그룹 비활성화
            default: false,
            vendors: false,
            // 공통 모듈 (2번 이상 사용된 모듈)
            commons: {
              name: "commons",
              chunks: "all",
              minChunks: 2,
              priority: 10,
            },
            // node_modules 모듈
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name: "lib",
              chunks: "all",
              priority: 20,
            },
          },
        },
      };
    }
    return config;
  },

  // 보안 헤더
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.tosspayments.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.tosspayments.com",
              "frame-src 'self' https://js.tosspayments.com",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },

  // 프로덕션 최적화
  compiler: {
    // 프로덕션에서 console.log 제거 (선택사항)
    // removeConsole: process.env.NODE_ENV === "production",
  },
};

export default withBundleAnalyzer(nextConfig);
