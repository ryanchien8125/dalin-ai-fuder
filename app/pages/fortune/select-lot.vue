<script setup lang="ts">
import { getFortuneStickList } from '@/constants/fortune'
import { getLotGanZhi } from '@/utils/fortune'

const { t } = useI18n()
const router = useRouter()
const { setLotNumber, hasQuestion } = useFortuneState()

// 1-60 Lot Numbers
const lots = getFortuneStickList().map(lot => ({
  ...lot,
  ganzhi: getLotGanZhi(lot.value)
}))

const handleLotSelect = (lotValue: number) => {
  setLotNumber(lotValue)
  // If user already has a question (flow: Question -> Draw/Select), go directly to interpret
  // BUT the new requirement says: "Modify the user flow for users who already have a lot number: they should now select a lot, then input their question"
  // So regardless of previous state, we might want to ensure they confirm the question.
  // However, if they start from "Inquiry" page, they already entered a question.
  // Let's check the requirement again: "Modifying the user flow for users who already have a lot number: they should now select a lot, then input their question"
  // This implies the "Direct Select Lot" flow. 
  
  if (hasQuestion.value) {
     // If they came from Inquiry page, they have a question.
     // In the original flow, they might draw or select. 
     // If they explicitly selected "I already have a lot number" from Home, hasQuestion is false.
     router.push('/fortune/interpret')
  } else {
     // If they don't have a question (Direct Select Lot flow), go to confirm-inquiry to input question.
     router.push('/fortune/confirm-inquiry') 
  }
}

definePageMeta({
  layout: 'fortune'
})
</script>

<template>
  <div class="w-full h-full flex flex-col relative overflow-hidden animate-fade-in">
    <!-- Background Image -->
    <div class="absolute inset-0 z-0">
        <img 
            src="~/assets/images/select-lot-bg.png" 
            alt="Background" 
            class="w-full h-full object-cover opacity-60 grayscale-[0.2]"
        />
        <div class="absolute inset-0 bg-stone-900/70 backdrop-blur-[2px]"></div>
    </div>

    <!-- Main Content -->
    <div class="relative z-10 w-full h-full flex flex-col py-6 md:py-8 px-4 overflow-hidden">
        
        <!-- Header -->
        <div class="shrink-0 text-center mb-6">
            <h1 class="text-3xl md:text-4xl font-bold text-amber-400 font-serif drop-shadow-md tracking-wider">
                {{ t('fortune.selectLot.title') || '請選擇您的籤號' }}
            </h1>
            <p class="text-stone-300 text-sm md:text-base mt-2">
                {{ t('fortune.selectLot.subtitle') || '請依照您求得的籤號選擇' }}
            </p>
        </div>

        <!-- Grid Container -->
        <div class="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar">
            <div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-3 md:gap-4 pb-20">
                <button
                    v-for="lot in lots"
                    :key="lot.value"
                    class="group relative aspect-3/4 flex flex-col items-center justify-center bg-linear-to-b from-amber-800 to-amber-950 border border-amber-700/50 rounded-lg shadow-lg hover:shadow-amber-500/20 hover:-translate-y-1 transition-all duration-200 overflow-hidden"
                    @click="handleLotSelect(lot.value)"
                >
                    <!-- Inner Border/Texture -->
                    <div class="absolute inset-1 border border-amber-600/30 rounded-md pointer-events-none"></div>
                    <div class="absolute inset-0 bg-[url('~/assets/images/dalin-fuder.jpg')] opacity-10 mix-blend-overlay"></div>

                    <!-- Lot Number & GanZhi -->
                    <div class="flex flex-col items-center space-y-1 relative z-10">
                        <span class="text-amber-500/50 text-xs font-serif font-bold group-hover:text-amber-400 transition-colors">第</span>
                        <span class="text-2xl md:text-3xl font-black text-amber-100 font-serif group-hover:scale-110 transition-transform drop-shadow-md">
                            {{ lot.value }}
                        </span>
                        <span v-if="lot.ganzhi" class="text-amber-400/80 text-xs md:text-sm font-bold tracking-widest border-t border-amber-700/50 pt-1 mt-1 group-hover:text-amber-300">
                            {{ lot.ganzhi }}
                        </span>
                    </div>

                    <!-- Shine Effect -->
                    <div class="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
            </div>
        </div>
        
        <!-- Bottom Fade -->
        <div class="absolute bottom-0 left-0 w-full h-12 bg-linear-to-t from-stone-900 via-stone-900/80 to-transparent pointer-events-none"></div>

    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(217, 119, 6, 0.3);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(217, 119, 6, 0.5);
}
</style>
