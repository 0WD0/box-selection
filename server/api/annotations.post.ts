export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { regionId, content, type = 'text', position } = body

  try {
    const [annotation] = await useDrizzle().insert(tables.annotations).values({
      regionId,
      content,
      type,
      position: position ? JSON.stringify(position) : null,
      isVisible: 1
    }).returning()

    return { success: true, annotation }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to create annotation: ${error.message}`
    })
  }
}) 