import { parseMiddleJsonToBlocks, type MiddleJsonData } from '~/utils/pdf-parser'
import * as tables from '~/server/database/schema'

// 数据处理函数
async function processData(data: MiddleJsonData) {
  // 解析为视觉块数据
  console.log('🔄 开始解析 MinerU 数据...')
  const blocks = parseMiddleJsonToBlocks(data)
  console.log(`📦 解析完成，共 ${blocks.length} 个视觉块`)
  
  // 检查数据库中是否已有数据，如果有则先清空
  const existingBlocks = await useDrizzle().select().from(tables.visualBlocks).limit(1)
  if (existingBlocks.length > 0) {
    console.log('🗑️ 发现现有数据，开始清空数据库...')
    
    // 删除所有相关表的数据
    await useDrizzle().delete(tables.regionBlocks)
    await useDrizzle().delete(tables.annotations) 
    await useDrizzle().delete(tables.regions)
    await useDrizzle().delete(tables.visualBlocks)
    
    console.log('✅ 数据库清空完成')
  }
  
  // 批量插入到数据库
  console.log('💾 开始插入视觉块到数据库...')
  let insertedCount = 0
  for (const block of blocks) {
    await useDrizzle().insert(tables.visualBlocks).values({
      pageIndex: block.pageIndex,
      blockIndex: block.blockIndex,
      type: block.type,
      bbox: block.bbox,
      content: block.content,
      level: block.level,
      parentId: block.parentId,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    insertedCount++
    
    // 每插入100个块就打印一次进度
    if (insertedCount % 100 === 0) {
      console.log(`📦 已插入 ${insertedCount}/${blocks.length} 个视觉块`)
    }
  }
  
  console.log(`✅ 数据库初始化完成！共插入 ${insertedCount} 个视觉块`)
  
  return { 
    success: true, 
    message: `Successfully initialized ${insertedCount} visual blocks`,
    count: insertedCount
  }
}

export default defineEventHandler(async (event) => {
  console.log('🔄 init-db.post.ts: 收到初始化请求')
  
  try {
    // 在服务器端需要使用完整URL
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : `https://${getHeader(event, 'host') || 'localhost'}`
    const dataUrl = `${baseUrl}/data/middle.json`
    
    console.log(`📡 尝试读取: ${dataUrl}`)
    const response = await fetch(dataUrl)
    
    if (!response.ok) {
      console.error(`❌ 无法读取数据文件: HTTP ${response.status} ${response.statusText}`)
              return {
          success: false,
          message: `Failed to load MinerU data: HTTP ${response.status} ${response.statusText}. Please ensure public/data/middle.json exists and is accessible.`,
          url: dataUrl
        }
    }
    
    console.log('✅ 成功读取数据文件')
    const data: MiddleJsonData = await response.json()
    
    // 使用processData函数处理数据
    return await processData(data)
  } catch (error: any) {
    console.error('❌ 数据库初始化失败:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to initialize database: ${error.message}`
    })
  }
}) 