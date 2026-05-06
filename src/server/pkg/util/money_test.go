package util

import (
	"math"
	"testing"
)

func TestRoundToCent(t *testing.T) {
	tests := []struct {
		name     string
		input    float64
		expected float64
	}{
		{"整数", 100, 100},
		{"两位小数", 100.50, 100.50},
		{"三位小数四舍五入", 100.555, 100.56},
		{"三位小数五入", 100.556, 100.56},
		{"三位小数四舍", 100.554, 100.55},
		{"负数", -100.555, -100.56},
		{"零", 0, 0},
		{"极小数", 0.001, 0},
		{"极小数五入", 0.005, 0.01},
		{"大数", 99999.999, 100000},
		{"浮点精度问题", 0.1 + 0.2, 0.3}, // 0.30000000000000004 → 0.3
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := RoundToCent(tt.input)
			if math.Abs(result-tt.expected) > 0.0001 {
				t.Errorf("RoundToCent(%v) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}
