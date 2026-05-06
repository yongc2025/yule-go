package service

import (
	"errors"
	"testing"

	"yule-go/model"
)

// mockUserRepository 实现 repository.UserRepository 接口，用于测试
type mockUserRepository struct {
	inviteCodeMap map[string]*model.User // 模拟数据库
	nextID        uint64
}

func newMockUserRepository() *mockUserRepository {
	return &mockUserRepository{
		inviteCodeMap: make(map[string]*model.User),
		nextID:        1,
	}
}

func (m *mockUserRepository) FindByID(id uint64) (*model.User, error) {
	for _, u := range m.inviteCodeMap {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, errors.New("not found")
}

func (m *mockUserRepository) FindByOpenID(openid string) (*model.User, error) {
	for _, u := range m.inviteCodeMap {
		if u.OpenID == openid {
			return u, nil
		}
	}
	return nil, errors.New("not found")
}

func (m *mockUserRepository) FindByInviteCode(inviteCode string) (*model.User, error) {
	if u, ok := m.inviteCodeMap[inviteCode]; ok {
		return u, nil
	}
	return nil, errors.New("not found")
}

func (m *mockUserRepository) Create(user *model.User) error {
	user.ID = m.nextID
	m.nextID++
	m.inviteCodeMap[user.InviteCode] = user
	return nil
}

func (m *mockUserRepository) Update(user *model.User) error {
	m.inviteCodeMap[user.InviteCode] = user
	return nil
}

// insertInviteCode 手动插入一个邀请码（模拟已有数据）
func (m *mockUserRepository) insertInviteCode(code string) {
	m.inviteCodeMap[code] = &model.User{
		ID:         m.nextID,
		InviteCode: code,
	}
	m.nextID++
}

func TestGenerateUniqueInviteCode(t *testing.T) {
	t.Run("无冲突时直接返回", func(t *testing.T) {
		repo := newMockUserRepository()
		code, err := GenerateUniqueInviteCode(repo)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(code) != 6 {
			t.Errorf("expected 6-char code, got %d chars: %s", len(code), code)
		}
	})

	t.Run("返回的邀请码确实唯一", func(t *testing.T) {
		repo := newMockUserRepository()
		seen := make(map[string]bool)
		for i := 0; i < 100; i++ {
			code, err := GenerateUniqueInviteCode(repo)
			if err != nil {
				t.Fatalf("iteration %d: unexpected error: %v", i, err)
			}
			if seen[code] {
				t.Errorf("duplicate code generated: %s", code)
			}
			seen[code] = true
		}
	})
}

func TestGenerateInviteCodeRaw(t *testing.T) {
	t.Run("长度为6", func(t *testing.T) {
		code := generateInviteCodeRaw()
		if len(code) != 6 {
			t.Errorf("expected length 6, got %d", len(code))
		}
	})

	t.Run("只包含合法字符", func(t *testing.T) {
		const validChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
		for i := 0; i < 50; i++ {
			code := generateInviteCodeRaw()
			for _, c := range code {
				found := false
				for _, vc := range validChars {
					if c == vc {
						found = true
						break
					}
				}
				if !found {
					t.Errorf("invalid char %c in code %s", c, code)
				}
			}
		}
	})
}
