<script setup lang="ts">
import { getLotGanZhi } from '@/utils/fortune'

const { t } = useI18n()
const router = useRouter()
const { state, setQuestion, hasQuestion } = useFortuneState()
const lotNumber = computed(() => state.lotNumber)

const question = ref('')
const isSubmitting = ref(false)

// If no lot number, redirect back
onMounted(() => {
  if (!lotNumber.value) {
    router.replace('/fortune/index')
  }
})

// GanZhi
const lotGanZhi = computed(() => {
    return lotNumber.value ? getLotGanZhi(lotNumber.value) : ''
})

// Suggested questions
const suggestions = [
  '工作事業運途如何？',
  '這段感情會有好的結果嗎？',
  '最近健康狀況需要注意什麼？',
  '今年的財運如何？',
  '適合換工作或是創業嗎？'
]

const selectSuggestion = (q: string) => {
  question.value = q
}

const handleSubmit = async () => {
    if (!question.value.trim()) return
    
    isSubmitting.value = true
    setQuestion(question.value)
    
    // Simulate a small delay for better UX
    setTimeout(() => {
        router.push('/fortune/interpret')
    }, 500)
}

definePageMeta({
  layout: 'fortune'
})
</script>

<template>
  <div class="w-full h-full flex flex-col relative overflow-hidden animate-fade-in">
    
    <!-- Use same background as Draw Lot for consistency in this "Alter" flow, or separate? 
         Let's use the Inquiry styled background (darker) or draw lot background. 
         Let's use draw-lot-bg but darkened. -->
    <div class="absolute inset-0 z-0">
        <img 
            src="~/assets/images/draw-lot-bg.png" 
            alt="Background" 
            class="w-full h-full object-cover opacity-40 blur-sm"
        />
        <div class="absolute inset-0 bg-stone-900/80"></div>
    </div>

    <!-- Main Content -->
    <div class="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div class="w-full max-w-2xl mx-auto min-h-full flex flex-col p-6">
        
            <!-- Header / Selected Lot Info -->
            <div class="text-center mt-8 mb-8 shrink-0">
                <div class="inline-flex items-center justify-center gap-4 mb-4">
                     <div class="bg-amber-600 w-12 h-16 rounded-lg flex flex-col items-center justify-center shadow-lg border-2 border-amber-400">
                        <span class="text-amber-100 text-xs">第</span>
                        <span class="text-amber-50 font-black text-xl">{{ lotNumber }}</span>
                     </div>
                     <div class="text-3xl font-black text-amber-400 font-serif tracking-widest drop-shadow-md">
                         {{ lotGanZhi }}
                     </div>
                </div>
                <h1 class="text-2xl md:text-3xl font-bold text-stone-200">
                    請稟報您想請教的問題
                </h1>
                <p class="text-stone-400 text-sm mt-2">
                    默念您的姓名、生辰、住址，並誠心說明您的疑惑
                </p>
            </div>

            <!-- Input Area -->
            <div class="flex-1 flex flex-col gap-6 shrink-0">
                <div class="relative">
                    <textarea
                        v-model="question"
                        rows="4"
                        class="w-full bg-stone-800/80 border-2 border-amber-700/50 rounded-xl p-4 text-lg text-amber-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none shadow-inner"
                        :placeholder="t('fortune.inquiry.placeholder') || '在此輸入您的問題...'"
                    ></textarea>
                    <div class="absolute bottom-3 right-3 text-stone-500 text-xs">
                        {{ question.length }} 字
                    </div>
                </div>

                <!-- Suggestions -->
                <div class="space-y-3">
                    <div class="text-stone-400 text-sm font-medium ml-1">參考提問：</div>
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="s in suggestions"
                            :key="s"
                            class="bg-stone-800/50 hover:bg-amber-900/30 border border-stone-700 hover:border-amber-600/50 text-stone-300 hover:text-amber-200 px-3 py-2 rounded-lg text-sm transition-all"
                            @click="selectSuggestion(s)"
                        >
                            {{ s }}
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Actions -->
            <div class="mt-auto pb-8 pt-6 shrink-0 text-center">
                <button
                    :disabled="!question.trim() || isSubmitting"
                    class="w-full bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xl font-bold py-4 rounded-xl shadow-lg border border-amber-500/30 transition-all flex items-center justify-center gap-2 group"
                    @click="handleSubmit"
                >
                    <span v-if="isSubmitting">請示中...</span>
                    <span v-else>開始解籤</span>
                    <Icon v-if="!isSubmitting" name="heroicons:arrow-right-20-solid" class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

        </div>
    </div>
  </div>
</template>
