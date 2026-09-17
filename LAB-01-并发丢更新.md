# 实验 01：量化并发丢更新

> 目标：亲手复现并量化"`click_count = click_count + 1` 在并发下会丢数据"这个问题
> 环境：本地短链应用（8081）+ Postgres 容器
> 产出：一组可信的基线数据，写进 BENCHMARK.md，用于面试

---

## 一、实验原理（先看懂再做）

### 一条 SQL 看起来是一步，实际是三步

```java
urlMapping.setClickCount(urlMapping.getClickCount() + 1);
urlMappingRepository.save(urlMapping);
```

这三行在数据库看来是：

```text
1. SELECT click_count FROM url_mapping WHERE id = 1     → 拿到 19
2. Java 内存里算：19 + 1 = 20
3. UPDATE url_mapping SET click_count = 20 WHERE id = 1
```

### 并发时会发生什么

```text
时刻  线程A                      线程B                    click_count 实际值
────────────────────────────────────────────────────────────────────────
t1    读到 19                                              19
t2                              读到 19                    19
t3    算出 20                                              19
t4                              算出 20                    19
t5    写入 20                                              20
t6                              写入 20                    20   ← 应该是 21！

结果：两次点击，只记了 1 次。丢掉的一次永远不会回来。
```

这就是 **Lost Update（丢更新）**。

### 关键观察点

```text
✅ click_event 流水表：每次 INSERT 都是新行，不会丢 → 数据准确
❌ url_mapping.click_count：读-改-写，会互相覆盖 → 数据丢失
```

**两个表的数据应该一致，如果不一致，就证明丢更新发生了。**

---

## 二、实验步骤

### 步骤 0：准备环境变量

打开一个终端，粘贴以下内容（后续命令都依赖这些变量）：

```bash
export API=http://localhost:8081
export PG="docker exec shortener-postgres psql -U shortener -d url_shortener_db"
```

验证变量生效：

```bash
echo "API=$API"
$PG -c "SELECT 1;"
```

---

### 步骤 1：造一条干净的测试数据

**1.1 注册一个实验账号**

```bash
curl -s -X POST $API/api/auth/public/register \
  -H "Content-Type: application/json" \
  -d '{"username":"lab","password":"123456","email":"lab@test.com","role":["user"]}'
```

预期输出（重复执行会提示已存在，忽略即可）：

```json
{"message":"用户注册成功"}
```

**1.2 登录拿 token**

```bash
export TOKEN=$(curl -s -X POST $API/api/auth/public/login \
  -H "Content-Type: application/json" \
  -d '{"username":"lab","password":"123456"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

echo "TOKEN 前 30 位: ${TOKEN:0:30}..."
```

预期：打印出一串 JWT。

**1.3 创建一条短链**

```bash
export SHORT=$(curl -s -X POST $API/api/urls/shorten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"originalUrl":"https://example.com/lab-test"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['shortUrl'])")

echo "本次实验的短链代码: $SHORT"
```

预期：打印 8 位随机字符串，例如 `Ab3xK9mZ`。

**1.4 确认初始状态（应该是 0）**

```bash
$PG -c "SELECT short_url, click_count FROM url_mapping WHERE short_url='$SHORT';"
$PG -c "SELECT COUNT(*) AS 流水条数 FROM click_event ce
        JOIN url_mapping um ON ce.url_mapping_id = um.id
        WHERE um.short_url='$SHORT';"
```

预期：`click_count = 0`，流水条数 = 0。

---

### 步骤 2：观察「一次跳转 = 几次数据库操作」

这是理解一切的基础。我们用 Postgres 自带的统计表来观察。

**2.1 记录跳转前的数据库统计**

```bash
$PG -c "SELECT relname AS 表, idx_scan AS 索引扫描, n_tup_upd AS 更新, n_tup_ins AS 插入
        FROM pg_stat_user_tables
        WHERE relname IN ('url_mapping','click_event') ORDER BY relname;"
```

把这个数字**抄下来**（后面要对比）。

**2.2 只跳转一次**

```bash
curl -s -o /dev/null -w "HTTP状态: %{http_code}\n跳转目标: %{redirect_url}\n" $API/$SHORT
```

预期：

```text
HTTP状态: 302
跳转目标: https://example.com/lab-test
```

**2.3 再记录一次统计，看差值**

```bash
$PG -c "SELECT relname AS 表, idx_scan AS 索引扫描, n_tup_upd AS 更新, n_tup_ins AS 插入
        FROM pg_stat_user_tables
        WHERE relname IN ('url_mapping','click_event') ORDER BY relname;"
```

**你要得出的结论：**

```text
1 次跳转 = url_mapping 多 1 次索引扫描 + 1 次更新
         + click_event  多 1 次插入
```

