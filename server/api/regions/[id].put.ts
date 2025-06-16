import { eq } from 'drizzle-orm'
import * as tables from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const regionId = parseInt(getRouterParam(event, 'id') || '0')
  const body = await readBody(event)
  const { name, annotation, blocks, bbox } = body

  try {
    // 更新区域基本信息
    await useDrizzle()
      .update(tables.regions)
      .set({
        name,
        bbox: JSON.stringify(bbox),
        updatedAt: new Date()
      })
      .where(eq(tables.regions.id, regionId))

    // 更新批注
    if (annotation !== undefined) {
      // 先查找是否已有批注
      const existingAnnotation = await useDrizzle()
        .select()
        .from(tables.annotations)
        .where(eq(tables.annotations.regionId, regionId))
        .limit(1)

      if (existingAnnotation.length > 0) {
        // 更新现有批注
        await useDrizzle()
          .update(tables.annotations)
          .set({
            content: annotation,
            updatedAt: new Date()
          })
          .where(eq(tables.annotations.regionId, regionId))
      } else if (annotation) {
        // 创建新批注
        await useDrizzle()
          .insert(tables.annotations)
          .values({
            regionId,
            content: annotation,
            type: 'text'
          })
      }
    }

    // 更新区域-块关系
    if (blocks) {
      // 删除现有关系
      await useDrizzle()
        .delete(tables.regionBlocks)
        .where(eq(tables.regionBlocks.regionId, regionId))

      // 添加新关系
      if (blocks.length > 0) {
        await Promise.all(
          blocks.map((blockId: number) =>
            useDrizzle().insert(tables.regionBlocks).values({
              regionId,
              blockId
            })
          )
        )
      }
    }

    return { success: true }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to update region: ${error.message}`
    })
  }
})