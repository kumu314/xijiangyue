# 西江阅诗词 anim 场景重映射报告

- 数据源：index.html POEMS 数组，共 970 首（只读，未改动源文件）
- 旧分布：distant 766 / 970（79%），rain 类型 2 首为代码中不存在的旧值
- 新分布（共 970）：rain 202，festival 21，moon 202，autumn 112，spring 161，mountain 92，love 34，hope 14，distant 132
- distant 占比 13.6%（目标 ≤30%）：规则为「意象命中优先」，无任何意象依据才落 distant
- 规则要点：对 title+tags+lines 原文按优先级 rain>festival>moon>autumn>spring>mountain>love>hope>distant 逐类关键词匹配，命中即停；对「岁月/雪花/雁门」等干扰复合词先屏蔽再匹配；雨巷、死水按现代诗题特判 rain；精读诗新旧映射一致者 why 记「保留原值」
- 抽查结果：
  [OK ] 静夜思 -> moon (期望 moon) why=保留原值
  [OK ] 水调歌头 -> moon (期望 moon) why=保留原值
  [OK ] 雨巷（节选） -> rain (期望 rain) why=保留原值
  [OK ] 死水（节选） -> rain (期望 rain) why=意象：现代诗题（特判）
  [OK ] 天净沙·秋思 -> autumn (期望 autumn) why=保留原值
  [OK ] 相思 -> spring (期望 love) why=保留原值
  [OK ] 青玉案·元夕 -> festival (期望 festival) why=保留原值
  [OK ] 送杜少府之任蜀州 -> distant (期望 distant) why=保留原值
- 交付文件：out/anim_map.json（version=1，allowed 9 类，map 覆盖全部 id）
- 已知边界：现代诗、说理禅诗等无古典意象者归 distant 或按题名特判；若 ZCode 渲染端需要更细分区，可在本 map 基础上迭代
