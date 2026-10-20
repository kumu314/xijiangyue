// #120 判定器：例外表（x 54 / b 13 / 衍文删尾 9）+ 默认机械规则 + 终态模拟校验
import { readFileSync, writeFileSync } from 'fs';
const T = 'D:/AgentHub/temp/xjy-120-feihua/';
const cands = JSON.parse(readFileSync(T + 'candidates_120.json', 'utf8'));
const RE_NUM = /^[一二三四五六七八九十百千零〇两0-9\d]+$/;
const id = c => c.k + '#' + c.i;

// ============ 例外表 ============
// (x) 54 条：补字/衍文歧义，停报
const X = {
  '思#1202':'弈/奕形近重文，插入得「弈奕」两读',
  '月#1431':'宵/霄形近两可，插入得「宵霄」',
  '长#1390':'宵/霄形近两可，插入得「宵霄」','流#1224':'宵/霄形近两可，插入得「宵霄」','恨#949':'宵/霄形近两可，插入得「宵霄」',
  '红#1102':'瓣/辨形近两可，插入得「瓣辨」',
  '寒#1097':'墓/慕形近两可，插入得「墓慕」',
  '清#1208':'鉴/鉴重文，插入得「鉴鉴」',
  '清#1292':'慕/募形近两可，插入得「慕募」',
  '玉#1237':'峰/峰重文，插入得「峰峰」',
  '燕#939':'燕/燕重文（「石燕」为词），删留两读','雨#1192':'燕/燕重文（「石燕」为词），删留两读',
  '归#1253':'沧/苍形近两可，插入得「沧苍」','海#1072':'沧/苍形近两可，插入得「沧苍」',
  '长#1426':'杨/阳形近两可（「长杨」为宫名），需底本',
  '白#1281':'伯/白形近两可（「伯牙琴」），需底本',
  '心#1375':'忡/冲两可，插入得「忡冲」',
  '松#977':'风/飒重文歧义（萧飒/风飒），删留两读',
  '雪#1063':'幢/憧去留两读（「碧油幢」为帐名）',
  '玉#1271':'中段「庄」+收尾「成」疑衍，删界不清',
  '玉#1261':'中段「册」+收尾「玉」疑衍，删界不清',
  '心#1432':'「目」夹于「自」「由」之间，疑为「自由」之衍/讹',
  '心#1457':'「滴」夹于「谪」「仙」之间，疑为「谪仙」之衍/讹','草#1164':'「滴」夹于「谪」「仙」之间，疑为「谪仙」之衍/讹',
  '香#1117':'收尾「木」疑衍（「一轮中」），删界不清',
  '清#1151':'「目」疑衍（「缓转腾波」），删界不清','波#968':'「目」疑衍（「缓转腾波」），删界不清',
  '海#1109':'「徙中」疑衍（「脱屣」），删界不清',
  '雨#1195':'双括号 + 收尾「细」疑衍，删界不清','烟#1121':'双括号 + 收尾「细」疑衍，删界不清',
  '长#1367':'双括号（里/展）且整句残乱',
  '鸟#1016':'双括号（百/投）形近残乱',
  '舟#944':'「几」兼具疑问词与计数号二象',
  '梦#1048':'占梦书散文体非诗句，补字性质需核底本',
  '月#1423':'「三白日」与「忻三日」两读，需底本','白#1267':'「三白日」与「忻三日」两读，需底本',
  '心#1318':'去括号后 4 字，卡 (a)②≥5 下限；疑《诗经》短句或残句','梦#1007':'去括号后 4 字，卡 (a)②≥5 下限；疑残句','梦#1018':'去括号后 4 字，卡 (a)②≥5 下限；疑残句',
  '愁#1134':'去括号后 4 字，卡 (a)②≥5 下限；疑残句','玉#1182':'去括号后 4 字，卡 (a)②≥5 下限；疑残句','金#1168':'去括号后 4 字，卡 (a)②≥5 下限；疑残句',
  '烟#245':'去括号后 3 字，残片',
  '秋#1161':'[棹歌]疑为曲名注而非补字','归#1287':'[棹歌]疑为曲名注而非补字',
  '水#1434':'[湘江]疑为地名注而非补字','江#1217':'[湘江]疑为地名注而非补字',
  '心#1360':'[惆怅]疑为衍文/题注而非补字',
  '柳#1015':'[和轻]性质不明（补字/注记两可）',
  '白#1277':'[蹈白刃兮]五字括注疑为引文',
  '寒#1089':'双括号混合（[也自鸣]文注 + [八]编号）',
  '星#980':'六字括注内嵌 key 字，性质难定',
  '情#1128':'双括号（[衲]补字 + [薄世]注记）',
  '恨#957':'[蹄痕]后接「啼恨」，删界不清',
};
// (b) 13 条
const B = {
  '夜#1097':'★同 key 已有干净版「君王夜醉春眠晏」，剔括号版','夜#1207':'★同 key 已有干净版「青楼月夜长寂寞」，剔括号版',
  '水#1297':'★同 key 已有干净版「白水方祼」，剔括号版','长#1252':'★同 key 已有干净版「御泉长绕凤皇楼」，剔括号版',
  '长#1450':'★同 key 已有干净版「青楼月夜长寂寞」，剔括号版','白#1116':'★同 key 已有干净版「白水方祼」，剔括号版',
  '香#1043':'★同 key 已有干净版「直内初烧玉案香」，剔括号版','海#990':'★同 key 已有干净版「海渎常晏」，剔括号版',
  '金#1233':'★同 key 已有干净版「催启五门金锁」，剔括号版',
  '灯#906':'校勘记「从灯录改」内嵌唯一 key 字「灯」，删注后不含 key；注记混杂残文',
  '灯#931':'校勘记「从灯录改」内嵌唯一 key 字「灯」，删注后不含 key；注记混杂残文',
  '灯#1009':'校勘记「从五灯会元改」内嵌唯一 key 字「灯」，删注后不含 key；注记混杂残文',
  '柳#1047':'编号删除后与同 key 已有干净条目「川长复垂柳」重复，按闸剔括号版保留干净版','长#1311':'编号删除后与同 key 已有干净条目「川长复垂柳」重复，按闸剔括号版保留干净版',
  '书#1231':'校勘记「从黄书本改」内嵌唯一 key 字「书」，删注后「绝虑忘志」4 字且不含 key',
};
// 衍文删尾 (a) 9 条：括号正常处理后再删指定收尾衍文
const TAILDEL = {
  '月#1413':'非','江#1253':'非','雨#1200':'十','海#1086':'十','玉#1248':'咸',
  '长#1398':'受','金#1316':'震','心#1423':'非非','心#1425':'饱',
};

