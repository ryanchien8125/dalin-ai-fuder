<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'fortune',
  key: (route: any) => route.path,
})

const { t } = useI18n()
const router = useRouter()
const { state, setQuestion } = useFortuneState()

// Use computed to bind global state
const question = computed({
  get: () => state.question,
  set: (val: string) => setQuestion(val),
})

// Updated suggestions - distinct from UI elements, more thematic
const suggestions = [
  "弟子事業運途未明，懇請賜籤指點迷津。",
  "信女近日身體微恙，祈求福德爺文財神庇佑平安。",
  "弟子感情路途坎坷，不知良緣何在，求神指引。",
  "信士求問財利，不知本年是否適合投資轉職。"
]

const handleSuggestionClick = (text: string) => {
  question.value = text
}

const handleSubmitInquiry = () => {
  if (!question.value?.trim()) {
    toast.error(t('fortune.inquiry.error.empty'))
    return
  }
  router.push('/fortune/draw-lot')
}
</script>

<template>
  <div class="w-full h-full flex flex-col relative overflow-hidden animate-fade-in">
    
    <!-- Use same background as Draw Lot / Confirm Inquiry for consistency -->
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
        
            <!-- Header -->
            <div class="text-center mt-8 mb-8 shrink-0">
                <h1 class="text-2xl md:text-3xl font-bold text-stone-200">
                    {{ t('fortune.steps.inquiry') || '誠心祈問' }}
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
                        rows="5"
                        class="w-full bg-stone-800/80 border-2 border-amber-700/50 rounded-xl p-4 text-lg text-amber-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none shadow-inner"
                        :placeholder="t('fortune.inquiry.placeholder') || '在此輸入您的問題...'"
                    ></textarea>
                    <div class="absolute bottom-3 right-3 text-stone-500 text-xs">
                        {{ question?.length || 0 }} 字
                    </div>
                </div>

                <!-- Suggestions -->
                <div class="space-y-3">
                    <div class="text-stone-400 text-sm font-medium ml-1">參考提問：</div>
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="(text, idx) in suggestions"
                            :key="idx"
                            class="bg-stone-800/50 hover:bg-amber-900/30 border border-stone-700 hover:border-amber-600/50 text-stone-300 hover:text-amber-200 px-3 py-2 rounded-lg text-sm transition-all text-left"
                            @click="handleSuggestionClick(text)"
                        >
                            {{ text }}
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Actions -->
            <div class="mt-auto pb-8 pt-6 shrink-0 text-center">
                <button
                    :disabled="!question?.trim()"
                    class="w-full bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xl font-bold py-4 rounded-xl shadow-lg border border-amber-500/30 transition-all flex items-center justify-center gap-2 group"
                    @click="handleSubmitInquiry"
                >
                    <span>{{ t('fortune.inquiry.nextButton') }}</span>
                    <Icon name="heroicons:arrow-right-20-solid" class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    </div>
  </div>
</template>
