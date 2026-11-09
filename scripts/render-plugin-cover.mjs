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
const entryRoot = manifest.entry.includes('/') ? manifest.entry.slice(0, manifest.entry.lastIndexOf('/')) : '';
const screenshot = manifest.screenshots?.[0];
const coverPath = screenshot ? [entryRoot, screenshot].filter(Boolean).join('/') : null;
if (!coverPath || !zip.getEntry(coverPath)) throw new Error('primary cover not found in archive');
const cover = buildPluginCover(manifest, zip.readAsText(coverPath), manifest.category);
if (!cover) throw new Error('embedded screenshot not found in primary cover');
writeFileSync(outputPath, cover, 'utf8');
console.log(outputPath);
