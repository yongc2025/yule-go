package handler

import (
	"yule-go/pkg/response"
	"yule-go/scheduler"

	"github.com/gin-gonic/gin"
)

var globalScheduler *scheduler.Scheduler

// SetScheduler 设置全局调度器实例
func SetScheduler(s *scheduler.Scheduler) {
	globalScheduler = s
}

// AdminCancelExpiredOrders 手动触发取消超时订单
// POST /api/v1/admin/orders/cancel-expired
func AdminCancelExpiredOrders(c *gin.Context) {
	if globalScheduler == nil {
		response.ServerError(c, "调度器未初始化")
		return
	}

	count, err := globalScheduler.CancelExpiredOrdersNow()
	if err != nil {
		response.ServerError(c, "执行失败: "+err.Error())
		return
	}

	response.Success(c, gin.H{
		"cancelled_count": count,
		"message":         "超时订单取消完成",
	})
}
