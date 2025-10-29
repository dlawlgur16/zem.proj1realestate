#!/usr/bin/env node

/**
 * 전처리된 데이터를 public 폴더로 복사하는 스크립트
 */

const fs = require('fs-extra');
const path = require('path');

const processedDataDir = path.join(__dirname, '../public/processed-data');

async function copyProcessedData() {
  try {
    console.log('📁 프로젝트 목록 생성 시작');
    console.log('📂 데이터 폴더:', processedDataDir);
    
    // 디렉토리 생성
    await fs.ensureDir(processedDataDir);
    
    // 디렉토리가 존재하는지 확인
    if (!await fs.pathExists(processedDataDir)) {
      console.log('⚠️ 데이터 디렉토리가 존재하지 않습니다:', processedDataDir);
      return;
    }
    
    // 파일 목록 가져오기
    const files = await fs.readdir(processedDataDir);
    const csvFiles = files.filter(file => file.endsWith('.csv'));
    
    console.log(`📊 CSV 파일 ${csvFiles.length}개 발견`);
    
    if (csvFiles.length === 0) {
      console.log('⚠️ 처리할 CSV 파일이 없습니다.');
      return;
    }
    
    // 프로젝트 목록 JSON 생성
    const projectList = [];
    
    for (let i = 0; i < csvFiles.length; i++) {
      const file = csvFiles[i];
      const csvPath = path.join(processedDataDir, file);
      
      // CSV 파일에서 첫 번째 행 읽어서 도로명주소 추출
      let address = '자동 전처리 시스템';
      try {
        const csvContent = await fs.readFile(csvPath, 'utf8');
        const lines = csvContent.split('\n');
        if (lines.length > 1) {
          const headers = lines[0].split(',');
          const dataRow = lines[1].split(',');
          const addressIndex = headers.findIndex(h => h.includes('도로명주소'));
          if (addressIndex !== -1 && dataRow[addressIndex]) {
            address = dataRow[addressIndex].replace(/"/g, '').trim();
          }
        }
      } catch (error) {
        console.warn(`⚠️ 주소 추출 실패: ${file}`, error.message);
      }
      
      // 파일명에서 날짜 부분 제거
      const cleanName = file.replace(/_전처리_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z/, '').replace('.csv', '');
      
      projectList.push({
        id: `processed-${i}`,
        name: cleanName,
        address: address,
        type: 'processed',
        // 빌드 시 PUBLIC_URL 기준으로 안전하게 접근하도록 상대 경로 저장
        dataFile: `processed-data/${file}`,
        image: 'image/img_chart-02.jpg'
      });
    }
    
    const projectListPath = path.join(__dirname, '../public/processed-projects.json');
    await fs.writeJson(projectListPath, projectList, { spaces: 2 });
    
    console.log('📋 프로젝트 목록 생성:', projectListPath);
    console.log('🎉 전처리된 데이터 복사 완료!');
    
  } catch (error) {
    console.error('❌ 데이터 복사 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  copyProcessedData();
}

module.exports = { copyProcessedData };
