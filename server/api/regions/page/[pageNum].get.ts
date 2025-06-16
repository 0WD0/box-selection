import { eq, inArray } from 'drizzle-orm'
import * as tables from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const pageNum = parseInt(getRouterParam(event, 'pageNum') || '1')
  const pageIndex = pageNum - 1 // 转换为0基础索引

  try {
    console.log(`🔍 [API] 查询第 ${pageNum} 页的区域 (pageIndex: ${pageIndex})`)

    // 1. 获取当前页面的所有视觉块ID
    const pageBlocks = await useDrizzle()
      .select({ id: tables.visualBlocks.id })
      .from(tables.visualBlocks)
      .where(eq(tables.visualBlocks.pageIndex, pageIndex))

    if (pageBlocks.length === 0) {
      console.log(`📄 [API] 第 ${pageNum} 页没有视觉块`)
      return { success: true, regions: [] }
    }

    const blockIds = pageBlocks.map(b => b.id)
    console.log(`📦 [API] 第 ${pageNum} 页有 ${blockIds.length} 个视觉块`)

    // 2. 查找包含这些块的区域
    const regionBlocks = await useDrizzle()
      .select({ regionId: tables.regionBlocks.regionId })
      .from(tables.regionBlocks)
      .where(inArray(tables.regionBlocks.blockId, blockIds))

    if (regionBlocks.length === 0) {
      console.log(`🏛️ [API] 第 ${pageNum} 页没有区域`)
      return { success: true, regions: [] }
    }

    const regionIds = [...new Set(regionBlocks.map(rb => rb.regionId))]
    console.log(`🏛️ [API] 第 ${pageNum} 页有 ${regionIds.length} 个区域`)

    // 3. 获取区域详细信息
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
      .where(inArray(tables.regions.id, regionIds))

    // 4. 获取每个区域的块和批注
    const regionsWithDetails = await Promise.all(
      regions.map(async (region) => {
        // 获取区域的所有块
        const allRegionBlocks = await useDrizzle()
          .select({ blockId: tables.regionBlocks.blockId })
          .from(tables.regionBlocks)
          .where(eq(tables.regionBlocks.regionId, region.id))

        // 获取批注
        const annotations = await useDrizzle()
          .select({ content: tables.annotations.content })
          .from(tables.annotations)
          .where(eq(tables.annotations.regionId, region.id))
          .limit(1)

        return {
          ...region,
          bbox: JSON.parse(region.bbox),
          blocks: allRegionBlocks.map(rb => rb.blockId),
          annotation: annotations[0]?.content || ''
        }
      })
    )

    console.log(`✅ [API] 返回第 ${pageNum} 页的 ${regionsWithDetails.length} 个区域`)
    return { 
      success: true, 
      regions: regionsWithDetails,
      pageNum,
      totalRegions: regionsWithDetails.length
    }
  } catch (error: any) {
    console.error(`❌ [API] 查询第 ${pageNum} 页区域失败:`, error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to load regions for page ${pageNum}: ${error.message}`
    })
  }
})