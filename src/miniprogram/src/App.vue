<script>
import { wxLogin, hasToken } from './utils/auth'

export default {
  onLaunch() {
    console.log('渔乐出行小程序启动')
    this.autoLogin()
  },

  methods: {
    async autoLogin() {
      // 已有 token 则跳过，等请求时验证有效性
      if (hasToken()) {
        console.log('已有 token，跳过自动登录')
        return
      }

      try {
        const { is_new } = await wxLogin()
        console.log('自动登录成功', is_new ? '(新用户)' : '(老用户)')
      } catch (err) {
        console.error('自动登录失败:', err.message)
      }
    }
  }
}
</script>

<style>
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #333;
  font-size: 28rpx;
  line-height: 1.6;
}
</style>
