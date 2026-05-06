# 本地开发环境搭建指南

> Windows 环境下小程序 + Go 后端本地开发全流程，含踩坑记录。

---

## 一、环境要求

| 工具 | 最低版本 | 说明 |
|:---|:---|:---|
| Go | 1.25+ | `go.mod` 声明 `go 1.25.0`，低版本会报错 |
| MySQL | 8.0+ | 需要手动创建项目数据库 |
| Node.js | 18+ | 小程序前端（uni-app）依赖 |
| 微信开发者工具 | 最新稳定版 | 小程序模拟器调试 |
| cpolar | 任意 | 真机调试时用于内网穿透（本地开发可不装） |

---

## 二、Go 环境配置

### 坑点 1：Go 版本过低导致 toolchain 下载失败

**现象：**
```
go: download go1.25.0: golang.org/toolchain@v0.0.1-go1.25.0.windows-amd64:
Get "https://proxy.golang.org/...": dial tcp ...: connectex: A connection attempt failed
```

**原因：** `go.mod` 声明了 `go 1.25.0`，本地 Go 版本低于此版本时，会尝试自动下载 go1.25.0 toolchain，但 `proxy.golang.org` 在国内被墙。

**解决方案（任选其一）：**

1. **升级 Go 到 1.25+**（推荐）
   - 国内镜像下载：https://golang.google.cn/dl/
   - 或阿里镜像：https://mirrors.aliyun.com/golang/

2. **设置 `GOTOOLCHAIN=local`**（Go 1.21+ 支持）
   ```cmd
   set GOTOOLCHAIN=local
   ```

3. **修改 `go.mod` 降低版本要求**（临时方案）
   ```
   go 1.21    # 改成你本地的版本
   ```

### 坑点 2：多个 Go 版本，PATH 优先级冲突

**现象：** 安装了新版 Go，但 `go version` 仍然显示旧版本。

**原因：** 用户 PATH 中的旧 Go 路径（如 `%USERPROFILE%\go\bin`）排在系统 PATH 中的新 Go 路径（如 `E:\app\Go\bin`）前面。

**解决方案：**
1. `Win + R` → 输入 `sysdm.cpl` → 回车
2. 「高级」→「环境变量」
3. 在**用户变量**的 `Path` 中，删除旧的 Go 路径（如 `%USERPROFILE%\go\bin`）
4. 确认**系统变量**的 `Path` 中有新路径（如 `E:\app\Go\bin`）
5. **重新打开终端**使生效

> **注意：** `GOPATH = %USERPROFILE%\go` 是模块缓存目录，不需要改。只需改 `PATH` 中的可执行文件路径。

### 坑点 3：依赖下载超时

**现象：**
```
Get "https://proxy.golang.org/github.com/gin-gonic/gin/@v/v1.12.0.zip":
dial tcp [2a00:1450:4009:c08::8d]:443: connectex: A connection attempt failed
```

**原因：** 默认的 Go 模块代理 `proxy.golang.org` 在国内无法访问。

**解决方案：** 设置国内代理
```cmd
go env -w GOPROXY=https://goproxy.cn,direct
```

> **重要：** 此命令只需执行一次，会写入 Go 的全局配置。但每次新开终端都建议确认一下。

---

## 三、MySQL 配置

### 坑点 4：数据库连接被拒（密码错误）

**现象：**
```
Error 1045 (28000): Access denied for user 'root'@'localhost' (using password: YES)
```

**原因：** `config/config.yaml` 中配置的密码与 MySQL 实际 root 密码不一致。

**解决方案：**

1. 先测试 MySQL 能否正常登录：
   ```cmd
   mysql -u root -p
   ```

2. 修改 `src/server/config/config.yaml` 中的密码：
   ```yaml
   database:
     host: 127.0.0.1
     port: 3306
     user: root
     password: "你的真实密码"    # ← 改这里
     dbname: mysql
   ```

### 坑点 5：忘记 MySQL root 密码

**解决方案：** 重置密码

