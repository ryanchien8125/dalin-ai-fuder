<script setup lang="ts">
import MarkdownRenderer from '~/components/MarkdownRenderer.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { state: fortuneState } = useFortuneState()

definePageMeta({
  layout: 'fortune'
})

// Use the new SSE stream composable
const { messages, isLoading, conversationId, sendMessage, loadHistory } = useChatStream()

const userInput = ref('')
const scrollAnchor = ref<HTMLElement | null>(null)
const messagesContainerRef = ref<HTMLElement | null>(null)
const showScrollTop = ref(false)
const hasUsedScrollTop = ref(false)
const showSessionExpiredModal = ref(false)

// Initial data
const lotNumber = ref<number | null>(null)
const userQuestion = ref('')

// Scroll helpers
const scrollToBottom = () => {
  nextTick(() => {
    if (scrollAnchor.value) {
      scrollAnchor.value.scrollIntoView({ behavior: 'smooth' })
    }
  })
}

const scrollToTop = () => {
  if (messagesContainerRef.value) {
    messagesContainerRef.value.scrollTo({ top: 0, behavior: 'smooth' })
    hasUsedScrollTop.value = true
    showScrollTop.value = false
  }
}

const handleScroll = () => {
  if (!messagesContainerRef.value || hasUsedScrollTop.value) return
  const isFirstResponse = messages.value.length === 2
  if (!isFirstResponse || isLoading.value) return
  const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.value
  const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100
  showScrollTop.value = isAtBottom
}

// Watchers
watch(messages, () => {
    scrollToBottom()
}, { deep: true })

watch(isLoading, (newVal) => {
  if (!newVal) {
    nextTick(() => {
      handleScroll()
    })
  }
})

// Handlers
const handleUserSubmit = async () => {
  if (!userInput.value.trim() || isLoading.value) return
  const content = userInput.value
  userInput.value = ''
  await sendMessage(content)
}

const handleSessionExpiredConfirm = () => {
  showSessionExpiredModal.value = false
  router.replace('/fortune/index')
}

// Lifecycle
onMounted(async () => {
  // 1. Check URL for existing conversation
  const urlConversationId = route.query.c as string
  if (urlConversationId) {
    console.log('[Interpret] Found conversationId in URL:', urlConversationId)
    await loadHistory(urlConversationId)
    if (messages.value.length > 0) {
        return // History loaded successfully
    } else {
        console.warn('[Interpret] Failed to load history, starting fresh')
        router.replace({ query: {} })
    }
  }

  // 2. New Sesion Flow
  const storedLot = fortuneState.lotNumber
  const storedQuestion = fortuneState.question || '請為我解籤'

  if (!storedLot && !urlConversationId) {
    console.log('[Interpret] Missing lot number, showing modal...')
    showSessionExpiredModal.value = true
    return
  }

  if (storedLot) {
      lotNumber.value = storedLot
      userQuestion.value = storedQuestion
      
      // 3. Initial Greeting (Local only, not saved to DB yet)
      const greeting = storedQuestion === '請為我解籤' 
        ? t('fortune.interpret.greeting_general', { lot: storedLot }) 
        : t('fortune.interpret.greeting', { question: storedQuestion })
      
      // We don't push this greeting to messages array to avoid duplication with DB
      // Or we can treat it as a UI-only operational message.
      // For now, let's just start the generation which will stream the real first message.
      
      // 4. Trigger AI Generation
      await sendMessage(userQuestion.value, lotNumber.value)
  }
})

// Sync conversationId to URL
watch(conversationId, (newId) => {
    if (newId) {
        router.replace({
            query: { ...route.query, c: newId }
        })
    }
})
</script>

