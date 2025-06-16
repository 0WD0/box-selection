import { db, visualBlocks } from '~/db'
import { parseMiddleJsonToBlocks, type MiddleJsonData } from '~/utils/pdf-parser'
import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  try {
    // 读取middle.json文件
    const filePath = path.join(process.cwd(), 'public/data/middle.json')
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const data: MiddleJsonData = JSON.parse(fileContent)
    
    // 解析为视觉块数据
    const blocks = parseMiddleJsonToBlocks(data)
    
    // 批量插入到数据库
    const insertedBlocks = await Promise.all(
      blocks.map(async (block, index) => {
        return await db.insert(visualBlocks).values({
          pageIndex: block.pageIndex,
          blockIndex: block.blockIndex,
          type: block.type,
          bbox: block.bbox,
          content: block.content,
          level: block.level,
          parentId: block.parentId
        }).returning()
      })
    )
    
    return { 
      success: true, 
      message: `Successfully initialized ${blocks.length} visual blocks`,
      count: blocks.length
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to initialize database: ${error.message}`
    })
  }
}) 