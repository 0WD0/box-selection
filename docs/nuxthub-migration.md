# 🚀 NuxtHub 数据库迁移指南

## 📋 概述

本文档记录了从传统的 SQLite + LibSQL 配置迁移到 NuxtHub 数据库的过程和原因。

## 🔄 迁移原因

### 为什么选择 NuxtHub？

1. **🎯 专为 Nuxt 设计**: NuxtHub 是 Nuxt 团队官方推出的部署平台
2. **🔧 零配置体验**: 数据库、存储等功能开箱即用
3. **☁️ 云原生**: 基于 Cloudflare D1，性能和可靠性有保障
4. **🛠️ 开发体验**: 内置 DevTools 支持，可视化数据库管理
5. **🚀 自动部署**: 与 Cloudflare Pages 无缝集成

### 传统配置的问题

- 需要手动管理数据库连接
- 开发和生产环境配置不一致
- 部署时需要额外配置数据库
- 缺乏可视化管理工具

## 📁 目录结构变化

### 迁移前
```
box-selection/
├── db/
│   ├── sqlite.db          # 本地数据库文件
│   ├── schema.ts          # 数据库模式
│   ├── index.ts           # 数据库连接
│   └── migrations/        # 迁移文件
└── drizzle.config.ts
```

### 迁移后
```
box-selection/
├── server/
│   ├── database/
│   │   ├── schema.ts          # 数据库模式
│   │   └── migrations/        # 迁移文件
│   ├── utils/
│   │   └── drizzle.ts         # Drizzle 工具函数
│   ├── tasks/
│   │   └── seed.ts            # 数据库种子任务
│   └── api/                   # API 端点
├── nuxt.config.ts             # 包含 hub 配置
└── drizzle.config.ts          # 简化的配置
```

## ⚙️ 配置变化

### Nuxt 配置

**迁移前**: 无特殊配置

**迁移后**:
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxthub/core'
  ],
  
  hub: {
    database: true
  },

  nitro: {
    experimental: {
      tasks: true
    }
  }
})
```

### Drizzle 配置

**迁移前**:
```typescript
// drizzle.config.ts
export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: 'file:./db/sqlite.db'
  }
})
```

**迁移后**:
```typescript
// drizzle.config.ts
export default defineConfig({
  dialect: 'sqlite',
  schema: './server/database/schema.ts',
  out: './server/database/migrations'
})
```

### 数据库连接

**迁移前**:
```typescript
// db/index.ts
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

const client = createClient({
  url: 'file:./db/sqlite.db'
})

export const db = drizzle(client, { schema })
```

**迁移后**:
```typescript
// server/utils/drizzle.ts
import { drizzle } from 'drizzle-orm/d1'

export function useDrizzle() {
  return drizzle(hubDatabase(), { schema })
}
```

## 🔧 API 变化

### API 端点更新

**迁移前**:
```typescript
import { db, visualBlocks } from '~/db'

export default defineEventHandler(async (event) => {
  const blocks = await db.select().from(visualBlocks)
  return { blocks }
})
```

**迁移后**:
```typescript
export default defineEventHandler(async (event) => {
  const blocks = await useDrizzle().select().from(tables.visualBlocks)
  return { blocks }
})
```

### 数据初始化方式

**迁移前**: 通过 API 端点初始化数据

**迁移后**: 使用 Nitro 任务系统
```typescript
// server/tasks/seed.ts
export default defineTask({
  meta: {
    name: 'db:seed',
    description: 'Initialize database with MinerU visual blocks data'
  },
  async run() {
    // 数据初始化逻辑
  }
})
```

## 📦 依赖变化

### 新增依赖
```json
{
  "dependencies": {
    "@nuxthub/core": "^0.9.0"
  }
}
```

### 移除依赖
- `@libsql/client` (不再需要，NuxtHub 内置)

### 保留依赖
- `drizzle-orm`: 继续使用，但改用 D1 适配器
- `drizzle-kit`: 继续用于迁移管理

## 🚀 新功能

### 1. 可视化数据库管理
- 通过 Nuxt DevTools 查看和管理数据库
- 实时查看表结构和数据

### 2. 任务系统
- 使用 Nitro 任务进行数据初始化
- 可通过 DevTools 运行任务

### 3. 自动迁移
- 开发时自动应用迁移
- 部署时自动同步数据库结构

### 4. 环境管理
- 开发环境使用本地 SQLite
- 生产环境自动使用 Cloudflare D1
- 无需手动配置环境变量

## 🛠️ 开发工作流

### 迁移前
1. 手动创建数据库文件
2. 运行迁移命令
3. 通过 API 初始化数据
4. 使用外部工具查看数据库

### 迁移后
1. 启动开发服务器 (`npm run dev`)
2. 迁移自动应用
3. 通过 DevTools 运行种子任务
4. 在 DevTools 中查看和管理数据库

## 📊 性能和可靠性

### 开发环境
- 使用本地 SQLite，响应速度快
- 支持热重载和实时更新

### 生产环境
- 基于 Cloudflare D1，全球分布
- 自动备份和高可用性
- 边缘计算，低延迟

## 🔍 故障排除

### 常见问题

#### 1. 类型错误：找不到 `useDrizzle` 或 `tables`
**原因**: NuxtHub 的自动导入可能需要重启开发服务器
**解决**: 重启 `npm run dev`

#### 2. 数据库连接失败
**原因**: NuxtHub 模块未正确配置
**解决**: 检查 `nuxt.config.ts` 中的 `hub.database: true` 配置

#### 3. 迁移文件未生成
**原因**: Drizzle 配置路径错误
**解决**: 确认 `drizzle.config.ts` 中的路径正确

### 调试技巧

1. **查看 DevTools**: 在浏览器中打开 Nuxt DevTools
2. **检查任务**: 在 DevTools 的 Tasks 标签中查看可用任务
3. **查看数据库**: 在 DevTools 的 Database 标签中查看表结构

## 🚢 部署注意事项

### Cloudflare Pages 部署

1. **自动检测**: NuxtHub 会自动检测 Cloudflare 环境
2. **数据库创建**: 首次部署时自动创建 D1 数据库
3. **迁移应用**: 部署时自动应用所有迁移

### 环境变量

NuxtHub 会自动管理数据库连接，无需手动设置环境变量。

## 📚 参考资源

- [NuxtHub 官方文档](https://hub.nuxt.com/)
- [NuxtHub 数据库功能](https://hub.nuxt.com/docs/features/database)
- [Drizzle ORM 与 NuxtHub](https://hub.nuxt.com/docs/recipes/drizzle)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)

## ✅ 迁移检查清单

- [x] 安装 `@nuxthub/core`
- [x] 更新 `nuxt.config.ts` 配置
- [x] 重新组织目录结构
- [x] 更新 Drizzle 配置
- [x] 创建 `server/utils/drizzle.ts`
- [x] 更新所有 API 端点
- [x] 创建数据库种子任务
- [x] 生成新的迁移文件
- [x] 更新 `.gitignore`
- [x] 更新文档
- [x] 测试开发环境
- [ ] 测试生产部署

这次迁移将项目从传统的数据库配置升级到了现代化的 NuxtHub 解决方案，提供了更好的开发体验和部署便利性。 