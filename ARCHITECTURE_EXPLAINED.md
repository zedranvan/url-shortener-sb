# 短链系统架构设计与调用链路全景拆解指南

> **写在前面**：  
> 永远不要觉得自己“人头猪脑”或“没天赋”。每一个优秀的工程师在刚入行时，面对密密麻麻的类、接口、中间件都是一头雾水。  
> 软件工程的本质不是死记硬背语法，而是**理解“数据流”与“职责边界”**。  
> 本文用大白话彻底讲透：**代码是怎么一步步流转的、为什么要分这么多层、Redis 到底该怎么用、以及为什么架构要这么设计。**

---

## 目录
1. [第一章：Spring Boot 经典分层模型（为什么要这样写？）](#第一章spring-boot-经典分层模型为什么要这样写)
   - 1.1 为什么要有 Controller、Service、Repository？
   - 1.2 为什么同一个数据要分 Entity 和 DTO？
2. [第二章：两大核心业务调用链路全景追踪（一行行代码跟踪）](#第二章两大核心业务调用链路全景追踪一行行代码跟踪)
   - 2.1 链路 A：创建短链 `POST /api/urls/shorten`
   - 2.2 链路 B：短链重定向 `GET /{shortUrl}`
3. [第三章：Redis 武器库全景图（从概念到实际用法）](#第三章redis-武器库全景图从概念到实际用法)
   - 3.1 Redis 到底是什么？
   - 3.2 五大核心数据结构的真实工业级场景
   - 3.3 我们在项目中为什么使用 String 与 INCR？
4. [第四章：关键架构决策（为什么选它？面试怎么答？）](#第四章关键架构决策为什么选它面试怎么答)
   - 4.1 为什么跳转必须是 302，绝对不能是 301？
   - 4.2 为什么用 自增ID + Base62，不用 UUID 或随机数？
   - 4.3 为什么 Redis 缓存失效了要回写（Cache-Aside）？
5. [第五章：从“脑子一片空白”到“能独立写代码”的训练法](#第五章从脑子一片空白到能独立写代码的训练法)

---

## 第一章：Spring Boot 经典分层模型（为什么要这样写？）

很多新手最困惑的是：*“我就想把长链接变成短链接，为什么不能在一个方法里写完，非要建那么多 Package（controller, service, repository, model, dto）？”*

如果把软件开发比作一家**大型餐厅**，你就彻底懂了：

```
 用户 (Client / Browser)
         │  (点菜 / 结账)
         ▼
 门面接待员 (Controller) ──── 只负责迎宾、核对菜单格式，不进厨房
         │
         ▼
 后厨大厨 (Service)       ──── 只负责炒菜、掌握核心烹饪秘方，不抛头露面
         │
         ▼
 仓库管理员 (Repository)  ──── 只负责进货、出库（查数据库），不管菜好不好吃
         │
         ▼
 食材原料库 (Database / Redis)
```

### 1.1 核心分层与职责边界

#### 1. Controller（门面层 / 控制器）
* **定位**：对外暴露的 HTTP 接口入口。
* **唯一职责**：
  1. 接收前端传来的 JSON 参数。
  2. 做基本格式校验（比如链接是不是空的、是不是标准的 URL）。
  3. 调用相应的 Service 方法。
  4. 把 Service 处理好的结果包装成 HTTP 状态码（200, 302, 404）和 JSON 返回给客户端。
* **铁律**：**绝对不要在 Controller 里写业务逻辑，更不要在 Controller 里直接查数据库！**

#### 2. Service（业务逻辑层）
* **定位**：系统的灵魂与大脑。
* **唯一职责**：
  1. 业务逻辑计算（比如：把 ID 拿给 Base62 计算、判断缓存有没有命中、决定要不要更新）。
  2. 控制事务（`@Transactional`，比如发货同时扣减库存，保证要么一起成功，要么一起失败）。
  3. 中间件调度（调用 Redis 做缓存、调用 Kafka 发异步消息）。
* **铁律**：Service 根本不关心请求是来自网页、安卓 App 还是命令行 `curl`，它只认纯粹的入参并交付结果。

#### 3. Repository / Mapper（数据持久层）
* **定位**：数据库与 Java 对象之间的翻译官。
* **唯一职责**：
  1. 把 Java 对象转换成 SQL 执行（`INSERT`, `SELECT`, `UPDATE`）。
  2. 把数据库查出来的二维表数据转换成 Java 实体类（Entity）。
* **为什么 Spring Data JPA 只需要写一个 interface（接口），不用写实现类？**
  * Spring 在底层通过**动态代理技术（Dynamic Proxy）**，根据你在接口里定义的方法名（如 `findByShortUrl`），自动帮你拼出了底层 SQL：`SELECT * FROM url_mapping WHERE short_url = ?`。你省去了写繁琐 JDBC 代码的痛苦。

---

### 1.2 为什么同一个数据要分 Entity 和 DTO？

在代码里你会发现：
* 有个类叫 `UrlMapping`（放在 `models` 包下，标了 `@Entity`）。
* 有个类叫 `UrlMappingDTO`（放在 `dtos` 包下，不标 `@Entity`）。

初学者经常问：*“它们里面的字段几乎一模一样，这不是脱裤子放屁吗？”*

**现实原因**：
1. **Entity（实体类）是“数据库的镜子”**：
   * 它的字段和数据库表结构必须一对一严格映射。
   * 它包含了敏感信息（比如 User 实体里有密码哈希 `password`、系统内部自增的软删除标记等）。
2. **DTO（Data Transfer Object，数据传输对象）是“端给客人的盘子”**：
   * 它是专门用来在网络上传输的数据契约。
   * **安全性**：你绝不能把包含用户密码哈希的 Entity 直接变成 JSON 传给前端，而应该在 DTO 里剔除敏感字段。
   * **解耦性**：如果哪天数据库字段改名了，前端的页面不需要跟着改，只需要在 Service 里做一下转换映射。

---

## 第二章：两大核心业务调用链路全景追踪

### 2.1 链路 A：创建短链 `POST /api/urls/shorten`

当你在终端敲下：
```bash
curl -X POST http://localhost:8081/api/urls/shorten \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"originalUrl":"https://www.bilibili.com"}'
```
整个系统内部的执行流程如下：

```
1. 客户端发起 HTTP POST
      │
2. [JwtAuthenticationFilter] 拦截请求
      ├─ 从 Header 中提取 Bearer Token
      ├─ 验签通过，提取 username ("testuser")
      └─ 将用户身份存入 Spring Security 上下文 (SecurityContext)
      │
3. [UrlMappingController.createShortUrl()]
      ├─ 拿到前端 JSON 中的 originalUrl
      ├─ 从 SecurityContext 中拿到当前登录用户 User
      └─ 调用 Service: urlMappingService.createShortUrl(originalUrl, user)
      │
4. [UrlMappingService.createShortUrl()]
      ├─ 步骤 ①: 创建 UrlMapping 实体，设置 originalUrl，shortUrl 暂填 "TEMP"
      ├─ 步骤 ②: urlMappingRepository.save(urlMapping)
      │          └── 底层发出: INSERT INTO url_mapping ... RETURNING id;
      │          └── 拿到数据库主键自增生成的唯一 ID (例如: 100234)
      ├─ 步骤 ③: Base62Util.encode(100234)
      │          └── 数学除模运算，把数字计算为短码 (例如: "q8K")
      ├─ 步骤 ④: savedUrlMapping.setShortUrl("q8K");
      │          └── urlMappingRepository.save(savedUrlMapping);
      │          └── 底层发出: UPDATE url_mapping SET short_url = 'q8K' WHERE id = 100234;
      ├─ 步骤 ⑤: 【Redis 缓存预热】
      │          └── redisTemplate.opsForValue().set("short:q8K", "https://bilibili.com", 7天);
      └─ 步骤 ⑥: 把 Entity 转换为 UrlMappingDTO 返回
      │
5. Controller 将 DTO 序列化为 JSON 字符串，返回 HTTP 200 给客户端
```

---

### 2.2 链路 B：短链重定向 `GET /{shortUrl}`

当任何普通网民点击 `http://localhost:8081/q8K` 时：

```
1. 客户端发起 HTTP GET /q8K
      │
2. [WebSecurityConfig] 判定
      └── 匹配规则: /{shortUrl} 属于 permitAll()，免登录直接放行！
      │
3. [RedirectController.redirect("q8K")]
      └── 调用 Service: urlMappingService.getOriginalUrl("q8K")
      │
4. [UrlMappingService.getOriginalUrl("q8K")]
      │
      ├─ 尝试从 Redis 读取: redisTemplate.opsForValue().get("short:q8K")
      │
      ├─【分支一：命中缓存 (99% 的高频场景)】
      │    ├─ 1. redisTemplate.opsForValue().increment("clicks:q8K")
      │    │     └── Redis 内存中原子自增计数，耗时 0.2ms，零并发竞争！
      │    └─ 2. 直接构造 UrlMapping 对象包装长链接返回，数据库 0 读 0 写！
      │
      └─【分支二：未命中缓存 (缓存过期或冷门链接)】
           ├─ 1. 穿透查库: urlMappingRepository.findByShortUrl("q8K")
           ├─ 2. 如果查到了:
           │     ├── 异步回写 Redis: set("short:q8K", originalUrl, 7天)
           │     └── Redis 内存自增计数: increment("clicks:q8K")
           └─ 3. 返回查询到的结果
      │
5. [RedirectController] 收到返回的 UrlMapping
      ├─ 拿出 originalUrl: "https://www.bilibili.com"
      ├─ 在 HTTP 响应头加入: Location = "https://www.bilibili.com"
      └─ 设置 HTTP 状态码为 302 Found，返回给浏览器
      │
6. 浏览器收到 302 响应码及 Location 头，自动跳转到目标网页！
```

---

## 第三章：Redis 武器库全景图（从概念到实际用法）

很多新手知道 Redis 是“缓存”，但不知道它究竟能干嘛。

### 3.1 什么是 Redis？
* 数据库（MySQL/MariaDB）是**写在硬盘上的账本**：持久安全，但硬盘读写慢（通常每次几毫秒到几十毫秒）。
* Redis 是**放在内存里的便利贴**：速度极快（单次操作通常几百微秒），但内存昂贵且断电容易丢失，所以通常用来配合数据库使用。

### 3.2 五大核心数据结构与现实场景

| 数据类型 | 底层本质 | 对应的 Java 模板操作 | 真实工业级使用场景 |
|---|---|---|---|
| **String（字符串）** | 最通用的 Key-Value | `redisTemplate.opsForValue()` | 1. 对象/页面缓存<br>2. 验证码（设置 5 分钟过期）<br>3. 分布式锁（SETNX）<br>4. **原子计数器（INCR / DECR）** |
| **Hash（哈希字典）** | 类似 `Map<String, Map<Field, Value>>` | `redisTemplate.opsForHash()` | **电商购物车**：<br>Key=用户ID，Field=商品ID，Value=购买数量。<br>可以单独修改某一件商品数量，不用把整个购物车拉出来。 |
| **List（双向链表）** | 类似 Java 的 `LinkedList` | `redisTemplate.opsForList()` | **消息时间线 / 简易队列**：<br>朋友圈动态、最新弹幕列表（`LPUSH` + `LRANGE` 分页拉取）。 |
| **Set（无序无重复集合）** | 类似 Java 的 `HashSet` | `redisTemplate.opsForSet()` | **社交关系 / 抽奖**：<br>1. 点赞列表、抽奖去重池（保证一个人只能中一次）。<br>2. 共同关注、共同好友（求两个 Set 的交集 `SINTER`）。 |
| **ZSet（有序集合）** | 每个元素带一个分数值（Score） | `redisTemplate.opsForZSet()` | **排行榜**：<br>小说阅读榜、热搜榜、积分排位赛（按阅读量或积分作为 Score 自动实时排序）。 |

### 3.3 我们在项目中为什么选 String + `INCR`？

你之前在 `LAB-01-并发丢更新.md` 中记录了数据库并发测试：
* 为什么 `UPDATE table SET count = count + 1` 会丢数据？
  * 因为在数据库里，这是 **“读出来 -> 内存+1 -> 写回去”** 的三步操作。10 个线程同时读到 10，算完都是 11 写回，10 次点击最后只记了 1 次！
* 为什么 Redis `increment()` 不会丢？
  * 因为 Redis 底层是**单线程事件循环处理核心命令**。不管 1000 个请求怎么并发打过来，进入 Redis 后都必须排队，一个一个执行 `INCR` 命令。操作在内存中一步完成，具有天然的**原子性**！

---

## 第四章：关键架构决策（为什么选它？面试怎么答？）

### 4.1 为什么跳转必须是 302，绝对不能是 301？
* **HTTP 301（Moved Permanently，永久重定向）**：
  * 浏览器一旦收到 301，会直接把这个短链和长链接的关系**永久缓存在用户的本地浏览器硬盘中**！
  * 后果：用户下一次再点这个短链接时，浏览器根本不会再向你的服务器发请求，而是直接在浏览器本地跳转了。**你的服务器无法再统计到任何点击量（PV/UV）！**
* **HTTP 302（Found / Temporary Redirect，临时重定向）**：
  * 浏览器明确知道这只是临时跳一次，**绝不会在本地建立强缓存**。
  * 每次用户点击短链，都会老老实实向你的后端发一次请求，**保证你的统计数据 100% 精确**！

### 4.2 为什么用 自增ID + Base62，不用 UUID 或随机数？
1. **随机数（Random）**：会有“生日悖论”，数据越多撞车概率越高，需要不断重新生成并查库确认，性能极差。
2. **UUID**：长达 36 位（如 `550e8400-e29b-41d4-a716-446655440000`），太长了，失去了“短链接”让链接变短的意义。
3. **自增 ID + Base62**：
   * 数据库自增 ID 天然保证全局唯一、永不重复。
   * Base62 是纯粹的可逆数学进制转换，算力消耗微乎其微。
   * 即使 ID 增长到 100 亿，转成 Base62 也仅仅只有 6 位字符（`10000000000` -> `aUKYAA`）。

### 4.3 什么是 Cache-Aside Pattern（旁路缓存模式）？
我们在 `getOriginalUrl` 中写的逻辑就是工业界最标准的**旁路缓存模式**：
* 读的时候：先读 Cache，命中则返回；Miss 则读 DB，并回写 Cache。
* 为什么设置过期时间（7天）：防止冷门短链一直霸占 Redis 内存，让有限的内存资源留给经常访问的热点短链。

---

## 第五章：从“脑子一片空白”到“能独立写代码”的训练法

你提到：*“我基础太差，很多东西没有概念，更不会自己手写，手足无措。”*

请记住，**连工作 10 年的架构师，面对一张白纸也是不可能直接敲出完整代码的。** 架构师和初学者的唯一区别是：**有一套拆解思维的路线图。**

以后面对任何新需求，请严格按以下 3 步走：

```
 第一步：画出“生活对话式”业务流程（不要写任何代码！）
       例如：“用户要重定向，先看内存有没有，有就记个数然后跳，没有就查表。”

 第二步：按生活流程写出“中文伪代码”
       String url = redis.get(key);
       if (url 存在) {
           redis.incr(计数);
           return url;
       }
       url = 数据库.find(key);
       if (url 存在) {
           redis.set(key, url);
           return url;
       }

 第三步：最后才用 Java 语法把每一句伪代码替换为真实调用！
```

你不是学不会，你只是以前一直试图在脑子里同时处理“业务逻辑 + Java语法 + 框架注解 + 中间件调用”这四件事，导致大脑瞬间宕机。**把它们分步拆开，你会发现一切逻辑都像搭积木一样理所当然。**
