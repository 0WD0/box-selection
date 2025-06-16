import { parseMiddleJsonToBlocks, type MiddleJsonData } from '~/utils/pdf-parser'
import fs from 'fs'
import path from 'path'

export default defineTask({
  meta: {
    name: 'db:seed',
    description: 'Initialize database with MinerU visual blocks data'
  },
  async run() {
    console.log('Running DB seed task...')
    
    try {
      // 读取 MinerU 数据文件
      const filePath = path.join(process.cwd(), 'public/data/middle.json')
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const data: MiddleJsonData = JSON.parse(fileContent)
      
      // 解析为视觉块数据
      const blocks = parseMiddleJsonToBlocks(data)
      
      // 批量插入到数据库
      const insertedBlocks = await Promise.all(
        blocks.map(async (block) => {
          return await useDrizzle().insert(tables.visualBlocks).values({
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
      
      console.log(`Successfully initialized ${blocks.length} visual blocks`)
      return { 
        result: 'success',
        message: `Successfully initialized ${blocks.length} visual blocks`,
        count: blocks.length
      }
    } catch (error: any) {
      console.error('Failed to seed database:', error)
      return { 
        result: 'error',
        message: `Failed to initialize database: ${error.message}`
      }
    }
  }
}) 