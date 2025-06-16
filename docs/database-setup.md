# 📄 NuxtHub 数据库设置与配置指南

## 📋 概述

本项目使用 NuxtHub 的内置数据库功能，基于 Cloudflare D1（SQLite）和 Drizzle ORM 进行数据管理。NuxtHub 提供了开发和生产环境的无缝数据库体验。

## 🗄️ NuxtHub 数据库文件结构

```
box-selection/
├── server/
│   ├── database/
│   │   ├── schema.ts          # 数据库模式定义
│   │   └── migrations/        # 数据库迁移文件
│   ├── utils/
│   │   └── drizzle.ts         # Drizzle 工具函数
│   ├── tasks/
│   │   └── seed.ts            # 数据库种子任务
│   └── api/                   # API 端点
├── nuxt.config.ts             # Nuxt 配置（包含 hub 配置）
└── drizzle.config.ts          # Drizzle 配置文件
```

### 📁 为什么使用 NuxtHub 的目录结构？

1. **标准化**: 遵循 NuxtHub 的最佳实践
2. **自动化**: 迁移和部署自动处理
3. **开发体验**: 内置 DevTools 支持
4. **云原生**: 为 Cloudflare 部署优化

## ⚙️ NuxtHub 配置

### `nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxthub/core'
  ],
  
  // NuxtHub 配置
  hub: {
    database: true
  },

  // Nitro 配置（用于任务支持）
  nitro: {
    experimental: {
      tasks: true
    }
  }
})
```

### `drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/database/schema.ts',
  out: './server/database/migrations'
})
```

### 配置说明

- **hub.database**: 启用 NuxtHub 数据库功能
- **schema**: 指向数据库模式定义文件
- **out**: 生成的迁移文件存放目录
- **dialect**: 使用 'sqlite' 方言

## 🔌 NuxtHub 数据库连接

### `server/utils/drizzle.ts`

```typescript
import { drizzle } from 'drizzle-orm/d1'
export { sql, eq, and, or } from 'drizzle-orm'

import * as schema from '../database/schema'

export const tables = schema

export function useDrizzle() {
  return drizzle(hubDatabase(), { schema })
}

// 导出类型
export type VisualBlock = typeof schema.visualBlocks.$inferSelect
export type InsertVisualBlock = typeof schema.visualBlocks.$inferInsert
// ... 其他类型
```

### 技术选择说明

#### 为什么选择 NuxtHub？

1. **一体化解决方案**: 数据库、存储、缓存等功能集成
2. **开发体验**: 内置 DevTools，可视化数据库管理
3. **自动部署**: 与 Cloudflare 无缝集成
4. **零配置**: 开发和生产环境自动切换

## 📊 数据库模式设计

### 表结构概览

```sql
-- 视觉块表
CREATE TABLE visual_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_index INTEGER NOT NULL,
  block_index INTEGER NOT NULL,
  type TEXT NOT NULL,
  bbox TEXT NOT NULL,
  content TEXT,
  level INTEGER DEFAULT 1,
  parent_id INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 区域表
CREATE TABLE regions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  root_block_id INTEGER NOT NULL,
  bbox TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 区域-块关系表
CREATE TABLE region_blocks (
  region_id INTEGER NOT NULL,
  block_id INTEGER NOT NULL,
  PRIMARY KEY (region_id, block_id)
);

-- 批注表
CREATE TABLE annotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  position TEXT,
  is_visible INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### 关键设计决策

1. **JSON存储**: `bbox` 和 `position` 使用 JSON 字符串存储复杂对象
2. **时间戳**: 使用整数毫秒时间戳，便于JavaScript处理
3. **布尔值**: SQLite 没有原生布尔类型，使用整数 (1/0)
4. **自增主键**: 所有表都使用自增整数主键

## 🚀 常用操作命令

### 数据库迁移

```bash
# 生成迁移文件
npm run db:generate

# 查看 Drizzle Studio
npm run db:studio
```

### 数据库种子

