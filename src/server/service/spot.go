package service

import (
	"errors"
	"fmt"

	"yule-go/model"
	"yule-go/repository"
)

type spotService struct {
	spotRepo repository.SpotRepository
}

// SpotService 钓场业务逻辑接口
type SpotService interface {
	Create(req *model.CreateSpotRequest) (*model.FishingSpot, error)
	Update(id uint64, req *model.UpdateSpotRequest) (*model.FishingSpot, error)
	Delete(id uint64) error
	GetByID(id uint64) (*model.FishingSpot, error)
	List(query *model.SpotQueryRequest) ([]model.FishingSpot, int64, error)
	Nearby(req *model.NearbySpotRequest) ([]model.SpotResponse, int64, error)
	GetRoutesBySpotID(spotID uint64) (*model.SpotWithRoutes, error)
}

// NewSpotService 创建钓场 Service
func NewSpotService(spotRepo repository.SpotRepository) SpotService {
	return &spotService{spotRepo: spotRepo}
}

// Create 创建钓场
func (s *spotService) Create(req *model.CreateSpotRequest) (*model.FishingSpot, error) {
	spot := &model.FishingSpot{
		Name:          req.Name,
		Address:       req.Address,
		Latitude:      req.Latitude,
		Longitude:     req.Longitude,
		Description:   req.Description,
		FishTypes:     model.StringArray(req.FishTypes),
		Facilities:    model.StringArray(req.Facilities),
		Images:        model.StringArray(req.Images),
		CoverImage:    req.CoverImage,
		ContactName:   req.ContactName,
		ContactPhone:  req.ContactPhone,
		BusinessHours: req.BusinessHours,
		Status:        model.SpotStatusActive,
	}

	if err := s.spotRepo.Create(spot); err != nil {
		return nil, fmt.Errorf("创建钓场失败: %w", err)
	}

	return spot, nil
}

// Update 更新钓场
func (s *spotService) Update(id uint64, req *model.UpdateSpotRequest) (*model.FishingSpot, error) {
	spot, err := s.spotRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("钓场不存在")
	}

	if req.Name != nil {
		spot.Name = *req.Name
	}
	if req.Address != nil {
		spot.Address = *req.Address
	}
	if req.Latitude != nil {
		spot.Latitude = req.Latitude
	}
	if req.Longitude != nil {
		spot.Longitude = req.Longitude
	}
	if req.Description != nil {
		spot.Description = *req.Description
	}
	if req.FishTypes != nil {
		spot.FishTypes = model.StringArray(req.FishTypes)
	}
	if req.Facilities != nil {
		spot.Facilities = model.StringArray(req.Facilities)
	}
	if req.Images != nil {
		spot.Images = model.StringArray(req.Images)
	}
	if req.CoverImage != nil {
		spot.CoverImage = *req.CoverImage
	}
	if req.ContactName != nil {
		spot.ContactName = *req.ContactName
	}
	if req.ContactPhone != nil {
		spot.ContactPhone = *req.ContactPhone
	}
	if req.BusinessHours != nil {
		spot.BusinessHours = *req.BusinessHours
	}
	if req.Status != nil {
		spot.Status = *req.Status
	}

	if err := s.spotRepo.Update(spot); err != nil {
		return nil, fmt.Errorf("更新钓场失败: %w", err)
	}

	return spot, nil
}

// Delete 删除钓场
func (s *spotService) Delete(id uint64) error {
	_, err := s.spotRepo.FindByID(id)
	if err != nil {
		return errors.New("钓场不存在")
	}
	return s.spotRepo.Delete(id)
}

// GetByID 查询钓场详情
func (s *spotService) GetByID(id uint64) (*model.FishingSpot, error) {
	spot, err := s.spotRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("钓场不存在")
	}
	return spot, nil
}

// List 分页查询钓场列表
func (s *spotService) List(query *model.SpotQueryRequest) ([]model.FishingSpot, int64, error) {
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 {
		query.PageSize = 20
	}
	return s.spotRepo.List(query)
}

// Nearby 查询附近钓场
func (s *spotService) Nearby(req *model.NearbySpotRequest) ([]model.SpotResponse, int64, error) {
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 20
	}
	radius := req.Radius
	if radius <= 0 {
		radius = 50 // 默认 50 公里
	}

	spots, distances, total, err := s.spotRepo.Nearby(req.Latitude, req.Longitude, radius, req.Page, req.PageSize)
	if err != nil {
		return nil, 0, fmt.Errorf("查询附近钓场失败: %w", err)
	}

	results := make([]model.SpotResponse, len(spots))
	for i, spot := range spots {
		results[i] = model.SpotResponse{
			FishingSpot: spot,
			Distance:    &distances[i],
		}
	}

	return results, total, nil
}

// GetRoutesBySpotID 查询钓场关联的线路
func (s *spotService) GetRoutesBySpotID(spotID uint64) (*model.SpotWithRoutes, error) {
	spot, err := s.spotRepo.FindByID(spotID)
	if err != nil {
		return nil, errors.New("钓场不存在")
	}

	routes, err := s.spotRepo.ListRoutesBySpotID(spotID)
	if err != nil {
		return nil, fmt.Errorf("查询关联线路失败: %w", err)
	}

	return &model.SpotWithRoutes{
		FishingSpot: *spot,
		Routes:      routes,
	}, nil
}
