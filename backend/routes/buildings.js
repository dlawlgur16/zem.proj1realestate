/**
 * Buildings API 라우트
 * DB에 저장된 건물 목록을 반환
 */

const express = require('express');
const { query } = require('../config/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/buildings
 * 모든 건물 목록 반환 (인증 필요)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT
        id,
        name,
        address,
        city,
        district,
        created_at,
        (SELECT COUNT(*) FROM units WHERE building_id = buildings.id) as unit_count
       FROM buildings
       ORDER BY created_at DESC`
    );

    const buildings = result.rows.map(building => ({
      id: `db-${building.id}`,
      name: building.name,
      address: building.address,
      city: building.city,
      district: building.district,
      unitCount: parseInt(building.unit_count),
      type: 'db',
      createdAt: building.created_at
    }));

    res.json(buildings);
  } catch (error) {
    console.error('❌ 건물 목록 조회 실패:', error);
    res.status(500).json({
      error: '건물 목록을 불러올 수 없습니다.',
      message: error.message
    });
  }
});

/**
 * GET /api/buildings/:id
 * 특정 건물의 상세 정보 및 세대 데이터 반환 (인증 필요)
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const buildingId = req.params.id.replace('db-', '');

    // 건물 정보 조회
    const buildingResult = await query(
      'SELECT * FROM buildings WHERE id = $1',
      [buildingId]
    );

    if (buildingResult.rows.length === 0) {
      return res.status(404).json({ error: '건물을 찾을 수 없습니다.' });
    }

    const building = buildingResult.rows[0];

    // 세대 데이터 조회
    const unitsResult = await query(
      'SELECT * FROM units WHERE building_id = $1',
      [buildingId]
    );

    res.json({
      building: {
        id: `db-${building.id}`,
        name: building.name,
        address: building.address,
        city: building.city,
        district: building.district
      },
      units: unitsResult.rows
    });
  } catch (error) {
    console.error('❌ 건물 상세 정보 조회 실패:', error);
    res.status(500).json({
      error: '건물 정보를 불러올 수 없습니다.',
      message: error.message
    });
  }
});

/**
 * DELETE /api/buildings/:id
 * 건물 삭제 - 관리자만 가능 (세대 데이터도 함께 삭제)
 */
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const buildingId = req.params.id.replace('db-', '');

    // 세대 데이터 먼저 삭제
    await query('DELETE FROM units WHERE building_id = $1', [buildingId]);

    // 건물 삭제
    const result = await query(
      'DELETE FROM buildings WHERE id = $1 RETURNING *',
      [buildingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '건물을 찾을 수 없습니다.' });
    }

    res.json({
      success: true,
      message: '건물이 성공적으로 삭제되었습니다.',
      deleted: {
        id: `db-${result.rows[0].id}`,
        name: result.rows[0].name
      }
    });
  } catch (error) {
    console.error('❌ 건물 삭제 실패:', error);
    res.status(500).json({
      error: '건물을 삭제할 수 없습니다.',
      message: error.message
    });
  }
});

module.exports = router;
