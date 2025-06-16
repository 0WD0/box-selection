export default defineEventHandler(async (event) => {
  try {
    const blocks = await useDrizzle().select().from(tables.visualBlocks)
    return { blocks }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch visual blocks: ${error.message}`
    })
  }
}) 