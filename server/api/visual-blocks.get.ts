import * as tables from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  try {
    console.log('🔍 visual-blocks.get.ts: 获取visual blocks数据')
    
    const visualBlocks = await useDrizzle()
      .select({
        id: tables.visualBlocks.id,
        pageIndex: tables.visualBlocks.pageIndex,
        blockIndex: tables.visualBlocks.blockIndex,
        type: tables.visualBlocks.type,
        bbox: tables.visualBlocks.bbox,
        content: tables.visualBlocks.content,
        level: tables.visualBlocks.level
      })
      .from(tables.visualBlocks)
      .orderBy(tables.visualBlocks.pageIndex, tables.visualBlocks.blockIndex)

    console.log(`📊 找到 ${visualBlocks.length} 个visual blocks`)

    // 解析bbox字符串为对象
    const processedBlocks = visualBlocks.map(block => {
      const bboxArray = JSON.parse(block.bbox)
      return {
        ...block,
        bbox: {
          x: bboxArray[0],
          y: bboxArray[1],
          width: bboxArray[2],
          height: bboxArray[3]
        }
      }
    })

    return {
      success: true,
      visualBlocks: processedBlocks
    }
  } catch (error: any) {
    console.error('❌ 获取visual blocks失败:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to get visual blocks: ${error.message}`
    })
  }
}) 