package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response 统一响应结构
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

// PageResult 分页结果
type PageResult struct {
	Total int64       `json:"total"`
	List  interface{} `json:"list"`
}

// Success 成功响应
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    0,
		Message: "success",
		Data:    data,
	})
}

// SuccessWithMessage 成功响应（自定义消息）
func SuccessWithMessage(c *gin.Context, msg string, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    0,
		Message: msg,
		Data:    data,
	})
}

// Error 错误响应
func Error(c *gin.Context, code int, msg string) {
	c.JSON(http.StatusOK, Response{
		Code:    code,
		Message: msg,
		Data:    nil,
	})
}

// BadRequest 400 错误
func BadRequest(c *gin.Context, msg string) {
	Error(c, 40000, msg)
}

// Unauthorized 401 错误
func Unauthorized(c *gin.Context) {
	c.JSON(http.StatusUnauthorized, Response{
		Code:    40100,
		Message: "未登录或登录已过期",
		Data:    nil,
	})
}

// Forbidden 403 错误
func Forbidden(c *gin.Context) {
	Error(c, 40300, "无权限访问")
}

// NotFound 404 错误
func NotFound(c *gin.Context) {
	Error(c, 40400, "资源不存在")
}

// ServerError 500 错误
func ServerError(c *gin.Context, msg string) {
	c.JSON(http.StatusInternalServerError, Response{
		Code:    50000,
		Message: msg,
		Data:    nil,
	})
}

// Page 分页响应
func Page(c *gin.Context, total int64, list interface{}) {
	Success(c, PageResult{
		Total: total,
		List:  list,
	})
}
