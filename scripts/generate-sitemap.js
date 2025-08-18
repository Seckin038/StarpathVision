import { promises as fs } from 'fs';
import path from 'path';

const baseUrl = process.env.SITE_URL || 'https://example.com';
const pagesDir = path.join(process.cwd(), 'src', 'pages');
const outPath = path.join(process.cwd(), 'public', 'sitemap.xml');

function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

(async () => {
  const files = await fs.readdir(pagesDir);
  const routes = files
    .filter(f => f.endsWith('.tsx'))
    .map(f => f.replace(/\.tsx$/, ''))
    .filter(name => name.toLowerCase() !== 'notfound')
    .map(name => (name.toLowerCase() === 'index' ? '/' : '/' + toKebabCase(name)));

  routes.sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)));

  const urls = routes
    .map(route => `  <url><loc>${baseUrl}${route}</loc></url>`)
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>\n`;

  await fs.writeFile(outPath, sitemap);
})();
