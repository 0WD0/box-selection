# 🚀 视觉块批注系统

我在做一个基于广义的块的笔记软件。所谓的广义的块是把纯文本块推广到了其他信息媒介上，比如说 PDF、网页、视频。

## 📋 项目概述

我已经对PDF做了 layout 划分，得到了若干视觉块。相比于一般的批注方式（划词和框选），我更想实现一种基于视觉块的批注方式。

### 🎯 核心概念

- **视觉块**: 树上的一个节点，所有视觉块组成的结构是一棵树（初始状态是所有视觉块都连向一个隐形块）
- **区域**: 树上的一个子树，表示若干连续的视觉块，在表现上是一个矩形
- **批注**: 建立了树上节点编号和批注文本编号之间的联系

## 🔧 技术栈

- **前端**: Nuxt 3 + Vue 3 + TypeScript
- **PDF处理**: PDF.js + MinerU layout数据
- **数据库**: SQLite + Drizzle ORM + LibSQL
- **部署**: 计划使用 NuxtHub 部署到 Cloudflare

## 📁 项目结构

```
box-selection/
├── components/
│   └── VisualBlockAnnotator.vue    # 主要的视觉块批注组件
├── db/
│   ├── schema.ts                   # 数据库模式定义
│   └── index.ts                    # 数据库连接
├── pages/
│   ├── index.vue                   # 主页
│   ├── annotator.vue               # 批注系统页面
│   ├── read-all.vue                # PDF查看器
│   └── admin.vue                   # 数据库管理页面
├── server/api/                     # 服务端API
├── utils/
│   └── pdf-parser.ts               # PDF数据解析工具
├── public/data/
│   ├── origin.pdf                  # 原始PDF文件
│   └── middle.json                 # MinerU处理后的layout数据
└── drizzle.config.ts               # 数据库配置
```

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 初始化数据库

```bash
npx drizzle-kit push
```

### 3. 启动开发服务器

```bash
pnpm dev
```

### 4. 访问应用

- 主页: http://localhost:3000
- 批注系统: http://localhost:3000/annotator
- 数据库管理: http://localhost:3000/admin
- PDF查看器: http://localhost:3000/read-all

## 📖 使用说明

### 🖱️ 鼠标操作

1. **框选视觉块**: 在PDF上拖拽鼠标可以框选与选择框相交的视觉块
2. **点击选择**: 直接点击视觉块可以单独选择/取消选择
3. **创建区域**: 选择多个视觉块后，点击"创建区域"按钮
4. **添加批注**: 在创建的区域中添加文本批注

### ⌨️ 键盘操作 (类似Vim)

- `h` - 向左移动当前焦点
- `j` - 向下移动当前焦点  
- `k` - 向上移动当前焦点
- `l` - 向右移动当前焦点
- `v` - 进入/退出选择模式
- `Space` - 切换当前块的选择状态
- `Esc` - 退出选择模式

### 🎨 视觉反馈

- **蓝色边框**: 未选中的视觉块
- **绿色边框**: 已选中的视觉块
- **黄色边框**: 当前焦点块
- **红色边框**: 已创建的区域
- **虚线框**: 鼠标框选时的选择框

## 🗄️ 数据库结构

### 表结构

1. **visual_blocks** - 视觉块表
   - 存储每个视觉块的位置、类型、内容等信息
   - 支持树形结构（parent_id字段）

2. **regions** - 区域表
   - 存储创建的区域信息
   - 包含区域的边界框信息

3. **region_blocks** - 区域-块关系表
   - 多对多关系表，记录哪些视觉块属于哪个区域

4. **annotations** - 批注表
   - 存储批注内容
   - 关联到具体的区域

### 数据流程

1. **数据导入**: 从MinerU的middle.json文件解析视觉块数据
2. **交互选择**: 用户通过鼠标或键盘选择视觉块
3. **区域创建**: 将选中的视觉块组成一个区域
4. **批注添加**: 为区域添加文本批注
5. **数据持久化**: 所有操作都保存到SQLite数据库

## 🔄 数据格式

### MinerU数据格式

项目使用MinerU处理PDF得到的layout信息，格式参考：
https://mineru.readthedocs.io/zh-cn/latest/user_guide/tutorial/output_file_description.html

### 视觉块数据结构

```typescript
interface VisualBlock {
  id: number
  pageIndex: number
  blockIndex: number
  type: string        // text, title, image, table等
  bbox: string        // JSON格式的边界框 [x, y, width, height]
  content: string     // 文本内容
  level: number       // 层级
  parentId: number    // 父节点ID
}
```

## 🛠️ 开发说明

### 添加新功能

1. **新的交互方式**: 在`VisualBlockAnnotator.vue`中添加事件处理
2. **新的数据类型**: 在`db/schema.ts`中扩展数据库模式
3. **新的API**: 在`server/api/`目录下添加端点
4. **新的工具函数**: 在`utils/`目录下添加

### 部署准备

项目设计为可以部署到Cloudflare Pages，使用NuxtHub：

```bash
# 安装NuxtHub CLI
npm i -g nuxthub

# 部署到Cloudflare
nuxthub deploy
```

## 📝 TODO

- [ ] 实现视觉块的自动层级划分
- [ ] 支持更多的批注类型（高亮、箭头等）
- [ ] 优化键盘导航的性能
- [ ] 添加导出功能
- [ ] 支持多用户协作
- [ ] 移动端适配优化

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## �� 许可证

MIT License
