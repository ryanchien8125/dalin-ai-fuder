<script setup lang="ts">
const { t } = useI18n()
const router = useRouter()
const { resetSession } = useFortuneState()

// Navigate to manual selection (already have a lot)
const handleHaveLot = () => {
    resetSession()
    router.push('/fortune/select-lot')
}

// Navigate to inquiry flow (ask god)
const handleRequestLot = () => {
    resetSession()
    router.push('/fortune/inquiry')
}

const imageError = ref(false)
const handleImageError = () => {
  imageError.value = true
}

definePageMeta({
  layout: 'fortune'
})
</script>

<template>
  <div class="h-full overflow-y-auto w-full flex flex-col">
    <div class="w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-full gap-4 md:gap-8 animate-fade-in flex-1 py-4 md:py-8 px-4">
      
      <!-- Hero Section -->
      <div class="text-center space-y-2 md:space-y-4 shrink-0">
        <div class="relative inline-block">
          <div class="absolute inset-0 bg-amber-500 blur-2xl opacity-20 rounded-full"></div>
          
          <img 
            v-show="!imageError"
            src="~/assets/images/fuder-icon.png" 
            alt="福德爺文財神" 
            class="w-24 h-24 md:w-40 md:h-40 mx-auto relative z-10 drop-shadow-2xl animate-float" 
            @error="handleImageError" 
          />
          
          <!-- Fallback Icon if image missing -->
          <div 
            v-if="imageError"
            class="w-24 h-24 md:w-40 md:h-40 mx-auto relative z-10 flex items-center justify-center bg-red-900/50 rounded-full border-4 border-amber-600/50 backdrop-blur-sm"
          >
              <span class="text-5xl md:text-7xl">🏮</span>
          </div>
        </div>
        
        <h1 class="text-3xl md:text-5xl font-black text-amber-400 drop-shadow-lg tracking-wider">
          福德爺文財神靈籤
        </h1>
        <p class="text-amber-200/80 text-base md:text-xl font-light tracking-widest">
          誠心祈求 · 指點迷津
        </p>
      </div>
  
      <!-- Action Buttons -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:px-8 shrink-0 relative z-20">
        
        <!-- Option 1: Already have a lot -->
        <button 
          @click="handleHaveLot"
          class="group relative overflow-hidden rounded-xl bg-stone-100 p-1 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(251,191,36,0.2)] active:scale-95 ring-1 ring-stone-200 hover:ring-amber-500/50"
        >
          <!-- Shine Effect -->
          <div class="absolute inset-0 z-0 bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shine transition-all duration-1000 ease-in-out"></div>
          
          <div class="relative h-full w-full bg-stone-100 rounded-lg border-2 border-amber-600/20 p-4 md:p-8 flex flex-col items-center gap-2 md:gap-4 text-center group-hover:border-amber-600 transition-colors z-10">
              <div class="w-12 h-12 md:w-16 md:h-16 rounded-full bg-stone-200 flex items-center justify-center text-2xl md:text-3xl group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors shadow-inner group-hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                  🔢
              </div>
              <div>
                  <h3 class="text-lg md:text-2xl font-bold text-stone-800 mb-1 font-serif">我已求得靈籤</h3>
                  <p class="text-stone-500 text-xs md:text-sm">若您已在廟宇祈求到籤號<br>可直接輸入籤號解籤</p>
              </div>
              <div class="mt-2 text-amber-600 font-bold flex items-center gap-1 text-sm md:text-base opacity-100 bg-amber-100/50 px-3 py-1 rounded-full border border-amber-200/50">
                  開始解籤 <Icon name="heroicons:arrow-right-20-solid" class="animate-move-x" />
              </div>
          </div>
        </button>
  
        <!-- Option 2: Ask God -->
        <button 
          @click="handleRequestLot"
          class="group relative overflow-hidden rounded-xl bg-linear-to-br from-red-800 to-red-900 p-1 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(220,38,38,0.4)] active:scale-95 ring-1 ring-red-700/50 hover:ring-amber-400/50 shadow-lg"
        >
          <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20"></div>
          <!-- Shine Effect -->
          <div class="absolute inset-0 z-0 bg-linear-to-r from-transparent via-amber-400/20 to-transparent -translate-x-full group-hover:animate-shine transition-all duration-1000 ease-in-out"></div>
          
          <div class="relative h-full w-full rounded-lg border-2 border-amber-500/30 p-4 md:p-8 flex flex-col items-center gap-2 md:gap-4 text-center group-hover:border-amber-400 transition-colors z-10">
              <div class="w-12 h-12 md:w-16 md:h-16 rounded-full bg-red-950/50 flex items-center justify-center text-2xl md:text-3xl text-amber-400 ring-2 ring-amber-500/20 group-hover:ring-amber-400/50 transition-all shadow-[0_0_15px_rgba(251,191,36,0.15)] group-hover:shadow-[0_0_25px_rgba(251,191,36,0.3)] animate-pulse-slow">
                  🙏
              </div>
              <div>
                  <h3 class="text-lg md:text-2xl font-bold text-amber-400 mb-1 font-serif">向福德爺文財神求籤</h3>
                  <p class="text-amber-200/60 text-xs md:text-sm">誠心默念您的姓名與疑問<br>祈求神明賜予靈籤</p>
              </div>
              <div class="mt-2 text-amber-300 font-bold flex items-center gap-1 text-sm md:text-base opacity-100 bg-red-950/40 px-3 py-1 rounded-full border border-amber-500/20">
                  開始求籤 <Icon name="heroicons:arrow-right-20-solid" class="animate-move-x" />
              </div>
          </div>
        </button>
  
      </div>
  
    </div>

  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.animate-float {
  animation: float 6s ease-in-out infinite;
}

@keyframes shine {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}
.animate-shine {
  animation: shine 1.5s ease-in-out infinite;
}

@keyframes pulse-slow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(0.95); }
}
.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}

@keyframes move-x {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(3px); }
}
.animate-move-x {
  animation: move-x 1s ease-in-out infinite;
}
</style>