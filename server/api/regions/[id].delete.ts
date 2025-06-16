import { eq } from 'drizzle-orm'
import * as tables from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const regionId = parseInt(getRouterParam(event, 'id') || '0')

  try {
    // 删除相关批注
    await useDrizzle()
      .delete(tables.annotations)
      .where(eq(tables.annotations.regionId, regionId))

    // 删除区域-块关系
    await useDrizzle()
      .delete(tables.regionBlocks)
      .where(eq(tables.regionBlocks.regionId, regionId))

    // 删除区域
    await useDrizzle()
      .delete(tables.regions)
      .where(eq(tables.regions.id, regionId))

    return { success: true }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to delete region: ${error.message}`
    })
  }
})