1. **停止 MySQL 服务：**
   ```cmd
   net stop mysql
   ```
   （服务名可能是 `mysql`、`mysql80` 或 `MySQL80`，不确定就去「服务」里找）

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
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'yongc20';
   FLUSH PRIVILEGES;
   EXIT;
   ```

5. **关闭跳过验证的终端**，正常启动 MySQL：
   ```cmd
   net start mysql
   ```

6. **验证：**
   ```cmd
   mysql -u root -pyongc20
   ```

### 坑点 6：`mysql` 命令找不到

**现象：** `'mysql' 不是内部或外部命令`

**原因：** MySQL 的 `bin` 目录没有加入系统 PATH。

**解决方案：**

1. 找到 MySQL 安装路径：
   ```cmd
   dir "C:\Program Files\MySQL" /s /b
   ```
   通常在 `C:\Program Files\MySQL\MySQL Server 8.0\bin\`

2. **方法一：用完整路径执行**
   ```cmd
   "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -pyongc20
   ```

3. **方法二：加到 PATH**
   - `sysdm.cpl` → 高级 → 环境变量
   - 在系统变量 `Path` 中添加 `C:\Program Files\MySQL\MySQL Server 8.0\bin`
   - 重新打开终端

4. **方法三：** 开始菜单搜索 `MySQL Command Line Client`

### 坑点 7：项目数据库未创建

**注意：** `config.yaml` 中的 `dbname: mysql` 是 MySQL 自带的系统库。项目正式使用时应创建独立数据库：

```sql
CREATE DATABASE yule_go DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

然后修改 `config.yaml`：
```yaml
database:
  dbname: yule_go
```

---

## 四、小程序配置

### 坑点 8：开发阶段请求被拦截

**现象：** 小程序请求后端 API 失败，提示域名不在合法域名列表中。

**解决方案：** 开发阶段关闭域名校验

1. 微信开发者工具 → 右上角「详情」→「本地设置」
2. 勾选 ✅ **「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」**

### 坑点 9：小程序 API 地址配置

**文件位置：** `src/miniprogram/src/api/index.js`

```js
// 开发环境：本地后端地址
const DEV_API_BASE = 'http://localhost:8080/api/v1'

// 生产环境：线上地址
const PROD_API_BASE = 'https://api.yule-go.com/api/v1'
```

- **模拟器开发：** `localhost:8080` 即可，无需 cpolar
- **真机调试：** 需要 cpolar 等内网穿透工具，将 `DEV_API_BASE` 改为 cpolar 分配的公网地址

---

## 五、快速启动清单

按顺序执行，每步确认成功后再进行下一步：

```cmd
# 1. 确认 Go 版本
go version
# 应显示 1.25+ 或 1.26+

# 2. 设置国内代理（只需一次）
go env -w GOPROXY=https://goproxy.cn,direct

# 3. 确认 MySQL 在运行
net start | findstr mysql

# 4. 确认能登录 MySQL
mysql -u root -pyongc20

# 5. （可选）创建项目数据库
# mysql> CREATE DATABASE yule_go DEFAULT CHARACTER SET utf8mb4;

# 6. 修改 config.yaml 中的数据库密码和库名

# 7. 启动后端
cd src\server
go run .

# 8. 浏览器访问健康检查
# http://localhost:8080/health
```

---

## 六、常见问题速查

| 问题 | 原因 | 解决 |
|:---|:---|:---|
| toolchain 下载超时 | Go 版本低 + proxy 被墙 | 升级 Go 或设 `GOTOOLCHAIN=local` |
| 依赖下载超时 | proxy.golang.org 被墙 | `go env -w GOPROXY=https://goproxy.cn,direct` |
| go version 显示旧版 | PATH 优先级冲突 | 删除用户 PATH 中旧 Go 路径 |
| Access denied | MySQL 密码不对 | 改 config.yaml 或重置 MySQL 密码 |
| mysql 不是内部命令 | 未加 PATH | 用完整路径或加到系统 PATH |
| 小程序请求失败 | 域名未配置 | 开发工具勾选「不校验合法域名」 |
