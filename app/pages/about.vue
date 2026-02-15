<script setup lang="ts">
const { t } = useI18n()
const form = ref({
  name: '',
  phone: '',
  email: '',
  message: ''
})
const isSubmitting = ref(false)
const submitStatus = ref<'idle' | 'success' | 'error'>('idle')

const handleSubmit = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  submitStatus.value = 'idle'
  
  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: form.value
    })
    
    submitStatus.value = 'success'
    form.value = {
      name: '',
      phone: '',
      email: '',
      message: ''
    }
  } catch (error) {
    console.error(error)
    submitStatus.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}

definePageMeta({
  layout: 'fortune'
})
</script>

<template>
  <div class="w-full h-full flex flex-col relative overflow-hidden animate-fade-in bg-stone-900 border-t-4 border-amber-600">
    
    <!-- Background Texture -->
    <div class="absolute inset-0 z-0">
        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20"></div>
        <div class="absolute inset-0 bg-linear-to-b from-stone-900 via-stone-900/95 to-red-950/90"></div>
    </div>

    <div class="relative z-10 w-full h-full overflow-y-auto custom-scrollbar">
       <div class="w-full max-w-4xl mx-auto py-8 md:py-12 px-4 md:px-8 space-y-12">
          
          <!-- Header -->
          <div class="text-center space-y-4">
               <h1 class="text-3xl md:text-5xl font-black text-amber-400 font-serif tracking-widest drop-shadow-md">關於我們</h1>
               <div class="w-24 h-1 bg-amber-600 mx-auto rounded-full"></div>
               <p class="text-stone-400 text-sm md:text-base tracking-wider max-w-2xl mx-auto leading-relaxed">
                   大林福德爺文財神庇佑信眾平安順遂，財源廣進。
               </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              
              <!-- Temple Info -->
              <div class="space-y-8 animate-slide-up" style="animation-delay: 0.1s;">
                  <div class="bg-stone-800/50 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-amber-500/20 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-colors">
                      <div class="absolute top-0 right-0 p-4 opacity-10">
                          <Icon name="game-icons:temple-gate" class="text-9xl text-amber-500" />
                      </div>
                      
                      <h2 class="text-2xl font-bold text-amber-500 mb-6 flex items-center gap-2 font-serif">
                          <Icon name="heroicons:building-library" /> 廟宇資訊
                      </h2>
                      
                      <ul class="space-y-6 text-stone-300">
                          <li class="flex items-start gap-4">
                              <div class="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center shrink-0 border border-amber-500/30">
                                  <Icon name="heroicons:map-pin" class="text-amber-400 text-xl" />
                              </div>
                              <div>
                                  <span class="block text-xs text-stone-500 mb-1">廟宇地址</span>
                                  <span class="text-lg font-bold text-amber-100">嘉義縣大林鎮中興路 309 號</span>
                                  <a href="https://maps.app.goo.gl/PNktb3am288Q8Ddw8" target="_blank" class="block text-xs text-amber-600/80 hover:text-amber-500 mt-1 underline">在 Google 地圖上查看</a>
                              </div>
                          </li>
                           <li class="flex items-start gap-4">
                              <div class="w-10 h-10 rounded-full bg-red-900/50 flex items-center justify-center shrink-0 border border-amber-500/30">
                                  <Icon name="heroicons:phone" class="text-amber-400 text-xl" />
                              </div>
                              <div>
                                  <span class="block text-xs text-stone-500 mb-1">聯絡電話</span>
                                  <span class="text-lg font-bold text-amber-100">05-265-1177</span>
                              </div>
                          </li>
                      </ul>
                  </div>

                  <!-- Google Maps Embed -->
                  <div class="rounded-2xl overflow-hidden border border-amber-900/30 shadow-lg h-64 md:h-80 bg-stone-800 relative group">
                      <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d29248.57150006468!2d120.42551357431641!3d23.601770800000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x346ebf0074e124ab%3A0xa1713e748aeca292!2z5aSn5p6X56aP5b6354i6!5e0!3m2!1szh-TW!2stw!4v1771146306664!5m2!1szh-TW!2stw" 
                        width="100%" 
                        height="100%" 
                        style="border:0;" 
                        allowfullscreen 
                        loading="lazy" 
                        referrerpolicy="no-referrer-when-downgrade"
                        class="absolute inset-0 w-full h-full opacity-90 group-hover:opacity-100 transition-opacity"
                      ></iframe>
                  </div>
              </div>

               <!-- Contact Form -->
              <div class="animate-slide-up" style="animation-delay: 0.2s;">
                  <div class="bg-stone-800/80 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-amber-500/20 shadow-xl relative">
                      <h2 class="text-2xl font-bold text-amber-500 mb-2 flex items-center gap-2 font-serif">
                          <Icon name="heroicons:envelope" /> 聯絡我們
                      </h2>
                      <p class="text-stone-400 text-sm mb-6">歡迎填寫表單與我們聯繫，我們將盡快回覆您。</p>
                      
                      <form @submit.prevent="handleSubmit" class="space-y-4">
                          <!-- Name -->
                          <div class="space-y-1">
                              <label class="text-xs font-bold text-stone-400 ml-1">姓名 <span class="text-red-500">*</span></label>
                              <input 
                                v-model="form.name"
                                type="text" 
                                required
                                placeholder="請輸入您的尊姓大名"
                                class="w-full bg-stone-900/50 border border-stone-700 rounded-xl px-4 py-3 text-amber-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                              />
                          </div>

                          <!-- Phone -->
                          <div class="space-y-1">
                              <label class="text-xs font-bold text-stone-400 ml-1">電話</label>
                              <input 
                                v-model="form.phone"
                                type="tel" 
                                placeholder="請輸入聯絡電話"
                                class="w-full bg-stone-900/50 border border-stone-700 rounded-xl px-4 py-3 text-amber-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                              />
                          </div>
                          
                           <!-- Email -->
                          <div class="space-y-1">
                              <label class="text-xs font-bold text-stone-400 ml-1">信箱</label>
                              <input 
                                v-model="form.email"
                                type="email" 
                                placeholder="example@email.com"
                                class="w-full bg-stone-900/50 border border-stone-700 rounded-xl px-4 py-3 text-amber-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                              />
                          </div>

                           <!-- Message -->
                          <div class="space-y-1">
                              <label class="text-xs font-bold text-stone-400 ml-1">想說的話 <span class="text-red-500">*</span></label>
                              <textarea 
                                v-model="form.message"
                                required
                                rows="4"
                                placeholder="請寫下您想詢問的事項或建議..."
                                class="w-full bg-stone-900/50 border border-stone-700 rounded-xl px-4 py-3 text-amber-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all resize-none"
                              ></textarea>
                          </div>

                          <!-- Submit Button -->
                          <button 
                            type="submit" 
                            :disabled="isSubmitting"
                            class="w-full bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold py-3.5 rounded-xl shadow-lg border border-amber-500/30 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed group"
                          >
                             <span v-if="isSubmitting">傳送中...</span>
                             <span v-else>送出表單</span>
                             <Icon v-if="!isSubmitting" name="heroicons:paper-airplane" class="group-hover:translate-x-1 transition-transform" />
                          </button>
                      </form>

                      <!-- Status Messages -->
                      <div v-if="submitStatus === 'success'" class="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-xl text-green-400 text-center text-sm font-bold animate-fade-in flex items-center justify-center gap-2">
                          <Icon name="heroicons:check-circle" class="text-xl" />
                          感謝您的訊息，我們已收到！
                      </div>
                      <div v-if="submitStatus === 'error'" class="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-center text-sm font-bold animate-fade-in flex items-center justify-center gap-2">
                          <Icon name="heroicons:exclamation-triangle" class="text-xl" />
                          發送失敗，請稍後再試。
                      </div>

                  </div>
              </div>

          </div>
       </div>

       <!-- Footer Info -->
        <div class="border-t border-amber-900/30 py-6 text-center text-stone-500 text-xs">
            <p>大林福德爺文財神廟</p>
        </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(217, 119, 6, 0.3);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(217, 119, 6, 0.5);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-slide-up {
  animation: slideUp 0.6s ease-out forwards;
  opacity: 0;
}
</style>
