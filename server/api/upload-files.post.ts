export default defineEventHandler(async (event) => {
  try {
    console.log('📤 开始上传文件到blob存储')
    
    // 检查blob存储是否可用
    try {
      await hubBlob().head('test')
    } catch (error) {
      console.log('🔍 Blob存储检查完成（预期的错误）')
    }
    
    // 从assets目录读取文件
    const fs = await import('fs')
    const path = await import('path')
    
    const results = []
    
    // 上传PDF文件
    const pdfPath = path.resolve('./assets/data/origin.pdf')
    console.log(`🔍 检查PDF文件: ${pdfPath}`)
    
    if (fs.existsSync(pdfPath)) {
      console.log('📄 读取PDF文件...')
      const pdfBuffer = fs.readFileSync(pdfPath)
      console.log(`📄 PDF文件大小: ${pdfBuffer.length} bytes`)
      
      console.log('📤 上传PDF到blob存储...')
      const pdfResult = await hubBlob().put('origin.pdf', pdfBuffer, {
        contentType: 'application/pdf'
      })
      console.log('📤 PDF上传结果:', pdfResult)
      
      results.push({
        file: 'origin.pdf',
        size: pdfBuffer.length,
        status: 'uploaded'
      })
      console.log(`✅ PDF文件上传成功`)
    } else {
      console.error(`❌ PDF文件不存在: ${pdfPath}`)
      results.push({
        file: 'origin.pdf',
        status: 'file_not_found',
        path: pdfPath
      })
    }
    
    // 上传JSON文件
    const jsonPath = path.resolve('./assets/data/middle.json')
    console.log(`🔍 检查JSON文件: ${jsonPath}`)
    
    if (fs.existsSync(jsonPath)) {
      console.log('📄 读取JSON文件...')
      const jsonBuffer = fs.readFileSync(jsonPath)
      console.log(`📄 JSON文件大小: ${jsonBuffer.length} bytes`)
      
      console.log('📤 上传JSON到blob存储...')
      const jsonResult = await hubBlob().put('middle.json', jsonBuffer, {
        contentType: 'application/json'
      })
      console.log('📤 JSON上传结果:', jsonResult)
      
      results.push({
        file: 'middle.json',
        size: jsonBuffer.length,
        status: 'uploaded'
      })
      console.log(`✅ JSON文件上传成功`)
    } else {
      console.error(`❌ JSON文件不存在: ${jsonPath}`)
      results.push({
        file: 'middle.json',
        status: 'file_not_found',
        path: jsonPath
      })
    }
    
    const uploadedCount = results.filter(r => r.status === 'uploaded').length
    
    return {
      success: uploadedCount > 0,
      message: `Successfully uploaded ${uploadedCount} files to blob storage`,
      files: results
    }
    
  } catch (error: any) {
    console.error('❌ 上传文件失败:', error)
    console.error('❌ 错误详情:', error.stack)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to upload files: ${error.message}`
    })
  }
}) 