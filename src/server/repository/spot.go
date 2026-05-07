package repository

import (
	"math"

	"yule-go/db"
	"yule-go/model"

	"gorm.io/gorm"
)

type spotRepository struct {
	db *gorm.DB
}

// SpotRepository 钓场数据访问接口
type SpotRepository interface {
	Create(spot *model.FishingSpot) error
	Update(spot *model.FishingSpot) error
	Delete(id uint64) error
	FindByID(id uint64) (*model.FishingSpot, error)
	List(query *model.SpotQueryRequest) ([]model.FishingSpot, int64, error)
	Nearby(lat, lng, radius float64, page, pageSize int) ([]model.FishingSpot, []float64, int64, error)
	ListRoutesBySpotID(spotID uint64) ([]model.Route, error)
}

// NewSpotRepository 创建钓场 Repository
func NewSpotRepository() SpotRepository {
	return &spotRepository{db: db.DB}
}

// Create 创建钓场
func (r *spotRepository) Create(spot *model.FishingSpot) error {
	return r.db.Create(spot).Error
}

// Update 更新钓场
func (r *spotRepository) Update(spot *model.FishingSpot) error {
	return r.db.Save(spot).Error
}

// Delete 删除钓场（软删除或硬删除，这里用硬删除）
func (r *spotRepository) Delete(id uint64) error {
	return r.db.Delete(&model.FishingSpot{}, id).Error
}

// FindByID 根据 ID 查询钓场
func (r *spotRepository) FindByID(id uint64) (*model.FishingSpot, error) {
	var spot model.FishingSpot
	err := r.db.First(&spot, id).Error
	if err != nil {
		return nil, err
	}
	return &spot, nil
}

// List 分页查询钓场列表
func (r *spotRepository) List(query *model.SpotQueryRequest) ([]model.FishingSpot, int64, error) {
	var spots []model.FishingSpot
	var total int64

	tx := r.db.Model(&model.FishingSpot{})

	if query.Status != nil {
		tx = tx.Where("status = ?", *query.Status)
	}
	if query.Keyword != "" {
		like := "%" + query.Keyword + "%"
		tx = tx.Where("name LIKE ? OR address LIKE ?", like, like)
	}

	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (query.Page - 1) * query.PageSize
	if err := tx.Order("created_at DESC").Offset(offset).Limit(query.PageSize).Find(&spots).Error; err != nil {
		return nil, 0, err
	}

	return spots, total, nil
}

// nearbyResult 用于扫描带距离的查询结果
type nearbyResult struct {
	model.FishingSpot
	Distance float64 `gorm:"column:distance"`
}

// Nearby 查询附近钓场（Haversine 公式计算距离，按距离排序）
func (r *spotRepository) Nearby(lat, lng, radius float64, page, pageSize int) ([]model.FishingSpot, []float64, int64, error) {
	var total int64

	// Haversine 距离公式（单位：公里）
	haversine := `
		(6371 * acos(
			COS(RADIANS(?)) * COS(RADIANS(latitude)) *
			COS(RADIANS(longitude) - RADIANS(?)) +
			SIN(RADIANS(?)) * SIN(RADIANS(latitude))
		))
	`

	base := r.db.Model(&model.FishingSpot{}).
		Where("status = ? AND latitude IS NOT NULL AND longitude IS NOT NULL", model.SpotStatusActive)

	if err := base.Where(haversine+" <= ?", lat, lng, lat, radius).Count(&total).Error; err != nil {
		return nil, nil, 0, err
	}

	var results []nearbyResult
	offset := (page - 1) * pageSize
	err := r.db.Model(&model.FishingSpot{}).
		Select("fishing_spots.*, "+haversine+" AS distance", lat, lng, lat).
		Where("status = ? AND latitude IS NOT NULL AND longitude IS NOT NULL", model.SpotStatusActive).
		Where(haversine+" <= ?", lat, lng, lat, radius).
		Order("distance ASC").
		Offset(offset).Limit(pageSize).
		Find(&results).Error
	if err != nil {
		return nil, nil, 0, err
	}

	spots := make([]model.FishingSpot, len(results))
	distances := make([]float64, len(results))
	for i, r := range results {
		spots[i] = r.FishingSpot
		distances[i] = math.Round(r.Distance*100) / 100
	}

	return spots, distances, total, nil
}

// ListRoutesBySpotID 查询钓场关联的线路
func (r *spotRepository) ListRoutesBySpotID(spotID uint64) ([]model.Route, error) {
	var routes []model.Route
	err := r.db.Where("fishing_spot_id = ? AND status = ?", spotID, 1).
		Order("created_at DESC").
		Find(&routes).Error
	return routes, err
}