<template>
    <div class="w-full max-w-4xl mx-auto flex flex-col items-center relative z-10 animate-fade-in gap-4 pb-0 overflow-hidden font-serif h-full">
      
      <!-- Main Chat Area (Scroll Container) -->
      <div class="w-full flex-1 relative z-20 transition-all min-h-0 flex flex-col">
          
          <!-- background Layer (Bottom) -->
          <div class="absolute inset-0 bg-[#FFFDF5] shadow-lg overflow-hidden z-0">
               <!-- Texture -->
               <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>
          </div>

          <!-- Chat Messages (Middle) -->
          <div
              ref="messagesContainerRef"
              class="flex-1 p-4 md:p-8 space-y-8 overflow-y-auto scroll-smooth interpret-chat-area min-h-0 relative z-10"
              @scroll="handleScroll"
          >
              <!-- Welcome / Lot Info Header -->
              <div v-if="lotNumber" class="text-center py-6 border-b border-red-900/5 mb-6 mx-4">
                  <div class="inline-block border border-red-900/20 rounded-full p-1 mb-2">
                       <div class="w-12 h-12 bg-red-900 text-amber-100 rounded-full flex items-center justify-center font-bold text-xl shadow-inner">
                           {{ lotNumber }}
                       </div>
                  </div>
                  <h3 class="text-red-900/60 font-bold tracking-[0.2em] text-xs">福德正神靈籤</h3>
              </div>


              <template v-for="(msg, index) in messages" :key="index">
                  <!-- User Message (Prayer Request - Humble) -->
                  <div v-if="msg.role === 'user'" class="flex justify-end group px-4">
                      <div class="max-w-[85%] relative">
                          <div class="bg-stone-100 text-stone-600 px-4 py-3 rounded-xl relative z-10">
                              <p class="leading-relaxed tracking-wide text-justify text-sm">{{ msg.content }}</p>
                          </div>
                          <!-- Subtext label -->
                          <div class="text-[0.6rem] text-stone-300 text-right mt-1 font-medium tracking-wider opacity-60">
                              信眾祈問
                          </div>
                      </div>
                  </div>

                  <!-- Assistant Message (Oracle Response - Prominent) -->
                  <div v-else-if="msg.role === 'assistant'" class="flex flex-col group w-full relative my-4">
                      <!-- Decorative Divider (Top) -->
                      <div class="flex items-center justify-center gap-4 opacity-20 my-4" v-if="index > 1">
                           <div class="h-px bg-red-900 w-8"></div>
                           <span class="text-red-900 text-[10px] font-serif">✤</span>
                           <div class="h-px bg-red-900 w-8"></div>
                      </div>

                       <div class="flex flex-col px-2 md:px-6">
                           <!-- Avatar Header -->
                           <div class="mb-3 shrink-0 flex items-center gap-3 opacity-100 ml-1">
                                <div class="w-10 h-10 border border-amber-500/20 rounded-full p-0.5 bg-amber-50/50 overflow-hidden shadow-sm">
                                    <img src="~/assets/images/fuder-icon.png" alt="Fuder" class="w-full h-full object-contain" @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />
                                </div>
                                <span class="text-sm font-bold text-red-900/90 font-serif tracking-widest">福德正神</span>
                           </div>

                           <div class="w-full relative">
                                <!-- Oracle Text Area -->
                                <div class="relative z-10 px-1">
                                    <MarkdownRenderer 
                                        :data="msg.content" 
                                        class="text-red-950/90 leading-loose tracking-wider prose prose-stone prose-lg md:prose-xl prose-p:font-serif prose-p:my-4 prose-headings:text-red-900 prose-headings:font-black prose-strong:text-red-800" 
                                    />
                                    <span v-if="isLoading && index === messages.length - 1" class="inline-block w-2 h-5 bg-red-900/60 animate-pulse ml-1 align-middle"></span>
                                </div>
                                <div class="mt-8 pt-4 border-t border-red-900/10">
                                    <p class="text-[10px] text-stone-400 font-serif text-center opacity-70">（此解籤結果僅供參考，請以誠心向福德正神擲筊確認為準。）</p>
                                </div>
                           </div>
                       </div>
                  </div>
              </template>
              <div ref="scrollAnchor"/>
          </div>

          <!-- Bottom Floating Action Button (Scroll Top) -->
          <div class="absolute bottom-20 right-4 z-30 pointer-events-none">
              <Transition name="fade">
                  <button
                      v-if="showScrollTop"
                      class="pointer-events-auto bg-stone-100/80 text-red-900 p-2 rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all flex items-center justify-center backdrop-blur-sm border border-stone-200"
                      @click="scrollToTop"
                      :title="t('fortune.interpret.scrollToTop')"
                  >
                      <Icon name="heroicons:arrow-up" class="w-4 h-4" />
                  </button>
              </Transition>
          </div>

          <!-- Input Area (Minimal) -->
          <div class="bg-[#FFFDF5] p-2 md:p-2 shrink-0 relative z-30">
              <div class="relative flex items-end gap-2 max-w-4xl mx-auto bg-stone-100/50 rounded-2xl p-1.5 border border-stone-200/50 focus-within:bg-white focus-within:shadow-sm focus-within:border-amber-200 transition-all">
                  <div class="flex-1 relative group">
                      <textarea
                        v-model="userInput"
                        rows="1"
                        :placeholder="t('fortune.interpret.inputPlaceholder')"
                        class="w-full px-3 bg-transparent border-none outline-none resize-none text-stone-800 placeholder-stone-400 leading-relaxed max-h-24 min-h-4 text-sm md:text-base focus:ring-0"
                        :disabled="isLoading"
                        @keydown.enter.prevent="(e) => !e.isComposing && handleUserSubmit()"
                        style="field-sizing: content;"
                      ></textarea>
                  </div>
                  <button
                    class="shrink-0 w-10 h-10 bg-red-900 text-amber-50 rounded-xl hover:bg-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm active:scale-95"
                    :disabled="isLoading || !userInput.trim()"
                    @click="handleUserSubmit"
                  >
                    <span v-if="isLoading" class="animate-spin text-sm">☯</span>
                    <Icon v-else name="mynaui:send-solid" class="w-4 h-4" />
                  </button>
              </div>
          </div>

      </div>

    </div>

    <!-- Session Expired Modal -->
    <FortuneSessionExpiredModal
      :show="showSessionExpiredModal"
      @confirm="handleSessionExpiredConfirm"
    />
</template>

<style scoped>
/* Scrollbar Styling */
.interpret-chat-area::-webkit-scrollbar {
  width: 6px;
}
.interpret-chat-area::-webkit-scrollbar-track {
  background: transparent;
}
.interpret-chat-area::-webkit-scrollbar-thumb {
  background: rgba(120, 53, 15, 0.2);
  border-radius: 10px;
}
.interpret-chat-area::-webkit-scrollbar-thumb:hover {
  background: rgba(120, 53, 15, 0.4);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}
</style>
