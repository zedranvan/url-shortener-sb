# 短链系统架构指南、实验与求职进阶知识库 (AI & Docs)

本目录集中收纳了本项目在架构演进、性能实验、代码重构及求职面试维度的沉淀文档与 AI 辅导提示内容。

---

## 📚 文档导航索引

| 文档文件 | 核心主题 | 内容定位与主要价值 | 格式 |
| :--- | :--- | :--- | :--- |
| [ARCHITECTURE_EXPLAINED.md](./ARCHITECTURE_EXPLAINED.md) | **架构设计与链路拆解** | 从门面 Controller、业务 Service、持久层 Repository 到 Redis 缓存与布隆过滤器的全链路代码级流转图与核心设计决策（302 跳转、Base62 进制压缩、Cache-Aside 读写策略）。 | Markdown |
| [LAB-01-并发丢更新.md](./LAB-01-并发丢更新.md) | **并发丢更新量化实验** | 动手复现高并发下 `click_count = click_count + 1` 的读-改-写竞态条件（Lost Update），演示为什么需要使用 Redis 原子 `INCR`。 | Markdown |
| [BENCHMARK.md](./BENCHMARK.md) | **性能基线记录** | 记录 200 并发跳转下的吞吐量（req/s）、丢更新比例及数据库读写操作数对比，为性能调优提供量化证据。 | Markdown |
| [modern_java_refactor_guide.tex](./modern_java_refactor_guide.tex) *(原 a.tex)* | **现代 Java 深度重构指南** | 破除老式 Java 繁冗样板代码与“框架黑盒综合征”，针对四大核心重灾区（Controller、Service、DTO 等）进行手术式代码降噪重构。 | LaTeX (`.tex`) |
| [short_url_and_career_guide.tex](./short_url_and_career_guide.tex) | **工程实践与求职破局指南** | 剖析招聘平台初筛机制、“1-3年”年限倒挂真相、双轨制求职策略与初级 Java 服务端工程师的技能掌控法。 | LaTeX (`.tex`) |

---

## 🧭 建议阅读路径

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 业务与架构初探                                            │
│    阅读 [ARCHITECTURE_EXPLAINED.md](./ARCHITECTURE_EXPLAINED.md) │
│    掌握请求从 HTTP 进入到 302 重定向、缓存查询的完整生命周期     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. 深度动手实验与性能评测                                   │
│    执行 [LAB-01-并发丢更新.md](./LAB-01-并发丢更新.md)        │
│    记录数据到 [BENCHMARK.md](./BENCHMARK.md)                 │
│    掌握生产级高并发场景中原子操作与缓存选型的核心论据        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. 代码美学与现代重构                                       │
│    研读 [modern_java_refactor_guide.tex](./modern_java_refactor_guide.tex) │
│    消除无意义的中间变量、多余样板对象与过度包装             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. 职业规划与求职面试表达                                   │
│    阅读 [short_url_and_career_guide.tex](./short_url_and_career_guide.tex) │
│    将短链项目中的并发、缓存、布隆过滤器等亮点转化为面试核心壁垒│
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ LaTeX 文档编译方法

若需将 `.tex` 格式文档编译为高质量 PDF，可在本地使用 `xelatex` 编译（支持中文宏包 `ctex`）：

```bash
cd docs/

# 编译代码降噪重构指南
xelatex modern_java_refactor_guide.tex

# 编译求职破局全景指南
xelatex short_url_and_career_guide.tex
```

> **提示**：编译生成的临时文件（如 `.aux`, `.log`, `.out`, `.toc`）已被项目 `.gitignore` 规则忽略，不会污染版本库。
