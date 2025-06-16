# 🚀 视觉块批注系统

> 一个基于视觉块的智能PDF批注和区域管理系统

## 📋 项目概述

本项目实现了一种创新的PDF批注方式，相比传统的划词和框选，我们基于视觉块进行批注。系统使用MinerU进行PDF布局分析，识别出各种视觉块（文本、标题、图片、表格等），用户可以通过鼠标框选、键盘导航等方式选择视觉块，创建区域并添加批注。

### 🎯 核心概念

- **视觉块 (Visual Blocks)**: PDF中的基本元素单位，如文本段落、标题、图片、表格等
- **区域 (Regions)**: 由一个或多个视觉块组成的批注区域，表现为一个矩形边界
- **批注 (Annotations)**: 与区域关联的文本注释
- **树形结构**: 视觉块可以组织成树形结构，支持层次化管理

### ✨ 主要特性

- 🖱️ **多种选择方式**: 支持鼠标框选、点击选择、键盘导航
- 🎯 **智能框选**: 框选自动识别相交的视觉块，支持切换选择状态
- 🖐️ **画布拖拽**: 中键拖拽移动画布，双击重置位置
- ⌨️ **Vim风格导航**: 支持hjkl键导航和空格键选择
- 🎨 **丰富视觉反馈**: 不同颜色和样式表示不同状态
- 📊 **实时统计**: 系统状态页面显示各类数据统计
- 🔄 **实时更新**: 所有操作实时同步到数据库
- 📱 **响应式设计**: 支持不同屏幕尺寸

## 🔧 技术栈

- **前端框架**: Nuxt3
- **状态管理**: Pinia
- **PDF处理**: PDF.js + MinerU布局分析
- **数据库**: SQLite + Drizzle ORM
- **UI组件**: Nuxt UI + Tailwind CSS
- **部署**: NuxtHub

## 📁 项目结构

```
box-selection/
├── components/
│   ├── PDFViewer.vue              # PDF查看器和视觉块渲染
│   ├── BlockSelectionPanel.vue    # 视觉块选择面板
│   ├── RegionPanel.vue            # 区域管理面板
│   ├── PageControls.vue           # 页面控制组件
│   ├── KeyboardHelp.vue           # 键盘帮助组件
│   ├── AppLayout.vue              # 应用布局
│   ├── AppHeader.vue              # 应用头部
│   ├── AppSidebar.vue             # 侧边栏
│   └── AppBreadcrumb.vue          # 面包屑导航
├── stores/
│   ├── pdf.ts                     # PDF状态管理
│   ├── annotation.ts              # 批注状态管理
│   ├── system.ts                  # 系统状态管理
│   └── ui.ts                      # UI状态管理
├── pages/
│   ├── index.vue                  # 主页
│   ├── annotator.vue              # 批注系统主页面
│   ├── status.vue                 # 系统状态页面
│   └── admin.vue                  # 数据库管理页面
├── server/api/
│   ├── blocks/                    # 视觉块API
│   ├── regions/                   # 区域API
│   ├── annotations/               # 批注API
│   └── stats.get.ts               # 统计API
├── db/
│   ├── schema.ts                  # 数据库模式
│   └── index.ts                   # 数据库连接
├── utils/
│   ├── pdf-parser.ts              # PDF解析工具
│   └── geometry.ts                # 几何计算工具
├── assets/data/
│   ├── origin.pdf                 # 原始PDF文件
│   └── middle.json                # MinerU布局数据
└── nuxt.config.ts                 # Nuxt配置
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm (推荐) 或 npm

### 1. 克隆项目

```bash
git clone <repository-url>
cd box-selection
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 初始化数据库

```bash
# 推送数据库模式
npx drizzle-kit push

# 导入PDF数据 (首次运行)
pnpm dev
# 然后访问 http://localhost:3000/admin 进行数据导入
```

### 4. 启动开发服务器

```bash
pnpm dev
```

### 5. 访问应用

- 🏠 **主页**: http://localhost:3000
- ✏️ **批注系统**: http://localhost:3000/annotator  
- 📊 **系统状态**: http://localhost:3000/status
- 🛠️ **数据管理**: http://localhost:3000/admin

## 📖 使用说明

### 🖱️ 鼠标操作

| 操作 | 功能 | 说明 |
|------|------|------|
| **左键拖拽** | 框选视觉块 | 拖拽创建选择框，自动选择相交的视觉块 |
| **左键点击** | 切换选择状态 | 点击视觉块或区域切换其选择状态 |
| **中键拖拽** | 移动画布 | 按住中键拖拽可以移动整个PDF画布 |
| **左键双击** | 重置画布 | 双击左键将画布位置重置到原点 |
| **鼠标悬浮** | 显示信息 | 悬浮在视觉块上显示详细信息提示 |

### ⌨️ 键盘导航 (Vim风格) WIP

| 按键 | 功能 | 说明 |
|------|------|------|
| `h` | 向左导航 | 移动到左侧最近的视觉块 |
| `j` | 向下导航 | 移动到下方最近的视觉块 |
| `k` | 向上导航 | 移动到上方最近的视觉块 |
| `l` | 向右导航 | 移动到右侧最近的视觉块 |
| `v` | 选择模式 | 进入/退出选择模式 |
| `Space` | 切换选择 | 切换当前焦点块的选择状态 |
| `Esc` | 退出模式 | 退出当前选择模式 |


### 🎨 视觉反馈

