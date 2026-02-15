/**
 * DeviceMotion 權限狀態管理
 * 用於管理 iOS 13+ 的加速度感應器權限
 */

// 擴展 DeviceMotionEvent 類型（iOS 13+ 特有）
interface DeviceMotionEventWithPermission extends DeviceMotionEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

// 全域狀態（跨元件共享）
const motionPermissionState = reactive({
  granted: false,
  requested: false,
  supported: false
})

export const useMotionPermission = () => {
  // 檢查是否需要請求權限（iOS 13+）
  const needsPermission = () => {
    const DeviceMotionEventCtor = DeviceMotionEvent as unknown as DeviceMotionEventWithPermission & typeof DeviceMotionEvent
    return typeof DeviceMotionEvent !== 'undefined' && 
           typeof DeviceMotionEventCtor.requestPermission === 'function'
  }

  // 檢查裝置是否支援 DeviceMotion
  const isSupported = () => {
    return typeof DeviceMotionEvent !== 'undefined'
  }

  // 初始化（在應用程式啟動時呼叫）
  const init = () => {
    motionPermissionState.supported = isSupported()
    
    // 非 iOS 裝置或舊版 iOS 不需要權限，直接標記為已授權
    if (!needsPermission()) {
      motionPermissionState.granted = true
      motionPermissionState.requested = true
    }
  }

  // 請求權限（必須在使用者互動中呼叫）
  const requestPermission = async () => {
    if (motionPermissionState.requested) {
      return motionPermissionState.granted
    }
    
    motionPermissionState.requested = true
    
    if (needsPermission()) {
      try {
        const DeviceMotionEventCtor = DeviceMotionEvent as unknown as { requestPermission: () => Promise<'granted' | 'denied'> }
        const permission = await DeviceMotionEventCtor.requestPermission()
        motionPermissionState.granted = permission === 'granted'
        console.log('[MotionPermission] Result:', permission)
      } catch (e) {
        console.warn('[MotionPermission] Request failed:', e)
        motionPermissionState.granted = false
      }
    } else {
      motionPermissionState.granted = true
    }
    
    return motionPermissionState.granted
  }

  return {
    state: readonly(motionPermissionState),
    needsPermission,
    isSupported,
    init,
    requestPermission
  }
}
