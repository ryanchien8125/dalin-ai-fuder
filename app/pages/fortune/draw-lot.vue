<script setup lang="ts">
import { useDeviceMotion } from '@vueuse/core'
import { getFortuneStickList } from '@/constants/fortune'
import { getLotGanZhi } from '@/utils/fortune'

const { t } = useI18n()
const router = useRouter()
const { hasQuestion, setLotNumber } = useFortuneState()
const isShaking = ref(false)
const selectedLot = ref('')
const containerRef = ref(null)

// 1-60 Lot Numbers with Labels
const lots = getFortuneStickList()

// --- iOS Motion Permission (使用共用 composable) ---
const { state: motionState, init: initMotionPermission, requestPermission, needsPermission, isSupported } = useMotionPermission()

// 初始化權限檢查
onMounted(() => {
  initMotionPermission()
})

// --- Shake Detection ---
const { accelerationIncludingGravity } = useDeviceMotion()
const SHAKE_THRESHOLD = 15
let lastUpdate = 0

watch(accelerationIncludingGravity, (newVal) => {
  // 只有在權限已授予時才處理搖動
  if (!motionState.granted) return
  if (!newVal) return

  const now = Date.now()
  if (now - lastUpdate < 100) return // Debounce

  const x = newVal.x
  const y = newVal.y
  const z = newVal.z

  if (x === null || y === null || z === null) return

  const acceleration = Math.sqrt(x ** 2 + y ** 2 + z ** 2)
  if (acceleration > SHAKE_THRESHOLD) {
    triggerShake()
    lastUpdate = now
  }
})

// --- Swipe Detection (Touch & Mouse) ---
const touchStart = ref({ x: 0, y: 0 })
const isDragging = ref(false)

const handleTouchStart = (e: TouchEvent) => {
  if (e.touches && e.touches.length > 0) {
    const touch = e.touches[0]
    if (touch) {
      touchStart.value = { x: touch.clientX, y: touch.clientY }
    }
  }
}

const handleTouchEnd = (e: TouchEvent) => {
  if (e.changedTouches && e.changedTouches.length > 0) {
    const touch = e.changedTouches[0]
    if (touch) {
      const deltaX = touch.clientX - touchStart.value.x
      const deltaY = touch.clientY - touchStart.value.y

      // Horizontal swipe
      if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 30) {
        triggerShake()
      }
    }
  }
}

