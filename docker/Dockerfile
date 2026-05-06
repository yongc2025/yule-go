# ========== 构建阶段 ==========
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git

WORKDIR /build

# 先复制 go.mod/go.sum 利用缓存
COPY src/server/go.mod src/server/go.sum ./
RUN go mod download

# 复制源码并编译
COPY src/server/ .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/yule-server .

# ========== 运行阶段 ==========
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Shanghai

WORKDIR /app
COPY --from=builder /app/yule-server .
COPY src/server/config/config.yaml ./config/config.yaml

EXPOSE 8080

CMD ["./yule-server"]
