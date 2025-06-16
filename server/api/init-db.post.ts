import { parseMiddleJsonToBlocks, type MiddleJsonData } from '~/utils/pdf-parser'
import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  try {
    // 读取 MinerU 数据文件
    const filePath = path.join(process.cwd(), 'public/data/middle.json')
    
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        message: 'MinerU data file not found. Please ensure public/data/middle.json exists.',
        path: filePath
      }
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const data: MiddleJsonData = JSON.parse(fileContent)
    
    // 解析为视觉块数据
    const blocks = parseMiddleJsonToBlocks(data)
    
    // 检查数据库中是否已有数据
    const existingBlocks = await useDrizzle().select().from(tables.visualBlocks).limit(1)
    if (existingBlocks.length > 0) {
      return {
        success: false,
        message: 'Database already contains data. Clear it first if you want to reinitialize.',
        existingCount: existingBlocks.length
      }
    }
    
    // 批量插入到数据库
    let insertedCount = 0
    for (const block of blocks) {
      await useDrizzle().insert(tables.visualBlocks).values({
        pageIndex: block.pageIndex,
        blockIndex: block.blockIndex,
        type: block.type,
        bbox: block.bbox,
        content: block.content,
        level: block.level,
        parentId: block.parentId
      })
      insertedCount++
    }
    
    return { 
      success: true, 
      message: `Successfully initialized ${insertedCount} visual blocks`,
      count: insertedCount
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to initialize database: ${error.message}`
    })
  }
}) 