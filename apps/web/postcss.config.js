/*
 * PostCSS config — registers Tailwind + Autoprefixer so Next.js actually
 * processes the @tailwind directives in app/globals.css. Without this file,
 * Next ships the raw @tailwind/@apply rules and the app renders unstyled.
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
