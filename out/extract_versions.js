// 提取两版 index.html 原始字节（供复核脚本使用）
const cp = require('child_process');
const fs = require('fs');
const REPO = 'D:/ZCode/小程序/xijiangyue';
function extract(rev, out) {
  const buf = cp.execSync(`git -C "${REPO}" show ${rev}:index.html`, { maxBuffer: 1 << 30 });
  fs.writeFileSync(out, buf);
  console.log(out, buf.length, 'bytes');
}
extract('97bb09b', 'parent_index.html');
extract('7dc2848', 'target_index.html');
