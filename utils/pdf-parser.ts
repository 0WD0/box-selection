// MinerU 数据格式接口定义
export interface Bbox {
  x: number
  y: number
  width: number
  height: number
}

export interface Span {
  bbox: number[] // [x, y, x2, y2]
  type: string
  content?: string
  img_path?: string
  score?: number
}

export interface Line {
  bbox: number[]
  spans: Span[]
}

export interface Block {
  bbox: number[]
  type: string
  lines: Line[]
  index?: number
  level?: number
  blocks?: Block[] // 嵌套块
}

export interface PageInfo {
  para_blocks: Block[]
  page_idx: number
  page_size: [number, number]
  layout_bboxes?: any[]
  images?: any[]
  tables?: any[]
  interline_equations?: any[]
  discarded_blocks?: any[]
}

export interface MiddleJsonData {
  pdf_info: PageInfo[]
  _parse_type: string
  _version_name: string
}

// 工具函数：将bbox数组转换为对象格式
export function bboxArrayToObject(bbox: number[]): Bbox {
  return {
    x: bbox[0],
    y: bbox[1], 
    width: bbox[2] - bbox[0],
    height: bbox[3] - bbox[1]
  }
}

// 工具函数：计算两个矩形是否相交
export function isRectIntersect(rect1: Bbox, rect2: Bbox): boolean {
  return !(rect1.x + rect1.width < rect2.x || 
           rect2.x + rect2.width < rect1.x || 
           rect1.y + rect1.height < rect2.y || 
           rect2.y + rect2.height < rect1.y)
}

// 工具函数：计算多个矩形的包围盒
export function calculateBoundingBox(rects: Bbox[]): Bbox {
  if (rects.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  let minX = rects[0].x
  let minY = rects[0].y
  let maxX = rects[0].x + rects[0].width
  let maxY = rects[0].y + rects[0].height

  for (let i = 1; i < rects.length; i++) {
    const rect = rects[i]
    minX = Math.min(minX, rect.x)
    minY = Math.min(minY, rect.y)
    maxX = Math.max(maxX, rect.x + rect.width)
    maxY = Math.max(maxY, rect.y + rect.height)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

// 工具函数：提取块的文本内容
export function extractBlockText(block: Block): string {
  let text = ''
  
  if (block.lines) {
    for (const line of block.lines) {
      for (const span of line.spans) {
        if (span.content) {
          text += span.content + ' '
        }
      }
      text += '\n'
    }
  }
  
  if (block.blocks) {
    for (const subBlock of block.blocks) {
      text += extractBlockText(subBlock)
    }
  }

  return text.trim()
}

// 解析中间JSON数据为视觉块数组
export function parseMiddleJsonToBlocks(data: MiddleJsonData) {
  const visualBlocks: any[] = []
  
  data.pdf_info.forEach((pageInfo, pageIndex) => {
    pageInfo.para_blocks.forEach((block, blockIndex) => {
      const blockBbox = bboxArrayToObject(block.bbox)
      const content = extractBlockText(block)
      
      visualBlocks.push({
        pageIndex,
        blockIndex,
        type: block.type,
        bbox: JSON.stringify([blockBbox.x, blockBbox.y, blockBbox.width, blockBbox.height]),
        content,
        level: block.level || 1,
        parentId: null, // 初始状态下所有块都是根级
        lines: block.lines,
        originalBlock: block
      })
    })
  })
  
  return visualBlocks
} 