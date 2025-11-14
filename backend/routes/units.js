/**
 * Units API 라우트
 * 세대 정보 관리
 */

const express = require('express');
const router = express.Router();
const { query, get, all } = require('../config/database');

/**
 * GET /api/units/building/:buildingId
 * 특정 건물의 모든 세대 조회
 */
router.get('/building/:buildingId', async (req, res, next) => {
  try {
    const units = await all(
      'SELECT * FROM units WHERE building_id = $1 ORDER BY dong, ho',
      [req.params.buildingId]
    );
    
    res.json({ success: true, data: units });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/units/:id
 * 특정 세대 상세 조회
 */
router.get('/:id', async (req, res, next) => {
  try {
    const unit = await get('SELECT * FROM units WHERE id = $1', [req.params.id]);
    
    if (!unit) {
      return res.status(404).json({ success: false, error: '세대를 찾을 수 없습니다.' });
    }
    
    // 근저당 정보 조회
    const mortgages = await all(
      'SELECT * FROM mortgages WHERE unit_id = $1 ORDER BY registration_date DESC',
      [req.params.id]
    );
    unit.mortgages = mortgages;
    
    res.json({ success: true, data: unit });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/units
 * 새 세대 생성
 */
router.post('/', async (req, res, next) => {
  try {
    const { 
      building_id, dong, ho, area_m2,
      소유자명, 생년월일, 소유자_주소, 아파트_소재지, 건물명,
      거주형태, 등기목적_분류, 근저당금액, 보유기간,
      압류가압류, 등기원인_년월일, 전용면적_제곱미터,
      유효근저당총액, 압류가압류유무, 주민번호, 연령대
    } = req.body;
    
    if (!building_id) {
      return res.status(400).json({ success: false, error: '건물 ID는 필수입니다.' });
    }
    
    const result = await query(
      `INSERT INTO units (
        building_id, dong, ho, area_m2,
        소유자명, 생년월일, 소유자_주소, 아파트_소재지, 건물명,
        거주형태, 등기목적_분류, 근저당금액, 보유기간,
        압류가압류, 등기원인_년월일, 전용면적_제곱미터,
        유효근저당총액, 압류가압류유무, 주민번호, 연령대
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) 
      RETURNING *`,
      [
        building_id, dong || null, ho || null, area_m2 || null,
        소유자명 || null, 생년월일 || null, 소유자_주소 || null, 
        아파트_소재지 || null, 건물명 || null,
        거주형태 || null, 등기목적_분류 || null, 근저당금액 || null, 
        보유기간 || null, 압류가압류 || null, 등기원인_년월일 || null,
        전용면적_제곱미터 || null, 유효근저당총액 || null,
        압류가압류유무 || null, 주민번호 || null, 연령대 || null
      ]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/units/batch
 * 세대 일괄 추가
 */
router.post('/batch', async (req, res, next) => {
  try {
    const { building_id, units } = req.body;
    
    if (!building_id || !Array.isArray(units) || units.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'building_id와 units 배열이 필요합니다.' 
      });
    }
    
    const inserted = [];
    for (const unit of units) {
      const result = await query(
        `INSERT INTO units (
          building_id, dong, ho, area_m2,
          소유자명, 생년월일, 소유자_주소, 아파트_소재지, 건물명,
          거주형태, 등기목적_분류, 근저당금액, 보유기간,
          압류가압류, 등기원인_년월일, 전용면적_제곱미터,
          유효근저당총액, 압류가압류유무, 주민번호, 연령대
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        ) 
        RETURNING *`,
        [
          building_id, 
          unit.dong || null, 
          unit.ho || null, 
          unit.area_m2 || unit.전용면적_제곱미터 || null,
          unit.소유자명 || null,
          unit.생년월일 || null,
          unit.소유자_주소 || null,
          unit.아파트_소재지 || null,
          unit.건물명 || null,
          unit.거주형태 || null,
          unit.등기목적_분류 || null,
          unit.근저당금액 || unit.유효근저당총액 || null,
          unit.보유기간 || null,
          unit.압류가압류 || null,
          unit.등기원인_년월일 || null,
          unit.전용면적_제곱미터 || null,
          unit.유효근저당총액 || null,
          unit.압류가압류유무 || null,
          unit.주민번호 || null,
          unit.연령대 || null
        ]
      );
      inserted.push(result.rows[0]);
    }
    
    res.status(201).json({ 
      success: true, 
      message: `${inserted.length}개의 세대가 추가되었습니다.`,
      data: inserted 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