// ============ 判定 ============
const decs = cands.map(c => {
  const key = id(c);
  if (B[key]) return { ...c, disp: 'b', mode: 'del', final: null, reason: B[key] };
  if (X[key]) return { ...c, disp: 'x', mode: 'keep', final: null, reason: X[key] };
  let final, mode, reason;
  if (c.inner.split('|').every(s => RE_NUM.test(s))) {
    final = c.e.replace(/\[[^\]]*\]/g, ''); mode = 'drop';
    reason = `括号内为序号/计数（${c.inner.split('|').map(s=>'['+s+']').join('')}），按口径删除括号片段得干净串`;
  } else {
    final = c.e.replace(/\[([^\]]*)\]/g, '$1'); mode = 'brack';
    reason = `括号内为校勘补字（${c.inner.split('|').map(s=>'['+s+']').join('')}），去括号保留补字得干净串`;
  }
  if (TAILDEL[key]) { const t = TAILDEL[key]; if (!final.endsWith(t)) throw new Error('尾删断言失败 ' + key + ' ' + final); final = final.slice(0, -t.length); reason += `；再删收尾衍文「${t}」`; mode = 'brack+tail'; }
  return { ...c, disp: 'a', mode, final, reason };
});

// ============ 自校验 ============
const cnt = { a: 0, b: 0, x: 0 };
for (const d of decs) cnt[d.disp]++;
console.log('判定分布 =', JSON.stringify(cnt), '（期望 a241/b15/x54）');
// (a) 四条判据
for (const d of decs.filter(d => d.disp === 'a')) {
  if (/[\[\]]/.test(d.final)) throw new Error('(a) 残留括号 ' + id(d));
  if (!d.final.includes(d.k)) throw new Error('(a) 不含 key ' + id(d));
  if (d.final.length < 5) throw new Error('(a) <5字 ' + id(d));
  if (X[id(d)] || B[id(d)]) throw new Error('(a) 撞例外表 ' + id(d));
}
// 例外表全覆盖检查
const candIds = new Set(cands.map(id));
for (const k of [...Object.keys(X), ...Object.keys(B)]) if (!candIds.has(k)) throw new Error('例外表越界 ' + k);
console.log('(a) 四判据全过；例外表', Object.keys(X).length, '+', Object.keys(B).length, '全部命中候选');

// ============ 终态模拟 ============
const lines = readFileSync('D:/ZCode/小程序/xijiangyue/index.html', 'utf8').split(/\r?\n/);
const FH = JSON.parse(lines[752].trim());
const byKey = {};
for (const d of decs) { (byKey[d.k] = byKey[d.k] || []).push(d); }
const delSet = new Set(decs.filter(d => d.disp === 'b').map(id));
const repMap = new Map(decs.filter(d => d.disp === 'a').map(d => [id(d), d.final]));
let nDel = 0, nRep = 0;
for (const k of Object.keys(FH.lines)) {
  const arr = [];
  FH.lines[k].forEach((e, i) => {
    const key = k + '#' + i;
    if (delSet.has(key)) { nDel++; return; }
    if (repMap.has(key)) { arr.push(repMap.get(key)); nRep++; return; }
    arr.push(e);
  });
  FH.lines[k] = arr;
}
console.log('终态：删除', nDel, '替换', nRep);
let post = 0; const postDetail = [];
for (const k of Object.keys(FH.lines)) {
  const seen = new Map();
  for (const e of FH.lines[k]) { const s = e.replace(/[，。！？、；：「」''《》（）——…·〔〕()\[\]{}\s]/g, ''); if (seen.has(s)) { post++; postDetail.push(k + ': ' + s + ' (' + seen.get(s) + ' / ' + e + ')'); } else seen.set(s, e); }
}
console.log('终态同 key STRIP 重复 =', post, '（预存 15 − 方括号 9 = 期望 6，且无新增）');
postDetail.forEach(d => console.log('   ', d));
let total = 0; for (const k of Object.keys(FH.lines)) total += FH.lines[k].length;
console.log('终态池 =', total, '（期望 71731 − 13 = 71718）');
console.log('keys =', Object.keys(FH.lines).length, '单 key 非空 =', Object.keys(FH.lines).every(k => FH.lines[k].length > 0));
// (b)/(x) 在位性
for (const d of decs.filter(d => d.disp === 'b')) if (FH.lines[d.k].includes(d.e)) throw new Error('(b) 未删 ' + id(d));
for (const d of decs.filter(d => d.disp === 'x')) if (!FH.lines[d.k].includes(d.e)) throw new Error('(x) 被改 ' + id(d));
console.log('(b) 全部不在池 / (x) 全部原样在位：PASS');
writeFileSync(T + 'decisions_120.json', JSON.stringify(decs, null, 1));
console.log('已写 decisions_120.json');
