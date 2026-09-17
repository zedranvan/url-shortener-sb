# URL Shortener · 高性能企业级短链接系统

本项目是一个基于 **Spring Boot** 与 **React + Vite** 构建的全栈轻量、高性能短链接生成与分析平台，集成了短码生成与重定向、Redis 缓存加速、布隆过滤器穿透防护、JWT 身份认证以及点击数据实时统计追踪。

---

## 🌟 核心特性

- **高效短码编解码**：基于自增序列与 Base62 算法，短码精简且具备极高编码密度。
- **高并发 302 重定向**：结合 Redis 缓存与布隆过滤器（Guava Bloom Filter），阻断空值穿透，实现毫秒级跳转。
- **并发计数与统计分析**：采用 Redis 原子计数，杜绝传统数据库读-改-写造成的并发丢更新（Lost Update）问题。
- **全套认证与资产隔离**：Spring Security + JJWT 鉴权，支持私有链接隔离与聚合统计。
- **API 接口可视化**：集成 Springdoc OpenAPI 3 (Swagger UI)，便于交互式接口调试。
- **现代响应式前端**：React 18 + Tailwind CSS，包含短链生成、点击分析图表与单链趋势看板。

---

## 🏗️ 技术栈

| 层次 | 核心组件 / 技术 |
| :--- | :--- |
| **服务端** | Java 17+, Spring Boot, Spring Data JPA, Spring Security, JJWT, Guava, Springdoc OpenAPI |
| **存储与缓存** | PostgreSQL / MariaDB, Redis |
| **前端** | React 18, Vite, Tailwind CSS, Lucide React, Axios |
| **容器化与部署** | Docker, Docker Compose |

---

## 📚 架构沉淀与技术文档 (Docs)

本项目所有的架构设计拆解、高并发实验记录、重构指导及求职复盘资料均统一收归在 [`docs/`](./docs/README.md) 目录下：

- 📖 [**系统架构设计与链路拆解**](./docs/ARCHITECTURE_EXPLAINED.md)：经典分层职责、两大街核心链路时序、Redis 选型与 Cache-Aside 机制。
- 🧪 [**并发丢更新量化实验 (LAB-01)**](./docs/LAB-01-并发丢更新.md)：复现并发覆盖问题，记录流水表与计数字段的不一致。
- 📊 [**性能基线记录**](./docs/BENCHMARK.md)：压测吞吐量、丢失率与性能对照基线。
- 📝 [**现代 Java 深度重构工程指南**](./docs/modern_java_refactor_guide.tex)：消除老式 Java 样板代码仪式与框架黑盒焦虑。
- 🎯 [**工程实践与求职破局指南**](./docs/short_url_and_career_guide.tex)：招聘市场规律解析与核心竞争力构建。

> 完整索引请参见：[**文档知识库索引 (docs/README.md)**](./docs/README.md)

---

## 🚀 快速启动

### 1. 启动基础环境中间件

使用 Docker Compose 启动依赖的数据库与 Redis：

```bash
docker-compose up -d
```

### 2. 启动服务端 (Spring Boot)

```bash
./mvnw spring-boot:run
```
- 后端服务端口：`http://localhost:8081`
- Swagger UI 接口文档：`http://localhost:8081/swagger-ui/index.html`

### 3. 启动前端控制台 (React)

```bash
cd frontend
npm install
npm run dev
```
- 前端访问地址：`http://localhost:5173`
