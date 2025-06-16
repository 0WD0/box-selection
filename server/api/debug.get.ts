import { inArray } from 'drizzle-orm'
import * as tables from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  try {
    const db = useDrizzle()
    
    // 获取regions表的实际数据
    const regionsRaw = await db.select().from(tables.regions).limit(5)
    
    // 获取visual_blocks的前几个
    const visualBlocksRaw = await db.select().from(tables.visualBlocks).limit(5)
    
    // 获取特定的visual blocks (用于调试区域问题)
    const specificBlocks = await db.select()
      .from(tables.visualBlocks)
      .where(inArray(tables.visualBlocks.id, [30, 31, 47, 48, 49, 50, 51, 52, 53, 54]))
    
    // 获取annotations和region_blocks
    const annotationsRaw = await db.select().from(tables.annotations).limit(5)
    const regionBlocksRaw = await db.select().from(tables.regionBlocks).limit(5)
    
    return {
      success: true,
      debug: {
        regions: regionsRaw,
        visualBlocks: visualBlocksRaw,
        specificBlocks: specificBlocks,
        annotations: annotationsRaw,
        regionBlocks: regionBlocksRaw,
        counts: {
          regions: regionsRaw.length,
          visualBlocks: visualBlocksRaw.length,
          specificBlocks: specificBlocks.length,
          annotations: annotationsRaw.length,
          regionBlocks: regionBlocksRaw.length
        }
      }
    }
  } catch (error: any) {
    console.error('Debug API error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}) 