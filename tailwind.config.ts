import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ============================================
      // VIBECOIN DESIGN SYSTEM: 3 Palettes
      // 1. Botanical (background) - green/cream
      // 2. Card (playing cards) - vermilion/sage
      // 3. Achievement (tattoo flash) - amber/red
      // ============================================
      colors: {
        // ---- BOTANICAL BACKGROUND PALETTE ----
        botanical: {
          50: '#F0FBF1',
          100: '#DFF6E2',
          200: '#BFECC4',
          300: '#94D8A0',
          400: '#6BBF7A',
          500: '#4DA65A',
          600: '#3C914C',
          700: '#2F7F3E',
          800: '#1F6A2F',
          900: '#155124',
          950: '#0B2C12',
        },
        sand: {
          50: '#FFFDF0',
          100: '#FDF8DF',
          200: '#F7F4D0',
          300: '#EFE7B8',
          400: '#E3D58F',
          500: '#D2BB66',
          600: '#B4974B',
          700: '#8E713A',
          800: '#6E5730',
          900: '#574628',
          950: '#2F2517',
        },
        warmGray: {
          50: '#FAFAF7',
          100: '#F2F2EC',
          200: '#E6E5DB',
          300: '#D2D0C2',
          400: '#B7B4A2',
          500: '#9A9783',
          600: '#7C7967',
          700: '#5F5C4E',
          800: '#3E3C34',
          900: '#24231F',
          950: '#141310',
        },

        // ---- PLAYING CARD PALETTE ----
        card: {
          // Vermilion/red-orange (suit colors, flowers, ribbon)
          primary: {
            50: '#FDF1EF',
            100: '#FBE5E1',
            200: '#F7CBC4',
            300: '#F2ACA0',
            400: '#EC8674',
            500: '#E45239',
            600: '#C94832',
            700: '#AB3E2B',
            800: '#893122',
            900: '#67251A',
          },
          // Sage green (foliage)
          secondary: {
            50: '#F6F7F6',
            100: '#EFF1EE',
            200: '#DFE2DD',
            300: '#CBD1C9',
            400: '#B3BCB1',
            500: '#939F8F',
            600: '#818C7E',
            700: '#6E776B',
            800: '#585F56',
            900: '#424840',
          },
        },

        // ---- ACHIEVEMENT/TATTOO PALETTE ----
        tattoo: {
          // Warm amber/orange (hands, badges, brass)
          primary: {
            50: '#FFF4E6',
            100: '#FFE7CC',
            200: '#FFD199',
            300: '#FFB866',
            400: '#FFA13D',
            500: '#F28C28',
            600: '#D9731F',
            700: '#B85B18',
            800: '#8F4412',
            900: '#6B330D',
          },
          // Tattoo red (blood, wings, ribbons)
          secondary: {
            50: '#FFF1F2',
            100: '#FFD1D5',
            200: '#FF9AA3',
            300: '#FF6B74',
            400: '#F24A4E',
            500: '#E53935',
            600: '#CC2F2B',
            700: '#A82723',
            800: '#7A1E1A',
            900: '#531310',
          },
        },

        // ---- UI ACCENT COLORS ----
        accent: {
          link: '#2563EB',
          danger: '#EF4444',
          warning: '#F59E0B',
          success: '#22C55E',
        },
      },

      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      borderRadius: {
        'ui-sm': '8px',
        'ui-md': '12px',
        'ui-lg': '16px',
        'ui-xl': '20px',
      },

      boxShadow: {
        'ui-sm': '0 1px 2px rgba(20, 19, 16, 0.10)',
        'ui-md': '0 8px 20px rgba(20, 19, 16, 0.14)',
        'ui-lg': '0 18px 50px rgba(20, 19, 16, 0.18)',
        'card': '0 4px 12px rgba(46, 43, 42, 0.25)',
        'card-hover': '0 12px 24px rgba(46, 43, 42, 0.35)',
      },

      backgroundSize: {
        'pattern-sm': '560px 560px',
        'pattern-md': '720px 720px',
        'pattern-lg': '840px 840px',
      },

      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
