import { eq } from 'drizzle-orm'
import * as tables from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  try {
    // 获取所有区域
    const regions = await useDrizzle()
      .select({
        id: tables.regions.id,
        name: tables.regions.name,
        rootBlockId: tables.regions.rootBlockId,
        bbox: tables.regions.bbox,
        createdAt: tables.regions.createdAt,
        updatedAt: tables.regions.updatedAt
      })
      .from(tables.regions)
      .orderBy(tables.regions.createdAt)

    // 获取每个区域的关联块和批注
    const regionsWithBlocks = await Promise.all(
      regions.map(async (region) => {
        // 获取关联的块
        const regionBlocks = await useDrizzle()
          .select({
            blockId: tables.regionBlocks.blockId
          })
          .from(tables.regionBlocks)
          .where(eq(tables.regionBlocks.regionId, region.id))

        // 获取批注
        const annotations = await useDrizzle()
          .select({
            content: tables.annotations.content
          })
          .from(tables.annotations)
          .where(eq(tables.annotations.regionId, region.id))
          .limit(1)

        return {
          ...region,
          bbox: JSON.parse(region.bbox),
          blocks: regionBlocks.map(rb => rb.blockId),
          annotation: annotations[0]?.content || ''
        }
      })
    )

    return { 
      success: true, 
      regions: regionsWithBlocks 
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to load regions: ${error.message}`
    })
  }
})