```bash
# 启动开发服务器
npm run dev

# 在 Nuxt DevTools 中运行 db:seed 任务
# 或者使用 NuxtHub CLI（如果已安装）
npx nuxthub database migrations list
```

### NuxtHub CLI 命令

```bash
# 安装 NuxtHub CLI
npm i -g nuxthub

# 查看数据库状态
nuxthub database migrations list

# 本地环境
nuxthub database migrations list --local

# 预览环境
nuxthub database migrations list --preview

# 生产环境
nuxthub database migrations list --production
```

## 🔒 环境配置

### 开发环境

```typescript
// 使用本地文件
const client = createClient({
  url: 'file:./db/sqlite.db'
})
```

### 生产环境（Cloudflare）

```typescript
// 使用环境变量配置
const client = createClient({
  url: process.env.DATABASE_URL || 'file:./db/sqlite.db',
  authToken: process.env.DATABASE_AUTH_TOKEN
})
```

### 环境变量

```bash
# .env.local (开发环境)
DATABASE_URL="file:./db/sqlite.db"

# .env.production (生产环境)
DATABASE_URL="libsql://your-database.turso.io"
DATABASE_AUTH_TOKEN="your-auth-token"
```

## 🛠️ 故障排除

### 常见问题

#### 1. 数据库文件权限问题

```bash
# 确保目录存在并有写权限
mkdir -p db
chmod 755 db
```

#### 2. 迁移文件冲突

```bash
# 删除冲突的迁移文件
rm -rf db/migrations/*

# 重新生成
npx drizzle-kit generate
npx drizzle-kit push
```

#### 3. Schema 不同步

```bash
# 强制重新同步
npx drizzle-kit push --force
```

### 调试技巧

#### 1. 启用SQL日志

```typescript
export const db = drizzle(client, { 
  schema,
  logger: true  // 启用SQL查询日志
})
```

#### 2. 查看生成的SQL

```typescript
import { sql } from 'drizzle-orm'

// 查看查询构建
const query = db.select().from(visualBlocks)
console.log(query.toSQL())
```

## 📈 性能优化

### 索引策略

```sql
-- 为常用查询添加索引
CREATE INDEX idx_visual_blocks_page ON visual_blocks(page_index);
CREATE INDEX idx_visual_blocks_parent ON visual_blocks(parent_id);
CREATE INDEX idx_region_blocks_region ON region_blocks(region_id);
CREATE INDEX idx_annotations_region ON annotations(region_id);
```

### 查询优化

```typescript
// 使用索引优化的查询
const pageBlocks = await db
  .select()
  .from(visualBlocks)
  .where(eq(visualBlocks.pageIndex, pageIndex))
  .orderBy(visualBlocks.blockIndex)

// 预加载关联数据
const regionsWithBlocks = await db
  .select()
  .from(regions)
  .leftJoin(regionBlocks, eq(regions.id, regionBlocks.regionId))
  .leftJoin(visualBlocks, eq(regionBlocks.blockId, visualBlocks.id))
```

## 🚢 部署注意事项

### Cloudflare Pages

```typescript
// 在 Cloudflare 环境中使用 Turso
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
})
```

### Vercel

```typescript
// Vercel 环境配置
const client = createClient({
  url: process.env.DATABASE_URL || 'file:/tmp/sqlite.db'
})
```

### Docker

```dockerfile
# Dockerfile 中的配置
WORKDIR /app
RUN mkdir -p db
VOLUME ["/app/db"]
```

## 📚 参考资源

- [Drizzle ORM 官方文档](https://orm.drizzle.team/)
- [LibSQL 文档](https://docs.turso.tech/libsql)
- [SQLite 官方文档](https://www.sqlite.org/docs.html)
- [Turso 平台文档](https://docs.turso.tech/)

## 🔧 工具推荐

- **DB Browser for SQLite**: GUI 数据库浏览器
- **sqlite3 CLI**: 命令行工具
- **Drizzle Studio**: 官方数据库管理界面
- **VSCode SQLite 扩展**: 在编辑器中查看数据库 