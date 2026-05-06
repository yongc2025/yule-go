# 本地开发环境搭建指南（完整版）

> Windows 环境下，从零开始搭建 Go 后端 + 微信小程序本地开发环境。
> 按顺序执行，每步确认成功后再进行下一步。

---

## 目录

1. [环境要求](#一环境要求)
2. [Go 环境配置](#二go-环境配置)
3. [MySQL 配置](#三mysql-配置)
4. [创建项目数据库](#四创建项目数据库)
5. [后端配置与启动](#五后端配置与启动)
6. [小程序编译与运行](#六小程序编译与运行)
7. [验证测试](#七验证测试)
8. [踩坑记录](#八踩坑记录)

---

## 一、环境要求

| 工具 | 最低版本 | 用途 |
|:---|:---|:---|
| Go | 1.25+ | 后端语言运行时 |
| MySQL | 8.0+ | 数据库 |
| Node.js | 18+ | 小程序前端构建 |
| 微信开发者工具 | 最新稳定版 | 小程序模拟器调试 |
| cpolar（可选）| 任意 | 真机调试时内网穿透 |

---

## 二、Go 环境配置

### 2.1 确认 Go 版本

```cmd
go version
```

**要求 1.25+**，如果版本过低（如 1.21.x），需要升级：
- 国内镜像下载：https://golang.google.cn/dl/
- 或阿里镜像：https://mirrors.aliyun.com/golang/

### 2.2 解决 PATH 冲突（多版本共存时）

如果安装了新版但 `go version` 仍显示旧版：

1. `Win + R` → 输入 `sysdm.cpl` → 回车
2. 「高级」→「环境变量」
3. 在**用户变量**的 `Path` 中，删除旧的 Go 路径（如 `%USERPROFILE%\go\bin`）
4. 确认**系统变量**的 `Path` 中有新路径（如 `E:\app\Go\bin`）
5. **重新打开终端**使生效

> `GOPATH = %USERPROFILE%\go` 是模块缓存目录，**不需要改**。只改 PATH 中的可执行文件路径。

### 2.3 设置国内 Go 代理

**必须执行**，否则依赖下载会超时：

```cmd
go env -w GOPROXY=https://goproxy.cn,direct
```

> 此命令只需执行一次，会写入 Go 全局配置。

---

## 三、MySQL 配置

### 3.1 确认 MySQL 在运行

```cmd
net start | findstr mysql
```

如果没有运行，启动它：
```cmd
net start mysql
```
（服务名可能是 `mysql`、`mysql80` 或 `MySQL80`，不确定就去「服务」里找）

### 3.2 登录 MySQL

```cmd
mysql -u root -p
```

输入你的 root 密码。

> 如果 `mysql` 命令找不到，用完整路径：
> ```cmd
> "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
> ```
> 或者把 `C:\Program Files\MySQL\MySQL Server 8.0\bin` 加到系统 PATH。

### 3.3 忘记密码？重置 root 密码

1. **停止 MySQL 服务：**
   ```cmd
   net stop mysql
   ```

2. **以跳过权限验证模式启动（管理员终端）：**
   ```cmd
   mysqld --skip-grant-tables --shared-memory
   ```
   窗口会卡住，**不要关闭**。

3. **新开一个终端，无密码登录：**
   ```cmd
   mysql -u root
   ```

4. **重置密码：**
   ```sql
   FLUSH PRIVILEGES;
   ALTER USER 'root'@'localhost' IDENTIFIED BY '你的新密码';
   FLUSH PRIVILEGES;
   EXIT;
   ```

5. **关闭跳过验证的终端**，正常启动 MySQL：
   ```cmd
   net start mysql
   ```

---

## 四、创建项目数据库

登录 MySQL 后执行：

```sql
-- 创建项目数据库
CREATE DATABASE yule_go DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 切换到项目数据库
USE yule_go;

-- 执行建表脚本（在 MySQL 命令行中）
SOURCE C:/你的项目路径/yule-go/migrations/001_init.sql;
```

> **注意：** `SOURCE` 命令中的路径用正斜杠 `/`，不是反斜杠 `\`。
> 也可以直接复制 `001_init.sql` 的内容粘贴到 MySQL 命令行执行。

执行完成后验证：
```sql
SHOW TABLES;
```

应看到 9 张表：`users`、`routes`、`schedules`、`orders`、`rental_items`、`order_rentals`、`recharges`、`referrals`、`admins`。

```sql
EXIT;
```

---

## 五、后端配置与启动

### 5.1 修改配置文件

编辑 `src/server/config/config.yaml`：

```yaml
database:
  host: 127.0.0.1
  port: 3306
  user: root
  password: "你的真实密码"    # ← 改成你的 MySQL 密码
  dbname: yule_go            # ← 改成刚创建的数据库名
  charset: utf8mb4
```

### 5.2 启动后端服务

```cmd
cd src\server
go run .
```

看到以下输出表示成功：
```
✅ 配置加载完成: server=:8080, db=127.0.0.1:3306/yule_go
🚀 yule-go server starting on :8080
```

### 5.3 验证后端

浏览器打开：http://localhost:8080/health

应返回：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "status": "running",
    "service": "yule-go"
  }
}
```

> **后端保持运行**，不要关闭这个终端。开一个新终端做后续操作。

---

## 六、小程序编译与运行

小程序使用 uni-app 框架，需要先编译成微信小程序格式。

### 6.1 安装前端依赖

**新开一个终端**（后端终端保持运行）：

```cmd
cd src\miniprogram
npm install
```

### 6.2 编译微信小程序

```cmd
npm run dev:mp-weixin
```

编译成功后，会在 `dist\dev\mp-weixin\` 目录下生成小程序文件。

> **此终端保持运行**，它会监听文件变化自动重新编译。

### 6.3 在微信开发者工具中打开

1. 打开**微信开发者工具**
2. 点击「导入项目」或「打开项目」
3. **项目目录选择：**
   ```
   src\miniprogram\dist\dev\mp-weixin\
   ```
   > ⚠️ 不是 `src\miniprogram\`，是编译后的 `dist\dev\mp-weixin\` 目录！
4. **AppID 填写：** `wx7b7b5fb5bff2d3da`
5. 点击「确定」导入

### 6.4 关闭域名校验（开发阶段必须）

1. 微信开发者工具 → 右上角「详情」
2. 「本地设置」
3. 勾选 ✅ **「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」**

> 不勾选此项，小程序所有网络请求都会被拦截。

### 6.5 验证小程序

在模拟器中：
- 首页应能正常显示
- 底部 TabBar 应能正常切换
- 数据应从后端 API 加载（团期列表等）

---

## 七、验证测试

### 7.1 后端 API 测试

浏览器依次访问：

| 接口 | URL | 预期结果 |
|:---|:---|:---|
| 健康检查 | http://localhost:8080/health | `{"code":0,"message":"ok"}` |
| 团期列表 | http://localhost:8080/api/v1/schedules | 返回团期数据 |
| 线路列表 | http://localhost:8080/api/v1/routes | 返回线路数据 |

### 7.2 小程序功能测试

在微信开发者工具模拟器中：

1. **首页** — 应显示团期列表
2. **预约** — 选择团期 → 填写信息 → 提交
3. **我的** — 查看个人信息、订单列表
4. **会员** — 查看会员等级、充值记录
5. **邀请** — 查看邀请码、邀请记录

### 7.3 真机调试（可选）

如需在真机上测试：

1. 启动 cpolar：
   ```cmd
   cpolar http 8080
   ```
2. 记录分配的公网地址（如 `https://xxxx.cpolar.top`）
3. 修改 `src/miniprogram/src/api/index.js`：
   ```js
   const DEV_API_BASE = 'https://xxxx.cpolar.top/api/v1'
   ```
4. 重新编译小程序（`npm run dev:mp-weixin` 会自动重编译）
5. 微信开发者工具 → 「预览」→ 手机扫码

---

## 八、踩坑记录

### 坑点 1：Go 版本过低 → toolchain 下载超时

**现象：**
```
go: download go1.25.0: golang.org/toolchain@... Get "https://proxy.golang.org/...": connectex: A connection attempt failed
```

**原因：** `go.mod` 声明 `go 1.25.0`，本地版本低于此，Go 尝试自动下载 toolchain 但 `proxy.golang.org` 被墙。

**解决：** 升级 Go 到 1.25+，或设 `set GOTOOLCHAIN=local`。

### 坑点 2：多个 Go 版本 PATH 冲突

**现象：** 安装新版后 `go version` 仍显示旧版。

**原因：** 用户 PATH 中旧 Go 路径排在系统 PATH 中新路径前面。

**解决：** 删除用户 PATH 中的旧 Go 路径，只保留系统 PATH 中的新路径。重开终端。

### 坑点 3：依赖下载超时

**现象：**
```
Get "https://proxy.golang.org/github.com/gin-gonic/gin/@v/v1.12.0.zip": connectex: A connection attempt failed
```

**解决：**
```cmd
go env -w GOPROXY=https://goproxy.cn,direct
```

### 坑点 4：MySQL 密码不匹配

**现象：**
```
Error 1045 (28000): Access denied for user 'root'@'localhost' (using password: YES)
```

**解决：** 修改 `src/server/config/config.yaml` 中的 `password` 字段，与 MySQL 实际密码一致。

### 坑点 5：忘记 MySQL 密码

**解决：** 参见 [3.3 忘记密码？重置 root 密码](#33-忘记密码重置-root-密码)。

### 坑点 6：`mysql` 命令找不到

**现象：** `'mysql' 不是内部或外部命令`

**解决：** 用完整路径执行，或将 MySQL 的 `bin` 目录加到系统 PATH。

### 坑点 7：小程序报 `app.json is not found`

**现象：**
```
[ app.json 文件内容错误] app.json: app.json is not found in the project root directory
```

**原因：** 直接打开了 uni-app 源码目录，而不是编译后的目录。

**解决：** 微信开发者工具中打开的目录必须是 `src\miniprogram\dist\dev\mp-weixin\`。

### 坑点 8：小程序请求被拦截

**现象：** 网络请求全部失败。

**解决：** 微信开发者工具 → 详情 → 本地设置 → 勾选「不校验合法域名」。

### 坑点 9：数据库不存在

**现象：** `Unknown database 'yule_go'`

**解决：** 先在 MySQL 中执行 `CREATE DATABASE yule_go;`，再执行建表脚本。

### 坑点 10：管理后台登录密码错误

**现象：** 用 `admin` / `admin123` 登录管理后台，提示"用户名或密码错误"。

**原因：** `001_init.sql` 中管理员密码哈希是占位符，不是有效的 argon2id 哈希。占位符格式不完整（盐被截断），导致任何密码都无法通过验证。

**解决：** 在 MySQL 中执行以下 SQL 更新为正确的哈希（密码仍为 `admin123`）：

```sql
USE yule_go;
UPDATE admins SET password_hash = '$argon2id$v=19$m=65536,t=3,p=2$AAAAAAAAAAAAAAAAAAAAAA$DOnSQ1mnoOT0UKFvU/tdiQnZuMIrE+AXDT4nrUKynO4' WHERE username = 'admin';
```

> ⚠️ 注意盐部分是 **22 个 A**（`AAAAAAAAAAAAAAAAAAAAAA`），不是 16 个。16 个零字节的 base64 无填充编码为 22 个字符。

登录后系统会提示修改密码。

---

## 九、快速启动清单（速查版）

```cmd
# ===== 第一步：Go 环境 =====
go version                                    # 确认版本 ≥ 1.25
go env -w GOPROXY=https://goproxy.cn,direct   # 设置国内代理

# ===== 第二步：MySQL =====
mysql -u root -p                              # 登录 MySQL
```
```sql
CREATE DATABASE yule_go DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE yule_go;
SOURCE C:/你的路径/yule-go/migrations/001_init.sql;
EXIT;
```
```cmd
# ===== 第三步：启动后端 =====
cd src\server
# 编辑 config.yaml：password 和 dbname
go run .
# 看到 "🚀 yule-go server starting on :8080" 表示成功
# 浏览器访问 http://localhost:8080/health 验证

# ===== 第四步：编译小程序（新开终端）=====
cd src\miniprogram
npm install
npm run dev:mp-weixin

# ===== 第五步：微信开发者工具 =====
# 导入项目：src\miniprogram\dist\dev\mp-weixin\
# AppID：wx7b7b5fb5bff2d3da
# 勾选「不校验合法域名」
```

---

## 十、目录结构参考

```
yule-go/
├── docs/
│   └── local-setup.md    ← 你正在看的这个文件
├── migrations/
│   └── 001_init.sql      ← 数据库建表脚本
├── src/
│   ├── server/            ← Go 后端
│   │   ├── main.go        ← 入口
│   │   ├── config/
│   │   │   ├── config.go
│   │   │   └── config.yaml  ← 后端配置文件
│   │   ├── db/            ← 数据库初始化
│   │   ├── handler/       ← 请求处理
│   │   ├── middleware/     ← 中间件（JWT、CORS）
│   │   ├── model/         ← 数据模型
│   │   ├── repository/    ← 数据访问层
│   │   ├── router/        ← 路由注册
│   │   ├── scheduler/     ← 定时任务
│   │   └── service/       ← 业务逻辑
│   ├── miniprogram/       ← 小程序源码（uni-app）
│   │   ├── src/
│   │   │   ├── api/       ← API 请求封装
│   │   │   ├── pages/     ← 页面
│   │   │   └── components/← 组件
│   │   └── dist/dev/mp-weixin/  ← 编译产物（微信开发者工具打开这个）
│   └── web/               ← 管理后台（Vue3）
└── Makefile
```
