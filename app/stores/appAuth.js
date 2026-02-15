import { defineStore } from 'pinia'

/**
 * App 配置 Store
 * Store ID 固定為 'appConfig'
 * 持久化 Key 動態根據路由 appId 產生: app_${appId}_config
 */
export const useAppConfigStore = defineStore('appConfig', () => {
  const route = useRoute()
  const appId = route.params.appId

  const auth = ref({
    token: null,
  })

  const chatUser = ref({
    token: null,
  })

  const setToken = (token) => {
    auth.value.token = token
  }

  const getToken = () => {
    return auth.value.token
  }

  const removeToken = () => {
    auth.value.token = null
  }

  const setChatUserToken = (token) => {
    chatUser.value.token = token
  }

  const getChatUserToken = () => {
    return chatUser.value.token
  }

  return {
    auth,
    chatUser,
    setToken,
    getToken,
    removeToken,
    setChatUserToken,
    getChatUserToken,
  }
}, {
  persist: {
    storage: piniaPluginPersistedstate.localStorage(),
    key: (id) => {
      // 這裡我們需要動態取得 appId，由於 persist 插件執行時 appId 可能尚未就緒，
      // 我們透過 useRoute() 再次確認。或者直接使用儲存在 state 中的 appId (若有的話)。
      // 這裡保守串接，優先確保 key 符合 app_${appId}_config
      const route = useRoute()
      const currentAppId = route.params.appId
      return `app_${currentAppId}_config`
    },
  },
})
