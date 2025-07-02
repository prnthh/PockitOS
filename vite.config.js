import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'PockitOS', // Global variable name for UMD in browsers
      fileName: (format) => `index.${format}.js`,
      formats: ['umd'], // Output UMD format
    },
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild', // Vite uses esbuild for fast minification
  },
});