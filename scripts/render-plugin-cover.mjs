import { readFileSync, writeFileSync } from 'node:fs';
import AdmZip from 'adm-zip';
import { buildPluginCover } from '../server/plugin-cover.mjs';

const [archivePath, outputPath] = process.argv.slice(2);
if (!archivePath || !outputPath) {
  console.error('Usage: node scripts/render-plugin-cover.mjs <plugin.zip> <cover.svg>');
  process.exit(1);
}

const zip = new AdmZip(archivePath);
const manifest = JSON.parse(zip.readAsText('manifest.json'));
const coverPath = zip.getEntries().map((entry) => entry.entryName).find((name) => name.endsWith('/cover-v2.svg'));
if (!coverPath) throw new Error('cover-v2.svg not found in archive');
const cover = buildPluginCover(manifest, zip.readAsText(coverPath), manifest.category);
if (!cover) throw new Error('embedded screenshot not found in cover-v2.svg');
writeFileSync(outputPath, cover, 'utf8');
console.log(outputPath);
