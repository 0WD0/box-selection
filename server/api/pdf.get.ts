export default defineEventHandler(async (event) => {
  try {
    console.log('📄 PDF API: 请求PDF文件')
    
    // 从assets目录读取PDF文件
    const fs = await import('fs')
    const path = await import('path')
    
    const filePath = path.resolve('./assets/data/origin.pdf')
    console.log(`📂 PDF文件路径: ${filePath}`)
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ PDF文件不存在: ${filePath}`)
      throw createError({
        statusCode: 404,
        statusMessage: `PDF file not found at ${filePath}`
      })
    }
    
    // 读取PDF文件
    const pdfBuffer = fs.readFileSync(filePath)
    console.log(`✅ 成功读取PDF文件，大小: ${pdfBuffer.length} bytes`)
    
    // 设置正确的响应头
    setHeader(event, 'Content-Type', 'application/pdf')
    setHeader(event, 'Content-Length', pdfBuffer.length)
    setHeader(event, 'Cache-Control', 'public, max-age=3600') // 缓存1小时
    
    return pdfBuffer
  } catch (error: any) {
    console.error('❌ PDF API错误:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to serve PDF: ${error.message}`
    })
  }
}) 