// --- Mouse Drag Detection ---
const handleMouseDown = (e: MouseEvent) => {
  isDragging.value = true
  touchStart.value = { x: e.clientX, y: e.clientY }
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return

  const deltaX = e.clientX - touchStart.value.x

  // 左右來回滑動超過 80px 觸發
  if (Math.abs(deltaX) > 80) {
    isDragging.value = false
    triggerShake()
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

// --- Motion Support Detection ---
const hasMotionSupport = computed(() => {
  return isSupported()
})

// --- Container Click Handler (包含 iOS 權限請求) ---
const handleContainerClick = async () => {
  // 在使用者互動時請求權限（iOS 要求必須在使用者手勢中請求）
  if (needsPermission() && !motionState.requested) {
    await requestPermission()
  }
  triggerShake()
}

// --- Animation Trigger ---
const triggerShake = () => {
  if (isShaking.value) return
  isShaking.value = true

  // Clear selection while shaking
  selectedLot.value = ''

  setTimeout(() => {
    isShaking.value = false
    // Randomly pick a lot (1-60)
    const randomNum = Math.floor(Math.random() * 60) + 1
    selectedLot.value = String(randomNum)
  }, 1500) // Duration of shake animation
}

const handleSubmit = () => {
  if (!selectedLot.value) {
    alert(t('fortune.drawLot.error.noLot'))
    return
  }
  const lotNum = parseInt(selectedLot.value)
  if (isNaN(lotNum) || lotNum < 1 || lotNum > 60) {
    alert(t('fortune.drawLot.error.invalidLot'))
    return
  }
  // 存儲籤號到應用程式狀態
  setLotNumber(lotNum)
  // 導航到解籤頁面
  router.push('/fortune/interpret')
}

// Session 過期 Modal 狀態
const showSessionExpiredModal = ref(false)

// 頁面重整檢查：若無前一步驟的資料，顯示 Modal
onMounted(() => {
  if (!hasQuestion.value) {
    showSessionExpiredModal.value = true
  }
})

const handleSessionExpiredConfirm = () => {
  showSessionExpiredModal.value = false
  router.replace('/fortune/index')
}

definePageMeta({
  layout: 'fortune'
})
</script>

<template>
  <div class="w-full h-full relative overflow-hidden animate-fade-in bg-stone-900">
    
    <!-- Background Image (Fixed) -->
    <div class="absolute inset-0 z-0">
        <img 
            src="~/assets/images/draw-lot-bg.png" 
            alt="Background" 
            class="w-full h-full object-cover opacity-60 blur-sm"
        />
        <div class="absolute inset-0 bg-stone-900/60"></div>
    </div>

    <!-- Main Content (Scrollable) -->
    <div class="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden">
        <div class="w-full min-h-full flex flex-col items-center justify-between py-8 md:py-12 px-4">
        
        <!-- Header -->
        <div class="text-center space-y-2 mt-4">
            <h1 class="text-3xl md:text-4xl font-bold text-stone-200 font-serif tracking-widest drop-shadow-md">
                {{ t('fortune.drawLot.title') || '誠心求籤' }}
            </h1>
            <p class="text-stone-400 text-sm md:text-base font-medium tracking-wider">
                {{ t('fortune.drawLot.subtitle') || '請搖動手機或點擊籤筒' }}
            </p>
        </div>

        <!-- Lottery Container (Centerpiece) -->
        <div class="flex-1 flex items-center justify-center w-full relative group">
            
            <!-- Radiance behind container -->
            <div class="absolute w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full animate-pulse group-hover:bg-amber-500/20 transition-all duration-500"></div>

            <div
                ref="containerRef"
                class="lot-container cursor-pointer relative w-56 h-56 md:w-80 md:h-80 flex items-center justify-center transition-transform duration-100 touch-none select-none"
                :class="{ 'animate-shake': isShaking }"
                @touchstart="handleTouchStart"
                @touchend="handleTouchEnd"
                @mousedown="handleMouseDown"
                @mousemove="handleMouseMove"
                @mouseup="handleMouseUp"
                @mouseleave="handleMouseUp"
                @click="handleContainerClick"
            >
                <img
                  src="@/assets/images/worship/lot-container.png"
                  class="relative z-10 w-full h-full object-contain drop-shadow-2xl filter brightness-90 contrast-110 transition-all duration-300 group-hover:scale-105 group-hover:brightness-100"
                  alt="Lottery Container"
                  draggable="false"
                >
                
                <!-- Hint Text -->
                <div v-if="!isShaking && !selectedLot" class="absolute -bottom-8 left-1/2 -translate-x-1/2 text-stone-400 text-xs md:text-sm whitespace-nowrap animate-pulse tracking-widest border border-stone-600/50 px-3 py-1 rounded-full backdrop-blur-sm">
                    點擊或搖動求賜靈籤
                </div>
            </div>
        </div>

        <!-- Result / Manual Selection -->
        <div class="w-full max-w-sm mx-auto space-y-6 pb-8">
            
            <!-- Result Display (When shaking finishes) -->
            <div v-if="selectedLot" class="animate-bounce-in text-center">
                 <div class="inline-block bg-stone-800/90 border border-amber-500/30 rounded-xl p-6 shadow-2xl relative backdrop-blur-md">
                     <div class="text-amber-500/60 text-xs font-serif mb-2 tracking-widest uppercase">福德正神賜籤</div>
                     <div class="text-5xl font-black text-amber-400 font-serif mb-2 drop-shadow-md">
                         第 {{ selectedLot }} 籤
                     </div>
                     <div class="text-stone-300 font-bold text-lg border-t border-amber-500/20 pt-2 mt-2">
                         {{ getLotGanZhi(parseInt(selectedLot)) }}
                     </div>
                 </div>
            </div>

            <!-- Action Button -->
            <div v-if="selectedLot" class="w-full">
                <button
                    class="w-full bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xl font-bold py-4 rounded-xl shadow-lg border border-amber-500/30 transition-all flex items-center justify-center gap-2 group"
                    @click="handleSubmit"
                >
                    <span>{{ t('fortune.drawLot.nextButton') }}</span>
                    <Icon name="heroicons:arrow-right-20-solid" class="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
            
            <!-- Manual Select Trigger (Hidden if result shown, or subtle) -->
            <div v-else class="text-center px-4">
                <Select v-model="selectedLot">
                  <SelectTrigger class="w-full bg-stone-800/50 border border-stone-700 text-stone-300 h-12 rounded-xl backdrop-blur-sm justify-between hover:bg-stone-800/80 transition-colors focus:ring-1 focus:ring-amber-500/50">
                      <span class="pl-2">或是直接選擇籤號...</span>
                  </SelectTrigger>
                  <SelectContent class="bg-stone-800 border-stone-700 max-h-60 text-stone-200">
                      <SelectItem 
                        v-for="lot in lots" 
                        :key="lot.value" 
                        :value="String(lot.value)" 
                        class="justify-center font-bold focus:bg-amber-900/30 focus:text-amber-400 cursor-pointer"
                      >
                          {{ lot.label }}
                      </SelectItem>
                  </SelectContent>
              </Select>
            </div>

        </div>

    </div>
    </div>

    <!-- Session Expiration Modal -->
    <FortuneSessionExpiredModal
      :show="showSessionExpiredModal"
      @confirm="handleSessionExpiredConfirm"
    />
  </div>
</template>

<style scoped>
@keyframes shake {
  0% { transform: rotate(0deg) translate(0, 0); }
  10% { transform: rotate(-5deg) translate(-5px, 0); }
  20% { transform: rotate(5deg) translate(5px, 0); }
  30% { transform: rotate(-7deg) translate(-5px, 0); }
  40% { transform: rotate(7deg) translate(5px, 0); }
  50% { transform: rotate(-5deg) translate(-3px, 0); }
  60% { transform: rotate(5deg) translate(3px, 0); }
  70% { transform: rotate(-3deg) translate(-2px, 0); }
  80% { transform: rotate(3deg) translate(2px, 0); }
  90% { transform: rotate(-1deg) translate(-1px, 0); }
  100% { transform: rotate(0deg) translate(0, 0); }
}

.animate-shake {
  animation: shake 0.5s infinite;
}

@keyframes bounceIn {
  0% { transform: scale(0.8); opacity: 0; }
  60% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); }
}

.animate-bounce-in {
  animation: bounceIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
</style>
