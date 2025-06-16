export default defineEventHandler(async (event) => {
  // 处理HEAD请求
  if (getMethod(event) === 'HEAD') {
    const filename = getRouterParam(event, 'filename')
    
    if (!filename) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Filename is required'
      })
    }
    
    const allowedFiles = ['origin.pdf', 'middle.json']
    if (!allowedFiles.includes(filename)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'File not allowed'
      })
    }
    
    // 设置响应头但不返回内容
    if (filename.endsWith('.pdf')) {
      setHeader(event, 'Content-Type', 'application/pdf')
    } else if (filename.endsWith('.json')) {
      setHeader(event, 'Content-Type', 'application/json')
    }
    
    setResponseStatus(event, 200)
    return
  }
  const filename = getRouterParam(event, 'filename')
  
  if (!filename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Filename is required'
    })
  }
  
  // 只允许特定的文件
  const allowedFiles = ['origin.pdf', 'middle.json']
  if (!allowedFiles.includes(filename)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'File not allowed'
    })
  }
  
  try {
    console.log(`📄 请求文件: ${filename}`)
    
    // 首先尝试从 blob 存储读取
    try {
      console.log(`🔍 尝试从blob存储读取: ${filename}`)
      
      // 使用 hubBlob().serve() 方法，它会自动设置正确的响应头
      return await hubBlob().serve(event, filename)
      
    } catch (blobError) {
      console.log(`⚠️ Blob存储读取失败: ${blobError}`)
      
      // 如果blob存储失败，回退到assets目录
      console.log(`📂 回退到assets目录读取: ${filename}`)
      
      const fs = await import('fs')
      const path = await import('path')
      
      const filePath = path.resolve(`./assets/${filename}`)
      
      if (!fs.existsSync(filePath)) {
        throw createError({
          statusCode: 404,
          statusMessage: `File not found: ${filename}`
        })
      }
      
      const fileBuffer = fs.readFileSync(filePath)
      console.log(`✅ 从assets成功读取: ${filename}, 大小: ${fileBuffer.length} bytes`)
      
      // 设置响应头
      if (filename.endsWith('.pdf')) {
        setHeader(event, 'Content-Type', 'application/pdf')
      } else if (filename.endsWith('.json')) {
        setHeader(event, 'Content-Type', 'application/json')
      }
      
      setHeader(event, 'Content-Length', fileBuffer.length)
      setHeader(event, 'Cache-Control', 'public, max-age=3600')
      
      return fileBuffer
    }
    
  } catch (error: any) {
    console.error(`❌ 文件服务错误 (${filename}):`, error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to serve file: ${error.message}`
    })
  }
}) 