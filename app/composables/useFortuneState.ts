/**
 * Fortune Flow 狀態管理
 * 使用記憶體狀態追蹤問卜流程，重整後會遺失
 */
const fortuneState = reactive({
  hasStarted: false,       // 是否已從禮拜開始
  step: 'worship' as 'worship' | 'inquiry', // 當前子步驟
  question: '',            // 使用者的問題
  lotNumber: null as number | null  // 抽到的籤號
})

export const useFortuneState = () => {
  // 開始新的問卜流程 (不重置 step，保留讓頁面控制)
  const startSession = () => {
    fortuneState.hasStarted = true
    // fortuneState.question = '' // 不在此清除問題，允許返回修改
    fortuneState.lotNumber = null
  }

  // 設定子步驟
  const setStep = (step: 'worship' | 'inquiry') => {
    fortuneState.step = step
  }

  // 設定問題
  const setQuestion = (question: string) => {
    fortuneState.question = question
  }

  // 設定籤號
  const setLotNumber = (lotNumber: number) => {
    fortuneState.lotNumber = lotNumber
  }

  // 完全重置狀態 (Refresh 或重新開始時呼叫)
  const resetSession = () => {
    fortuneState.hasStarted = false
    fortuneState.step = 'worship'
    fortuneState.question = ''
    fortuneState.lotNumber = null
  }

  // 檢查流程是否有效
  const isSessionValid = computed(() => fortuneState.hasStarted)
  const hasQuestion = computed(() => !!fortuneState.question)
  const currentStep = computed(() => fortuneState.step)

  return {
    state: readonly(fortuneState),
    startSession,
    setStep,
    setQuestion,
    setLotNumber,
    resetSession,
    isSessionValid,
    hasQuestion,
    currentStep
  }
}
