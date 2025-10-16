const fs = require('fs');
const path = require('path');

// public/data 폴더의 CSV 파일 목록을 가져와서 file-list.json 업데이트
function updateFileList() {
  const dataDir = path.join(__dirname, '../public/data');
  const fileListPath = path.join(dataDir, 'file-list.json');
  
  try {
    // data 폴더의 모든 CSV 파일 찾기
    const files = fs.readdirSync(dataDir)
      .filter(file => file.endsWith('.csv'))
      .sort();
    
    // file-list.json 업데이트
    const fileList = {
      files: files,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(fileListPath, JSON.stringify(fileList, null, 2));
    console.log(`파일 목록 업데이트 완료: ${files.length}개 파일`);
    console.log('파일 목록:', files);
    
  } catch (error) {
    console.error('파일 목록 업데이트 실패:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  updateFileList();
}

module.exports = updateFileList;
