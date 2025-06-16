import { sql } from 'drizzle-orm'
import * as tables from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle()
    
    // 获取各个表的统计数据
    const [visualBlocksResult] = await db
      .select({ count: sql`count(*)` })
      .from(tables.visualBlocks)
    
    const [regionsResult] = await db
      .select({ count: sql`count(*)` })
      .from(tables.regions)
    
    const [annotationsResult] = await db
      .select({ count: sql`count(*)` })
      .from(tables.annotations)
    
    const [regionBlocksResult] = await db
      .select({ count: sql`count(*)` })
      .from(tables.regionBlocks)

    return {
      success: true,
      stats: {
        visualBlocks: Number(visualBlocksResult.count) || 0,
        regions: Number(regionsResult.count) || 0,
        annotations: Number(annotationsResult.count) || 0,
        regionBlocks: Number(regionBlocksResult.count) || 0
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to get stats: ${error.message}`
    })
  }
}) 