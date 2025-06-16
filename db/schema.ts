import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// 视觉块表
export const visualBlocks = sqliteTable('visual_blocks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  pageIndex: integer('page_index').notNull(),
  blockIndex: integer('block_index').notNull(), // 在页面中的索引
  type: text('type').notNull(), // text, title, image, table, etc.
  bbox: text('bbox').notNull(), // JSON string: [x, y, width, height]
  content: text('content'), // 文本内容或描述
  level: integer('level').default(1), // 层级
  parentId: integer('parent_id'), // 父节点ID，用于构建树结构
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now())
})

// 区域表 - 表示选中的子树
export const regions = sqliteTable('regions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'), // 可选的区域名称
  rootBlockId: integer('root_block_id').notNull(), // 根节点视觉块ID
  bbox: text('bbox').notNull(), // 区域的边界框 JSON
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now())
})

// 区域中的视觉块关系表
export const regionBlocks = sqliteTable('region_blocks', {
  regionId: integer('region_id').notNull(),
  blockId: integer('block_id').notNull()
}, (table) => ({
  pk: primaryKey({ columns: [table.regionId, table.blockId] })
}))

// 批注表
export const annotations = sqliteTable('annotations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  regionId: integer('region_id').notNull(),
  content: text('content').notNull(), // 批注内容
  type: text('type').default('text'), // text, highlight, comment, etc.
  position: text('position'), // 批注位置信息 JSON
  isVisible: integer('is_visible').default(1), // 1 = true, 0 = false
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now())
})

// 定义关系
export const visualBlocksRelations = relations(visualBlocks, ({ one, many }) => ({
  parent: one(visualBlocks, {
    fields: [visualBlocks.parentId],
    references: [visualBlocks.id]
  }),
  children: many(visualBlocks),
  regionBlocks: many(regionBlocks)
}))

export const regionsRelations = relations(regions, ({ one, many }) => ({
  rootBlock: one(visualBlocks, {
    fields: [regions.rootBlockId],
    references: [visualBlocks.id]
  }),
  annotations: many(annotations),
  regionBlocks: many(regionBlocks)
}))

export const regionBlocksRelations = relations(regionBlocks, ({ one }) => ({
  region: one(regions, {
    fields: [regionBlocks.regionId],
    references: [regions.id]
  }),
  block: one(visualBlocks, {
    fields: [regionBlocks.blockId],
    references: [visualBlocks.id]
  })
}))

export const annotationsRelations = relations(annotations, ({ one }) => ({
  region: one(regions, {
    fields: [annotations.regionId],
    references: [regions.id]
  })
})) 