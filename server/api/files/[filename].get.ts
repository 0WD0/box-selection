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
    
    try {
      // 🎯 默认优先：检查 blob 存储
      console.log(`🔍 [优先] HEAD检查blob存储: ${filename}`)
      const blobExists = await hubBlob().head(filename)
      if (blobExists) {
        console.log(`✅ [blob] HEAD: ${filename} 在blob存储中存在`)
        setHeader(event, 'Content-Length', blobExists.size || 0)
        if (filename.endsWith('.pdf')) {
          setHeader(event, 'Content-Type', 'application/pdf')
        } else if (filename.endsWith('.json')) {
          setHeader(event, 'Content-Type', 'application/json')
        }
        setResponseStatus(event, 200)
        return
      }
    } catch (blobError) {
      console.log(`⚠️ [blob] HEAD blob检查失败，回退到assets: ${blobError}`)
    }
    
    // 🔄 回退方案：检查 assets 目录
    console.log(`📂 [回退] HEAD检查assets目录: ${filename}`)
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.resolve(`./assets/${filename}`)
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath)
      console.log(`✅ [assets] HEAD: ${filename} 在assets中存在`)
      setHeader(event, 'Content-Length', stats.size)
      if (filename.endsWith('.pdf')) {
        setHeader(event, 'Content-Type', 'application/pdf')
      } else if (filename.endsWith('.json')) {
        setHeader(event, 'Content-Type', 'application/json')
      }
      setResponseStatus(event, 200)
      return
    }
    
    throw createError({
      statusCode: 404,
      statusMessage: `File not found in both blob storage and assets: ${filename}`
    })
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
    
    // 🎯 默认优先：尝试从 blob 存储读取
    try {
      console.log(`🔍 [优先] 尝试从blob存储读取: ${filename}`)
      
      // 使用 hubBlob().serve() 方法，它会自动设置正确的响应头
      const blobResult = await hubBlob().serve(event, filename)
      console.log(`✅ [blob] 成功从blob存储读取: ${filename}`)
      return blobResult
      
    } catch (blobError) {
      console.log(`⚠️ [blob] Blob存储读取失败，回退到assets: ${blobError}`)
      
      // 🔄 回退方案：从assets目录读取
      console.log(`📂 [回退] 尝试从assets目录读取: ${filename}`)
      
      const fs = await import('fs')
      const path = await import('path')
      
      const filePath = path.resolve(`./assets/${filename}`)
      
      if (!fs.existsSync(filePath)) {
        throw createError({
          statusCode: 404,
          statusMessage: `File not found in both blob storage and assets: ${filename}`
        })
      }
      
      const fileBuffer = fs.readFileSync(filePath)
      console.log(`✅ [assets] 从assets成功读取: ${filename}, 大小: ${fileBuffer.length} bytes`)
      
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