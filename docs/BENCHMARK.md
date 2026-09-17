# 性能基线记录

> 用途：记录改造前后的真实数据，作为简历与面试的证据
> 环境：本地单机（应用 + Postgres 同机），Postgres 容器，200 并发 × curl

---

## 测试方法

```bash
# 1. 创建一条短链，拿到 shortUrl
# 2. 记录当前 click_count
# 3. 发起 N 个并发跳转
seq 1 200 | xargs -P 20 -I {} curl -s -o /dev/null "http://localhost:8081/{shortUrl}"
# 4. 对比 click_count 与 click_event 的行数
```

---

## 基线（改造前）—— 2026-09-16

### 单次跳转的数据库操作

```text
SELECT  url_mapping WHERE short_url = ?
UPDATE  url_mapping SET click_count = click_count + 1
INSERT  click_event
```

每次跳转 = **1 次读 + 2 次写**。

### 200 并发跳转结果

| 指标 | 实测值 |
|---|---|
| 耗时 | 0.70 秒 |
| 吞吐 | **284 req/s** |
| click_event 流水条数 | 203（准确）|
| click_count 实际增加 | **16** |
| click_count 期望增加 | 200 |
| **丢失率** | **92%** |
| 数据是否自洽 | ❌ 不一致（流水 203 条 vs 计数 19）|

### 问题定位

```text
问题 1：丢更新（最严重）
  click_count = click_count + 1 是「读-改-写」，非原子
  并发下互相覆盖 → 200 次点击只记录 16 次

问题 2：写放大
  每次跳转 2 次写库，其中 click_event 是流水，与跳转本身无关

问题 3：无缓存
  短链是读多写少场景，但每次跳转都要查库
```

---

## 优化目标

| 目标 | 手段 | 预期 |
|---|---|---|
| 消除丢更新 | Redis INCR（原子） | 丢失率 0% |
| 消除写放大 | Kafka 异步写流水 | 跳转路径 0 写入 |
| 降低读压力 | Redis 缓存短链映射 | 命中后不查库 |
| 提升吞吐 | 上述三项叠加 | 待测 |

---

## 优化后（待填写）

| 指标 | 实测值 |
|---|---|
| 吞吐 | |
| click_count 丢失率 | |
| 数据是否自洽 | |
| 单次跳转 DB 操作数 | |