**这就是"写放大"：一个纯读的跳转操作，却带了两次写。**

---

### 步骤 3：对照组 —— 串行 20 次

先看正常情况。串行没有并发，数据应该**完全准确**。

```bash
# 记录串行前
$PG -c "SELECT click_count FROM url_mapping WHERE short_url='$SHORT';"

# 串行 20 次（注意：没有并发，一个接一个）
for i in $(seq 1 20); do
  curl -s -o /dev/null $API/$SHORT
done

# 记录串行后
$PG -c "SELECT click_count FROM url_mapping WHERE short_url='$SHORT';"
```

**预期：click_count 从 1 变成 21（准确，+20）**

这证明：**代码逻辑本身没错，问题只在并发。**

---

### 步骤 4：实验组 —— 并发 20 次

现在加并发，只改一个参数：`-P`（并行度）。

```bash
# 记录并发前
BEFORE=$($PG -tAc "SELECT click_count FROM url_mapping WHERE short_url='$SHORT';")
echo "并发前: $BEFORE"

# 并发 20 次（-P 10 表示 10 个并发）
seq 1 20 | xargs -P 10 -I {} curl -s -o /dev/null $API/$SHORT

# 记录并发后
AFTER=$($PG -tAc "SELECT click_count FROM url_mapping WHERE short_url='$SHORT';")
echo "并发后: $AFTER"
echo "实际增加: $((AFTER - BEFORE))   期望增加: 20"
```

**预期：实际增加小于 20。差值就是丢掉的次数。**

---

### 步骤 5：放大 —— 并发 200 次

```bash
BEFORE=$($PG -tAc "SELECT click_count FROM url_mapping WHERE short_url='$SHORT';")
echo "并发前: $BEFORE"

START=$(date +%s.%N)
seq 1 200 | xargs -P 20 -I {} curl -s -o /dev/null $API/$SHORT
END=$(date +%s.%N)

AFTER=$($PG -tAc "SELECT click_count FROM url_mapping WHERE short_url='$SHORT';")
EVENTS=$($PG -tAc "SELECT COUNT(*) FROM click_event ce
                   JOIN url_mapping um ON ce.url_mapping_id = um.id
                   WHERE um.short_url='$SHORT';")

echo "──────────────────────────────"
echo "并发前 click_count : $BEFORE"
echo "并发后 click_count : $AFTER"
echo "实际增加           : $((AFTER - BEFORE))"
echo "期望增加           : 200"
echo "点击流水总条数     : $EVENTS  ← 这个是准确的"
echo "耗时               : $(echo "$END - $START" | bc) 秒"
echo "吞吐               : $(echo "scale=0; 200 / ($END - $START)" | bc) req/s"
echo "──────────────────────────────"
```

**你要观察的核心矛盾：**

```text
click_event 流水条数  = 准确的（每次 INSERT 都是新行）
click_count          = 丢失的（读-改-写互相覆盖）
两者对不上 → 丢更新被证实
```

---

### 步骤 6：记录到 BENCHMARK.md

把步骤 5 打印出来的数字，填进 `BENCHMARK.md` 的「基线」表格里。

**这份数据就是你简历和面试的核心素材。**

---

## 三、如何把结论说给面试官听

```text
"我在短链项目里发现跳转接口有个隐藏问题：每次跳转都要写两次库，
并且点击计数用的是 read-modify-write。

我写了个并发测试验证：200 个并发跳转，点击计数只增加了 16 次，
丢失率 92%，吞吐只有 284 QPS。而流水表是准确的，说明问题就出在
计数的非原子更新上。

后来我用 Redis INCR 做原子计数、Kafka 异步写流水，
再跑同样的测试，丢失率降到 0，吞吐提升到 X QPS。"
```

---

## 四、常见问题

**Q: 为什么流水表是准确的？**
A: 每次点击都是 `INSERT` 一条新行，行与行之间不冲突，所以不会丢。丢的只有"基于旧值计算新值"的 UPDATE。

**Q: 为什么用 psql 统计而不是查日志？**
A: `pg_stat_user_tables` 是数据库自己维护的计数器，不受应用日志级别影响，更可信。

**Q: 如果我想看得更细（具体 SQL）？**
A: 把 `application.properties` 里的 `logging.level.org.hibernate.SQL` 改成 `DEBUG`，重启应用即可看到每条 SQL。压测前记得改回 `INFO`，否则日志会把磁盘写满。

**Q: 为什么串行测试数据是准的？**
A: 串行时没有并发，每次读-改-写都完整执行完才轮到下一个，不存在互相覆盖。

**Q: 丢失的更新能恢复吗？**
A: 不能。旧值已经被覆盖，除非有流水表可以重算。这也是为什么很多系统要求"计数必须原子"。
