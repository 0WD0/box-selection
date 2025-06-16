import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// 视觉块表
export const visualBlocks = sqliteTable('visual_blocks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  pageIndex: integer('page_index').notNull(),
  blockIndex: integer('block_index').notNull(),
  type: text('type').notNull(),
  bbox: text('bbox').notNull(), // JSON 字符串格式
  content: text('content'),
  level: integer('level').default(1),
  parentId: integer('parent_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// 区域表
export const regions = sqliteTable('regions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  rootBlockId: integer('root_block_id').notNull(),
  bbox: text('bbox').notNull(), // JSON 字符串格式
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// 区域-块关系表（多对多）
export const regionBlocks = sqliteTable('region_blocks', {
  regionId: integer('region_id').notNull(),
  blockId: integer('block_id').notNull(),
})

// 批注表
export const annotations = sqliteTable('annotations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  regionId: integer('region_id').notNull(),
  content: text('content').notNull(),
  type: text('type').default('text'),
  position: text('position'), // JSON 字符串格式
  isVisible: integer('is_visible').default(1), // SQLite 布尔值用整数表示
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// 导出类型
export type VisualBlock = typeof visualBlocks.$inferSelect
export type InsertVisualBlock = typeof visualBlocks.$inferInsert
export type Region = typeof regions.$inferSelect
export type InsertRegion = typeof regions.$inferInsert
export type RegionBlock = typeof regionBlocks.$inferSelect
export type InsertRegionBlock = typeof regionBlocks.$inferInsert
export type Annotation = typeof annotations.$inferSelect
export type InsertAnnotation = typeof annotations.$inferInsert 