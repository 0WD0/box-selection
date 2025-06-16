import { eq } from 'drizzle-orm'
import * as tables from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  console.log('🔍 regions.get.ts: 收到获取区域请求')
  
  try {
    // 获取所有区域
    const regions = await useDrizzle()
      .select({
        id: tables.regions.id,
        name: tables.regions.name,
        bbox: tables.regions.bbox,
        createdAt: tables.regions.createdAt,
        updatedAt: tables.regions.updatedAt
      })
      .from(tables.regions)
      .orderBy(tables.regions.createdAt)

    console.log(`📊 找到 ${regions.length} 个区域:`, regions)

    // 获取每个区域的关联块和批注
    const regionsWithBlocks = await Promise.all(
      regions.map(async (region) => {
        console.log(`🔍 处理区域 #${region.id}:`, region)
        
        try {
          // 获取关联的块
          const regionBlocks = await useDrizzle()
            .select({
              blockId: tables.regionBlocks.blockId
            })
            .from(tables.regionBlocks)
            .where(eq(tables.regionBlocks.regionId, region.id))
          
          console.log(`📦 区域 #${region.id} 关联的块:`, regionBlocks)

          // 获取批注
          const annotations = await useDrizzle()
            .select({
              content: tables.annotations.content
            })
            .from(tables.annotations)
            .where(eq(tables.annotations.regionId, region.id))
            .limit(1)
          
          console.log(`📝 区域 #${region.id} 的批注:`, annotations)

          // 安全解析bbox
          let parsedBbox
          try {
            parsedBbox = JSON.parse(region.bbox)
          } catch (bboxError) {
            console.error(`❌ 区域 #${region.id} bbox解析失败:`, bboxError)
            parsedBbox = { x: 0, y: 0, width: 0, height: 0 }
          }

          const result = {
            ...region,
            bbox: parsedBbox,
            blocks: regionBlocks.map(rb => rb.blockId),
            annotation: annotations[0]?.content || ''
          }
          
          console.log(`✅ 区域 #${region.id} 处理完成:`, result)
          return result
        } catch (error) {
          console.error(`❌ 处理区域 #${region.id} 时出错:`, error)
          return {
            ...region,
            bbox: { x: 0, y: 0, width: 0, height: 0 },
            blocks: [],
            annotation: ''
          }
        }
      })
    )

    console.log(`✅ 返回 ${regionsWithBlocks.length} 个完整区域数据`)
    
    return { 
      success: true, 
      regions: regionsWithBlocks 
    }
  } catch (error: any) {
    console.error('❌ regions.get.ts 错误:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to load regions: ${error.message}`
    })
  }
})