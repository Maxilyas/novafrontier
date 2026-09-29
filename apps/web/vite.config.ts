import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte()],
  build: {
    // pixi.js forme un morceau d'environ 600 Ko, charge seulement a l'ouverture d'un ecran a
    // scene (research R10) : il ne pese pas sur le premier chargement (SC-003).
    chunkSizeWarningLimit: 700,
  },
});
