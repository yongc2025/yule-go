package scheduler

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"yule-go/repository"

	"github.com/robfig/cron/v3"
)

// Scheduler 定时任务调度器
type Scheduler struct {
	cron      *cron.Cron
	orderRepo repository.OrderRepository
}

// New 创建调度器
func New(orderRepo repository.OrderRepository) *Scheduler {
	loc, _ := time.LoadLocation("Asia/Shanghai")
	c := cron.New(cron.WithLocation(loc), cron.WithSeconds())
	return &Scheduler{
		cron:      c,
		orderRepo: orderRepo,
	}
}

// Start 启动调度器
func (s *Scheduler) Start() {
	// 每分钟检查一次超时订单
	s.cron.AddFunc("0 */1 * * * *", s.cancelExpiredOrders)

	s.cron.Start()
	log.Println("⏰ 定时任务调度器已启动")
}

// Stop 优雅停止调度器
func (s *Scheduler) Stop() {
	ctx := s.cron.Stop()
	<-ctx.Done()
	log.Println("⏰ 定时任务调度器已停止")
}

// cancelExpiredOrders 取消超时未支付订单
func (s *Scheduler) cancelExpiredOrders() {
	count, err := s.orderRepo.CancelExpiredOrders(15 * time.Minute)
	if err != nil {
		log.Printf("❌ 定时取消超时订单失败: %v", err)
		return
	}
	if count > 0 {
		log.Printf("✅ 定时取消超时订单: %d 笔", count)
	}
}

// CancelExpiredOrdersNow 手动触发取消超时订单（供管理后台调用）
func (s *Scheduler) CancelExpiredOrdersNow() (int64, error) {
	return s.orderRepo.CancelExpiredOrders(15 * time.Minute)
}

// WaitForSignal 优雅退出：等待系统信号
func WaitForSignal(scheduler *Scheduler) {
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	sig := <-quit
	fmt.Printf("\n🛑 收到信号 %v，正在优雅退出...\n", sig)
	scheduler.Stop()
}
