/**
 * Astral Hub Shared Tailwind CSS Preset
 *
 * 此 preset 為所有應用程式提供統一的基礎設計系統：
 * - Admin Web (Fintech/Crypto Dark Mode)
 * - Buyer Web (DeFi Cyberpunk Neon)
 * - POS Web (Simple & Functional)
 *
 * 各應用程式可在其 tailwind.config.js 中 extend 此 preset
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      // ========================================
      // 字體系統
      // ========================================
      fontFamily: {
        // 中文字體（統一）- Noto Sans TC
        'sans': [
          'Noto Sans TC',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
      },

      fontWeight: {
        thin: '100',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },

      // ========================================
      // 間距系統（8px Baseline）
      // ========================================
      spacing: {
        // 基礎間距已由 Tailwind 提供 (4px 為單位)
        // 額外補充常用組合
        '4.5': '1.125rem',  // 18px
        '5.5': '1.375rem',  // 22px
        '13': '3.25rem',    // 52px
        '15': '3.75rem',    // 60px
        '17': '4.25rem',    // 68px
        '18': '4.5rem',     // 72px
        '19': '4.75rem',    // 76px
        '21': '5.25rem',    // 84px
        '22': '5.5rem',     // 88px
        '26': '6.5rem',     // 104px
        '30': '7.5rem',     // 120px
        '34': '8.5rem',     // 136px
      },

      // ========================================
      // 響應式斷點
      // ========================================
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',

        // 特殊用途
        'tablet': '768px',
        'laptop': '1024px',
        'desktop': '1280px',
      },

      // ========================================
      // 陰影系統
      // ========================================
      boxShadow: {
        // 輕量陰影
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',

        // 內陰影
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        'inner-md': 'inset 0 4px 8px 0 rgb(0 0 0 / 0.1)',

        // 無陰影
        'none': 'none',
      },

      // ========================================
      // 圓角系統
      // ========================================
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',    // 4px
        'DEFAULT': '0.5rem', // 8px
        'md': '0.75rem',    // 12px
        'lg': '1rem',       // 16px
        'xl': '1.25rem',    // 20px
        '2xl': '1.5rem',    // 24px
        '3xl': '2rem',      // 32px
        'full': '9999px',
      },

      // ========================================
      // 動畫系統
      // ========================================
      transitionDuration: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },

      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ease-in-out-quad': 'cubic-bezier(0.45, 0, 0.55, 1)',
        'ease-out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      // 關鍵幀動畫
      keyframes: {
        // 淡入
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // 淡出
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        // 由下滑入
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        // 由上滑入
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        // 由左滑入
        'slide-right': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        // 由右滑入
        'slide-left': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        // 縮放進入
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        // 旋轉
        'spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        // 彈跳
        'bounce': {
          '0%, 100%': {
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
        // 脈衝
        'pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },

      animation: {
        // 淡入淡出
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-out',

        // 滑動
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'slide-right': 'slide-right 0.3s ease-out',
        'slide-left': 'slide-left 0.3s ease-out',

        // 縮放
        'scale-in': 'scale-in 0.2s ease-out',

        // 旋轉與循環動畫
        'spin': 'spin 1s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce': 'bounce 1s infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      // ========================================
      // Z-Index 層級系統
      // ========================================
      zIndex: {
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'notification': '1080',
        'max': '9999',
      },

      // ========================================
      // 無障礙相關
      // ========================================
      // 最小觸控目標尺寸
      minHeight: {
        'touch': '44px',      // WCAG 2.1 AA 標準
        'touch-comfortable': '56px', // 更舒適的觸控尺寸
      },

      minWidth: {
        'touch': '44px',
        'touch-comfortable': '56px',
      },

      // ========================================
      // 文字截斷 Utilities
      // ========================================
      // (使用 @layer utilities 定義，見下方)
    },
  },

  // ========================================
  // Plugins
  // ========================================
  plugins: [
    // 文字截斷工具
    function({ addUtilities }) {
      const newUtilities = {
        // 單行截斷
        '.line-clamp-1': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '1',
        },
        // 雙行截斷
        '.line-clamp-2': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '2',
        },
        // 三行截斷
        '.line-clamp-3': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '3',
        },
        // 取消截斷
        '.line-clamp-none': {
          overflow: 'visible',
          display: 'block',
          '-webkit-box-orient': 'horizontal',
          '-webkit-line-clamp': 'none',
        },
      };

      addUtilities(newUtilities, ['responsive']);
    },

    // 可選：Tailwind 官方表單外掛
    // require('@tailwindcss/forms'),

    // 可選：Tailwind 官方排版外掛
    // require('@tailwindcss/typography'),
  ],
};
