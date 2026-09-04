// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * `site` is the only value that changes when the custom domain arrives.
 * `base` stays '/' forever because this is a GitHub *user site*
 * (EduardoTBuss.github.io), not a project site. See docs/DOMAIN.md.
 */
export default defineConfig({
  site: 'https://eduardotbuss.github.io',
  base: '/',
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
