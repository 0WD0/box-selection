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
export type Region = typeof schema.regions.$inferSelect
export type InsertRegion = typeof schema.regions.$inferInsert
export type RegionBlock = typeof schema.regionBlocks.$inferSelect
export type InsertRegionBlock = typeof schema.regionBlocks.$inferInsert
export type Annotation = typeof schema.annotations.$inferSelect
export type InsertAnnotation = typeof schema.annotations.$inferInsert