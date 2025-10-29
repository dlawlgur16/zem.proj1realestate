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
    const projectList = csvFiles.map((file, index) => ({
      id: `processed-${index}`,
      name: file.replace('_전처리_', ' - ').replace('.csv', ''),
      address: '자동 전처리 시스템',
      type: 'processed',
      dataFile: `/processed-data/${file}`,
      image: '/image/img_chart-02.jpg',
      description: `${file.replace('_전처리_', ' - ').replace('.csv', '')} 전처리된 데이터`
    }));
    
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
