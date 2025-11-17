/**
 * Buildings API 라우트
 * 건물 정보 관리
 */

const express = require('express');
const router = express.Router();
const { query, get, all } = require('../config/database');

/**
 * GET /api/buildings
 * 모든 건물 목록 조회
 */
router.get('/', async (req, res, next) => {
  try {
    const buildings = await all(`
      SELECT 
        b.*,
        COUNT(DISTINCT u.id) as unit_count,
        COUNT(DISTINCT m.id) as mortgage_count
      FROM buildings b
      LEFT JOIN units u ON b.id = u.building_id
      LEFT JOIN mortgages m ON u.id = m.unit_id
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `);
    
    res.json({ success: true, data: buildings });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/buildings/:id
 * 특정 건물 상세 조회
 */
router.get('/:id', async (req, res, next) => {
  try {
    const building = await get('SELECT * FROM buildings WHERE id = $1', [req.params.id]);
    
    if (!building) {
      return res.status(404).json({ success: false, error: '건물을 찾을 수 없습니다.' });
    }
    
    // 세대 정보 조회
    const units = await all('SELECT * FROM units WHERE building_id = $1', [req.params.id]);
    building.units = units;
    
    // 통계 정보
    const stats = await get(`
      SELECT 
        COUNT(DISTINCT u.id) as total_units,
        COUNT(DISTINCT m.id) as total_mortgages,
        SUM(m.max_amount) as total_mortgage_amount
      FROM units u
      LEFT JOIN mortgages m ON u.id = m.unit_id
      WHERE u.building_id = $1
    `, [req.params.id]);
    
    building.stats = stats;
    
    res.json({ success: true, data: building });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/buildings
 * 새 건물 생성
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, address, city, district } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: '건물 이름은 필수입니다.' });
    }
    
    const result = await query(
      `INSERT INTO buildings (name, address, city, district) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, address || null, city || null, district || null]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/buildings/:id
 * 건물 정보 수정
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { name, address, city, district } = req.body;
    
    const building = await get('SELECT * FROM buildings WHERE id = $1', [req.params.id]);
    if (!building) {
      return res.status(404).json({ success: false, error: '건물을 찾을 수 없습니다.' });
    }
    
    const result = await query(
      `UPDATE buildings 
       SET name = $1, address = $2, city = $3, district = $4
       WHERE id = $5
       RETURNING *`,
      [
        name || building.name,
        address !== undefined ? address : building.address,
        city !== undefined ? city : building.city,
        district !== undefined ? district : building.district,
        req.params.id
      ]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/buildings/:id
 * 건물 삭제
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const building = await get('SELECT * FROM buildings WHERE id = $1', [req.params.id]);
    if (!building) {
      return res.status(404).json({ success: false, error: '건물을 찾을 수 없습니다.' });
    }
    
    // 관련 units 먼저 삭제 (CASCADE가 설정되어 있어도 명시적으로 삭제)
    await query('DELETE FROM units WHERE building_id = $1', [req.params.id]);
    
    // 건물 삭제
    await query('DELETE FROM buildings WHERE id = $1', [req.params.id]);
    
    res.json({ success: true, message: '건물이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

