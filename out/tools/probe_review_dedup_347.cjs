// #347 verifier 探针：独立复现「温故 pick 与新学指针撞 id」场景，不采信自报。
// 只读产品代码，不改产品文件。
const MP = 'D:/WorkBuddyData/WorkBuddy/2026-07-25-14-20-30/shiyun-miniprogram';
let STORE = {};
globalThis.wx = {
  getStorageSync: (k) => (k in STORE ? JSON.parse(JSON.stringify(STORE[k])) : ''),
  setStorageSync: (k, v) => { STORE[k] = JSON.parse(JSON.stringify(v)); }
};
const RQ = require(MP + '/utils/reviewQueue.js');
function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function dayOffset(n) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return iso(d); }
const INDEX = Array.from({ length: 12 }, (_, i) => ({ id: 'q' + String(i).padStart(2, '0'), title: '第' + i + '首', author: '佚名', category: '诗词' }));
INDEX[2].category = '外国诗'; INDEX[5].category = '外国诗';

function scenario(name, pickId, pointerPos) {
  STORE = {};
  if (pickId) {
    STORE.shiyun_review = { [pickId]: { bucket: 0, due: dayOffset(-1), last: '', ln: 3 } };
    STORE.shiyun_review_pick = { date: RQ.localDay(), id: pickId, kind: 'due' };
  }
  STORE.shiyun_pointer = { pos: pointerPos };
  const t = RQ.buildDailyTasks(INDEX);
  const shape = t.map(x => x.id + '(' + x.kind + ')');
  const dup = new Set(t.map(x => x.id)).size !== t.length;
  console.log(name.padEnd(34) + ' => ' + JSON.stringify(shape) + '  总=' + t.length + ' 新学=' + t.filter(x => x.kind === 'new').length + ' 重复=' + dup);
  return t;
}

console.log('=== #347 去重副作用探针（实测，非自报） ===');
scenario('S1 空队列 指针q00（正常基线）', null, 0);
scenario('S2 pick=q00 指针q00（正面撞）', 'q00', 0);
scenario('S3 pick=q01 指针q00（p2撞）', 'q01', 0);
scenario('S4 pick=q00 指针q01（温故撞p2）', 'q00', 1);
