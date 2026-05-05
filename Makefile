.PHONY: help lint build run test clean

# 默认目标
help: ## 显示帮助
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ========== 后端 ==========
build: ## 编译 Go 后端
	cd src/server && go build -o ../../bin/yule-server .

run: ## 运行后端服务
	cd src/server && go run .

test: ## 运行测试
	cd src/server && go test ./... -v

lint: ## 代码检查
	@echo "=== Go Lint ==="
	cd src/server && golangci-lint run ./...
	@echo "=== Markdown Lint ==="
	markdownlint '**/*.md' --config .markdownlint.json || true

clean: ## 清理构建产物
	rm -rf bin/

# ========== 数据库 ==========
migrate: ## 运行数据库迁移
	@echo "Running migrations..."
	mysql -u root -p yule < migrations/001_create_tables.sql

# ========== Docker ==========
docker-build: ## 构建 Docker 镜像
	docker-compose -f docker/docker-compose.yml build

docker-up: ## 启动 Docker 服务
	docker-compose -f docker/docker-compose.yml up -d

docker-down: ## 停止 Docker 服务
	docker-compose -f docker/docker-compose.yml down

# ========== 前端 ==========
web-install: ## 安装管理后台依赖
	cd src/web && npm install

web-dev: ## 启动管理后台开发服务器
	cd src/web && npm run dev

web-build: ## 构建管理后台
	cd src/web && npm run build

mp-dev: ## 启动小程序开发
	cd src/miniprogram && npm run dev:mp-weixin
