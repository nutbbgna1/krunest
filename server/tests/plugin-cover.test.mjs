import test from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildPluginCover, extractCoverScreenshot } from '../plugin-cover.mjs';
import { describePluginVisual, mappedVisualSlugs } from '../plugin-visuals.mjs';

const source = '<svg><image href="data:image/png;base64,aGVsbG8=" x="0" y="0"/></svg>';

test('cover generator keeps the screenshot and safely renders plugin metadata', () => {
  const manifest = {
    slug: 'vs-random-picker', name: 'ระบบ <ครู>', category: 'games-activities', access: 'max',
    program: { thaiName: 'ระบบ <ครู>' },
    highlights: ['เปิดใช้งานผ่านเว็บได้ทันที', 'ข้อมูลแยกตามบัญชีผู้ใช้', 'มีคู่มือ PDF'],
  };
  assert.equal(extractCoverScreenshot(source), 'data:image/png;base64,aGVsbG8=');
  const cover = buildPluginCover(manifest, source, 'เกมและกิจกรรม');
  assert.match(cover, /\/plugin-cover-art\/vs-random-picker\.webp/);
  assert.match(cover, /ระบบ &lt;ครู&gt;/);
  assert.match(cover, /ULTIMATE/);
  assert.match(cover, /#db2777/);
  assert.doesNotMatch(cover, /ระบบ <ครู>/);
});

test('Chinese worksheet gets a subject-specific worksheet illustration', () => {
  const manifest = { slug: 'vs-chinese-worksheet', name: 'โปรแกรมสร้างใบงานภาษาจีน', category: 'academic-curriculum' };
  const cover = buildPluginCover(manifest, source, 'วิชาการและหลักสูตร');
  assert.match(cover, /\/plugin-cover-art\/vs-chinese-worksheet\.webp/);
});

test('semantic visual catalog covers all 130 plugins without duplicates', () => {
  assert.equal(mappedVisualSlugs.length, 130);
  assert.equal(new Set(mappedVisualSlugs).size, 130);
  assert.equal(describePluginVisual({ slug: 'missing' }).mapped, false);
});

test('every mapped plugin has a production-ready generated WebP cover', () => {
  for (const slug of mappedVisualSlugs) {
    const stats = statSync(resolve('public/plugin-cover-art', `${slug}.webp`));
    assert.ok(stats.size > 50_000, `${slug} cover is unexpectedly small`);
  }
});

test('cover generator returns null when the source has no embedded screenshot', () => {
  assert.equal(buildPluginCover({ name: 'x' }, '<svg/>'), null);
});
