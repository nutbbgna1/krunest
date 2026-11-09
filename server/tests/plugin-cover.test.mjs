import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPluginCover, extractCoverScreenshot } from '../plugin-cover.mjs';

const source = '<svg><image href="data:image/png;base64,aGVsbG8=" x="0" y="0"/></svg>';

test('cover generator keeps the screenshot and safely renders plugin metadata', () => {
  const manifest = {
    name: 'ระบบ <ครู>', category: 'games-activities', access: 'max',
    program: { thaiName: 'ระบบ <ครู>' },
    highlights: ['เปิดใช้งานผ่านเว็บได้ทันที', 'ข้อมูลแยกตามบัญชีผู้ใช้', 'มีคู่มือ PDF'],
  };
  assert.equal(extractCoverScreenshot(source), 'data:image/png;base64,aGVsbG8=');
  const cover = buildPluginCover(manifest, source, 'เกมและกิจกรรม');
  assert.match(cover, /data:image\/png;base64,aGVsbG8=/);
  assert.match(cover, /ระบบ &lt;ครู&gt;/);
  assert.match(cover, /ULTIMATE/);
  assert.match(cover, /#db2777/);
  assert.doesNotMatch(cover, /ระบบ <ครู>/);
});

test('cover generator returns null when the source has no embedded screenshot', () => {
  assert.equal(buildPluginCover({ name: 'x' }, '<svg/>'), null);
});