| 颜色/样式 | 含义 | 说明 |
|-----------|------|------|
| 🔵 **蓝色边框** | 普通视觉块 | 文本类型的视觉块 |
| 🟣 **紫色边框** | 标题块 | 标题类型的视觉块 |
| 🟢 **绿色边框** | 已选中 | 当前选中的视觉块 |
| 🟡 **黄色边框** | 当前焦点 | 键盘导航的当前焦点块 |
| 🔴 **红色虚线** | 区域边界 | 已创建的批注区域 |
| 🔷 **蓝色虚线** | 选择框 | 鼠标拖拽时的选择框 |

### 📝 区域和批注管理

1. **创建区域**:
   - 选择一个或多个视觉块
   - 点击"创建区域"按钮
   - 系统自动计算边界框并创建区域

2. **添加批注**: (WIP)
   - 在区域面板中找到对应区域
   - 点击编辑按钮添加批注文本
   - 批注会实时保存到数据库

3. **删除区域**:
   - 在区域面板中点击删除按钮
   - 确认后区域和相关批注会被删除

## 🗄️ 数据库结构

### 主要数据表

```sql
-- 视觉块表
CREATE TABLE visual_blocks (
  id INTEGER PRIMARY KEY,
  page_index INTEGER NOT NULL,
  block_index INTEGER NOT NULL,
  type TEXT NOT NULL,
  bbox TEXT NOT NULL,
  content TEXT,
  level INTEGER DEFAULT 0,
  parent_id INTEGER
);

-- 区域表  
CREATE TABLE regions (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  annotation TEXT,
  bbox TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 区域-块关系表
CREATE TABLE region_blocks (
  id INTEGER PRIMARY KEY,
  region_id INTEGER NOT NULL,
  block_id INTEGER NOT NULL,
  FOREIGN KEY (region_id) REFERENCES regions(id),
  FOREIGN KEY (block_id) REFERENCES visual_blocks(id)
);

-- 批注表
CREATE TABLE annotations (
  id INTEGER PRIMARY KEY,
  region_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regions(id)
);
```

### 数据流程

1. **数据导入**: 从`middle.json`解析MinerU布局数据
2. **视觉块渲染**: 在PDF画布上绘制视觉块边界  
3. **交互选择**: 响应鼠标和键盘事件选择视觉块
4. **区域创建**: 计算选中块的边界框创建区域
5. **批注管理**: 添加、编辑、删除区域批注
6. **数据持久化**: 所有操作实时同步到SQLite数据库

## 🎛️ 系统配置

### PDF配置

在`assets/data/`目录下放置以下文件：
- `origin.pdf`: 原始PDF文件
- `middle.json`: MinerU处理后的布局数据

文件通过以下API访问：
- PDF文件: `/api/pdf`
- JSON数据: 服务器端直接读取

### 数据库配置

```typescript
// drizzle.config.ts
export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  driver: "libsql",
  dbCredentials: {
    url: process.env.NUXT_DB_URL || "file:local.db"
  }
}
```

### 环境变量

```bash
# .env
NUXT_DB_URL=file:local.db  # 本地SQLite文件路径
```

## 🔍 API接口

### RESTful API

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/blocks` | GET | 获取所有视觉块 |
| `/api/regions` | GET/POST | 获取/创建区域 |
| `/api/regions/:id` | PUT/DELETE | 更新/删除区域 |
| `/api/regions/page/:page` | GET | 获取指定页面的区域 |
| `/api/stats` | GET | 获取系统统计信息 |

### 状态管理

使用Pinia进行状态管理，主要stores：

- **pdfStore**: PDF文档、页面、视觉块状态
- **annotationStore**: 选择状态、区域、批注管理
- **systemStore**: 系统状态、统计信息
- **uiStore**: UI状态、主题、布局

## 🚀 部署

### 本地构建

```bash
# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

### Cloudflare Pages部署

```bash
# 安装Wrangler CLI
npm install -g wrangler

# 登录Cloudflare
wrangler login

# 部署到Cloudflares Pages
wrangler pages deploy dist/
```

## 🛠️ 开发指南

### 添加新功能

1. **新视觉块类型**: 在`utils/pdf-parser.ts`中添加解析逻辑
2. **新交互方式**: 在`components/PDFViewer.vue`中添加事件处理
3. **新API端点**: 在`server/api/`目录下创建新文件
4. **新状态数据**: 在对应的store中添加状态和方法

### 性能优化

- 使用Canvas进行视觉块渲染，避免DOM过多
- 实现视觉块坐标缓存，减少重复计算
- 使用防抖和节流优化频繁操作

### 调试技巧

```bash
# 启用调试模式
DEBUG=1 pnpm dev
```

## 📊 系统监控

访问 `/status` 页面查看：
- 📈 数据库统计信息
- 🔧 API健康状态  
- 💾 数据存储使用情况

## 🐛 常见问题

### Q: 视觉块位置不准确？
A: 检查`overlayDimensions`的计算，确保PDF渲染尺寸与坐标转换一致。

### Q: 框选不工作？  
A: 确认鼠标事件处理正确，检查Canvas层级和事件穿透设置。

### Q: 数据库连接失败？
A: 检查SQLite文件权限，确保Drizzle配置正确。

## 📝 更新日志

### v1.0.0 (Current)
- ✅ 完整的视觉块选择和区域管理功能
- ✅ 画布拖拽和键盘导航
- ✅ 实时数据同步和状态管理
- ✅ 系统状态监控
- ✅ 响应式UI设计

### 下一步计划
- 🔄 支持PDF多页面批注
- 📱 移动端优化
- 🎨 更多批注类型（高亮、箭头等）
- 👥 多用户协作功能
- 📤 批注导出功能

## 🤝 贡献

欢迎贡献代码和建议！请遵循以下步骤：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

<p align="center">
  <strong>🚀 让PDF批注更智能，让知识管理更高效！</strong>
</p>
