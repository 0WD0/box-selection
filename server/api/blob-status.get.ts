export default defineEventHandler(async (event) => {
  try {
    console.log('🔍 检查blob存储状态')
    
    const files = ['origin.pdf', 'middle.json']
    const status = []
    
    for (const fileName of files) {
      try {
        const blob = await hubBlob().head(fileName)
        if (blob) {
          status.push({
            file: fileName,
            exists: true,
            size: blob.size,
            contentType: blob.contentType,
            uploadedAt: blob.uploadedAt
          })
        } else {
          status.push({
            file: fileName,
            exists: false
          })
        }
      } catch (error) {
        status.push({
          file: fileName,
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    const allFilesExist = status.every(s => s.exists)
    
    return {
      success: true,
      allFilesReady: allFilesExist,
      files: status,
      message: allFilesExist 
        ? 'All files are available in blob storage' 
        : 'Some files are missing from blob storage'
    }
    
  } catch (error: any) {
    console.error('❌ 检查blob存储状态失败:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to check blob status: ${error.message}`
    })
  }
}) 