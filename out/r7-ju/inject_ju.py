#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""菊花判据的反向注入标定：把 plant-ju 换成被否掉的版本，确认判据真的会红。

为什么必须做：判据「现在通过」不代表它会红。上一轮的教训是——小程序「菊有茎」那条
写成「有 stroke + 有 V 段」，拿被否的太阳版注入时照样 PASS（旧版太阳本来就有 stroke 和
纵向 V 段），是空转断言。所以每加一条新判据，都要拿被否的实现注入一次。

用法：
  python out/r7-ju/inject_ju.py f-origin     # 换回枯木选定但 24px 会糊的原稿 F
  python out/r7-ju/inject_ju.py git <rev>    # 换回某个提交里的 plant-ju（如 f1e0529 = 太阳版 / 888cea4 = 折枝版）
  python out/r7-ju/inject_ju.py restore      # 从 _ju_index_backup.html 还原
"""
import pathlib
import re
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
IDX = ROOT / 'index.html'
BAK = pathlib.Path(__file__).resolve().parent / '_ju_index_backup.html'
BEGIN = '<symbol id="plant-ju" viewBox="0 0 24 24">'
END = '</symbol>'
PAT = re.compile(re.escape(BEGIN) + r'.*?' + re.escape(END), re.S)


def current() -> str:
    m = PAT.search(IDX.read_text(encoding='utf-8'))
    return m.group(0) if m else ''


def write(block: str):
    html = IDX.read_text(encoding='utf-8')
    if not BAK.exists():
        shutil.copy2(IDX, BAK)
        print('  （已备份原 index.html → %s）' % BAK.name)
    IDX.write_text(PAT.sub(lambda _: block, html, count=1), encoding='utf-8')


def from_git(rev: str) -> str:
    src = subprocess.run(['git', '-C', str(ROOT), 'show', '%s:index.html' % rev],
                         capture_output=True, text=True, encoding='utf-8', check=True).stdout
    m = PAT.search(src)
    if not m:
        sys.exit('✗ 提交 %s 里找不到 plant-ju' % rev)
    return m.group(0)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    mode = sys.argv[1]
    if mode == 'restore':
        if not BAK.exists():
            sys.exit('✗ 没有备份可还原')
        shutil.copy2(BAK, IDX)
        print('✓ 已还原 index.html')
        return
    if mode == 'f-origin':
        sys.path.insert(0, str(ROOT / 'tools'))
        from ju_fix import F_origin, C
        write(BEGIN + '\n  ' + F_origin().replace(C, 'currentColor') + '\n' + END)
        print('✓ 已注入 F 原稿（15 外 + 11 内，24px 应糊）')
        return
    if mode == 'git':
        if len(sys.argv) < 3:
            sys.exit('✗ 用法：inject_ju.py git <rev>')
        write(from_git(sys.argv[2]))
        print('✓ 已注入 %s 的 plant-ju' % sys.argv[2])
        return
    sys.exit(__doc__)


if __name__ == '__main__':
    main()
