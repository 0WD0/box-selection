import { db, regions, regionBlocks } from '~/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, rootBlockId, bbox, blockIds } = body

  try {
    // 创建区域
    const [region] = await db.insert(regions).values({
      name,
      rootBlockId,
      bbox: JSON.stringify(bbox)
    }).returning()

    // 创建区域-块关系
    if (blockIds && blockIds.length > 0) {
      await Promise.all(
        blockIds.map((blockId: number) =>
          db.insert(regionBlocks).values({
            regionId: region.id,
            blockId
          })
        )
      )
    }

    return { success: true, region }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to create region: ${error.message}`
    })
  }
}) 