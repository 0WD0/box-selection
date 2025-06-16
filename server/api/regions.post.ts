import * as tables from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, annotation, blocks, bbox } = body

  try {
    // 创建区域 (使用第一个块作为rootBlockId)
    const rootBlockId = blocks && blocks.length > 0 ? blocks[0] : 0
    const [region] = await useDrizzle().insert(tables.regions).values({
      name,
      rootBlockId,
      bbox: JSON.stringify(bbox)
    }).returning()

    // 创建区域-块关系
    if (blocks && blocks.length > 0) {
      await Promise.all(
        blocks.map((blockId: number) =>
          useDrizzle().insert(tables.regionBlocks).values({
            regionId: region.id,
            blockId
          })
        )
      )
    }

    // 创建批注（如果有）
    if (annotation) {
      await useDrizzle().insert(tables.annotations).values({
        regionId: region.id,
        content: annotation,
        type: 'text'
      })
    }

    return { success: true, region }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to create region: ${error.message}`
    })
  }
}) 