// FILE: postcss.config.mjs

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {
      // This tells Tailwind v4 where to find your classes
      content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
      ],
      theme: {
        extend: {},
      },
      plugins: [],
    }
  }
}

export default config;
