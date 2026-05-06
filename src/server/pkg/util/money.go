package util

import "math"

// RoundToCent 将金额四舍五入到分（保留 2 位小数）
// 统一全链路金额精度处理，避免浮点累积误差
func RoundToCent(amount float64) float64 {
	return math.Round(amount*100) / 100
}
