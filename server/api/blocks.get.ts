import { db, visualBlocks } from '~/db'

export default defineEventHandler(async (event) => {
  try {
    const blocks = await db.select().from(visualBlocks)
    return { blocks }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch visual blocks'
    })
  }
}) 