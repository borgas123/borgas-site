import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({ site: 'https://borgas.us', integrations: [sitemap({filter:page=>!page.endsWith('/404/')})], trailingSlash: 'always' });
