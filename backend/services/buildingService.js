/**
 * 건물 데이터 서비스
 * DB 저장 및 조회 로직
 */

const { query } = require('../config/database');
const { countUniqueHouseholds } = require('./fileProcessor');

/**
 * 건물 생성 또는 조회
 */
async function findOrCreateBuilding(buildingData) {
  let building = await query(
    'SELECT * FROM buildings WHERE name = $1',
    [buildingData.name]
  );

  if (building.rows.length > 0) {
    console.log(`   ✅ 기존 건물 사용 (ID: ${building.rows[0].id})`);
    return building.rows[0].id;
  }

  const result = await query(
    `INSERT INTO buildings (name, address, city, district) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [
      buildingData.name,
      buildingData.address,
      buildingData.city,
      buildingData.district
    ]
  );
  
  console.log(`   ✅ 새 건물 생성 (ID: ${result.rows[0].id})`);
  return result.rows[0].id;
}

/**
 * 기존 세대 데이터 삭제
 */
async function deleteExistingUnits(buildingId) {
  const deletedCount = await query('DELETE FROM units WHERE building_id = $1', [buildingId]);
  console.log(`   🗑️ 기존 세대 데이터 삭제 완료 (삭제된 행: ${deletedCount.rowCount}개)`);
  return deletedCount.rowCount;
}

/**
 * 세대 데이터 배치 삽입
 */
async function insertUnits(buildingId, units) {
  const BATCH_SIZE = 100;
  let inserted = 0;
  let failed = 0;

  console.log(`   📊 저장할 세대 데이터: ${units.length}개`);

  for (let i = 0; i < units.length; i += BATCH_SIZE) {
    const batch = units.slice(i, i + BATCH_SIZE);
    
    try {
      const values = [];
      const params = [];
      let paramIndex = 1;
      
      batch.forEach((unit) => {
        const valuePlaceholders = [];
        for (let j = 0; j < 22; j++) {
          valuePlaceholders.push(`$${paramIndex++}`);
        }
        values.push(`(${valuePlaceholders.join(', ')})`);
        
        params.push(
          buildingId,
          unit.dong,
          unit.ho,
          unit.area_m2,
          unit.소유자명,
          unit.생년월일,
          unit.소유자_주소,
          unit.아파트_소재지,
          unit.건물명,
          unit.거주형태,
          unit.등기목적_분류,
          unit.근저당금액,
          unit.보유기간,
          unit.압류가압류,
          unit.등기원인_년월일,
          unit.전용면적_제곱미터,
          unit.유효근저당총액,
          unit.압류가압류유무,
          unit.주민번호,
          unit.연령대,
          unit.공유자수 || 1,
          unit.세대유형 || (unit.공유자수 > 1 ? '공유세대' : '단독세대')
        );
      });
      
      const insertQuery = `
        INSERT INTO units (
          building_id, dong, ho, area_m2,
          소유자명, 생년월일, 소유자_주소, 아파트_소재지, 건물명,
          거주형태, 등기목적_분류, 근저당금액, 보유기간, 압류가압류,
          등기원인_년월일, 전용면적_제곱미터, 유효근저당총액, 압류가압류유무,
          주민번호, 연령대, 공유자수, 세대유형
        ) VALUES ${values.join(', ')}
      `;
      
      await query(insertQuery, params);
      inserted += batch.length;
      
      if ((i + BATCH_SIZE) % 500 === 0 || i + BATCH_SIZE >= units.length) {
        console.log(`   📊 진행 중: ${Math.min(i + BATCH_SIZE, units.length)}/${units.length}개 저장됨`);
      }
    } catch (batchError) {
      // 배치 실패 시 개별 삽입으로 폴백
      console.warn(`   ⚠️ 배치 삽입 실패, 개별 삽입으로 시도...`);
      const result = await insertUnitsIndividually(buildingId, batch);
      inserted += result.inserted;
      failed += result.failed;
    }
  }

  console.log(`   ✅ ${inserted}개 세대 데이터 저장 완료`);
  if (failed > 0) {
    console.error(`   ⚠️ ${failed}개 세대 데이터 저장 실패`);
  }

  return { inserted, failed };
}

/**
 * 개별 세대 삽입 (배치 실패 시 폴백)
 */
async function insertUnitsIndividually(buildingId, units) {
  let inserted = 0;
  let failed = 0;

  for (const unit of units) {
    try {
      await query(
        `INSERT INTO units (
          building_id, dong, ho, area_m2,
          소유자명, 생년월일, 소유자_주소, 아파트_소재지, 건물명,
          거주형태, 등기목적_분류, 근저당금액, 보유기간, 압류가압류,
          등기원인_년월일, 전용면적_제곱미터, 유효근저당총액, 압류가압류유무,
          주민번호, 연령대, 공유자수, 세대유형
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
        )`,
        [
          buildingId,
          unit.dong,
          unit.ho,
          unit.area_m2,
          unit.소유자명,
          unit.생년월일,
          unit.소유자_주소,
          unit.아파트_소재지,
          unit.건물명,
          unit.거주형태,
          unit.등기목적_분류,
          unit.근저당금액,
          unit.보유기간,
          unit.압류가압류,
          unit.등기원인_년월일,
          unit.전용면적_제곱미터,
          unit.유효근저당총액,
          unit.압류가압류유무,
          unit.주민번호,
          unit.연령대,
          unit.공유자수 || 1,
          unit.세대유형 || (unit.공유자수 > 1 ? '공유세대' : '단독세대')
        ]
      );
      inserted++;
    } catch (unitError) {
      failed++;
      if (failed <= 5) {
        console.error(`   ❌ 세대 데이터 삽입 실패:`, unitError.message);
      }
    }
  }

  return { inserted, failed };
}

/**
 * DB에 데이터 저장 (메인 함수)
 */
async function saveToDatabase(dbData) {
  // 건물 생성 또는 찾기
  const buildingId = await findOrCreateBuilding(dbData.building);

  // 기존 데이터 삭제
  await deleteExistingUnits(buildingId);

  // 세대 데이터 삽입
  const { inserted, failed } = await insertUnits(buildingId, dbData.units);

  // 실제 세대 수 계산
  const actualHouseholdCount = countUniqueHouseholds(dbData.units);
  console.log(`   📊 실제 세대 그룹 수: ${actualHouseholdCount}개 (저장된 행: ${inserted}개)`);

  return {
    buildingId,
    buildingName: dbData.building.name,
    inserted,
    failed,
    actualHouseholdCount,
    totalRecords: dbData.units.length
  };
}

module.exports = {
  findOrCreateBuilding,
  deleteExistingUnits,
  insertUnits,
  saveToDatabase
};
