# 📄 数据库设置与配置指南

## 📋 概述

本项目使用 SQLite 作为数据库，配合 Drizzle ORM 进行数据管理。SQLite 是一个轻量级的嵌入式数据库，非常适合客户端应用和小到中型的Web应用。

## 🗄️ 数据库文件位置

```
box-selection/
├── db/
│   ├── sqlite.db          # SQLite数据库文件
│   ├── schema.ts          # 数据库模式定义
│   ├── index.ts           # 数据库连接配置
│   └── migrations/        # 数据库迁移文件
└── drizzle.config.ts      # Drizzle配置文件
```

### 📁 为什么将数据库文件放在 `db/` 目录？

1. **组织性**: 保持项目根目录整洁
2. **安全性**: 便于在部署时排除敏感文件
3. **可维护性**: 所有数据库相关文件集中管理
4. **版本控制**: 便于配置 `.gitignore` 规则

## ⚙️ Drizzle ORM 配置

### `drizzle.config.ts`

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './db/schema.ts',        // 模式定义文件位置
  out: './db/migrations',          // 迁移文件输出目录
  dialect: 'turso',                // 使用Turso dialect（兼容SQLite）
  dbCredentials: {
    url: 'file:./db/sqlite.db'     // 数据库文件路径
  }
})
```

### 配置说明

- **schema**: 指向数据库模式定义文件
- **out**: 生成的迁移文件存放目录
- **dialect**: 使用 'turso' 以获得更好的SQLite支持
- **url**: 数据库文件的相对路径

## 🔌 数据库连接配置

### `db/index.ts`

```typescript
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

// 创建LibSQL客户端
const client = createClient({
  url: 'file:./db/sqlite.db'
})

// 创建Drizzle数据库实例
export const db = drizzle(client, { schema })

// 导出所有模式
export * from './schema'
```

### 技术选择说明

#### 为什么选择 LibSQL 而不是 better-sqlite3？

1. **兼容性**: LibSQL 与 Cloudflare 等现代部署平台兼容性更好
2. **无原生依赖**: 避免了 Node.js 原生模块编译问题
3. **现代化**: 支持更现代的 JavaScript 特性
4. **部署友好**: 更容易在各种环境中部署

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

### 初始化数据库

```bash
# 生成迁移文件
npx drizzle-kit generate

# 推送模式到数据库
npx drizzle-kit push

# 查看当前模式
npx drizzle-kit introspect
```

### 开发环境管理

```bash
# 重置数据库（删除并重新创建）
rm -f db/sqlite.db
npx drizzle-kit push

# 查看数据库内容（需要安装sqlite3）
sqlite3 db/sqlite.db ".tables"
sqlite3 db/sqlite.db ".schema"

# 导出数据
sqlite3 db/sqlite.db ".dump" > backup.sql

# 导入数据
sqlite3 db/sqlite.db < backup.sql
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