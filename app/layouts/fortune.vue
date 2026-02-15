<script setup lang="ts">
const { t, locale, setLocale } = useI18n()
const { isAuthenticated, isAuthEnabled, showAuthModal, checkAuth } = useFortuneAuth()

// Check auth on mount
onMounted(async () => {
  await checkAuth()
  if (!isAuthenticated.value && isAuthEnabled.value) {
    showAuthModal.value = true
  }
})

// 可用語言列表
const languages = [
  { code: 'zh-tw', label: '繁體中文' },
  { code: 'ja', label: '日本語' },
]

// 切換語言
const handleSwitchLanguage = (langCode: string) => {
  setLocale(langCode as any)
}

// 根據路由判斷是否需要隱藏 Footer (例如在解籤頁面)
const route = useRoute()
const showFooter = computed(() => route.path !== '/fortune/interpret')
</script>

<template>
  <div class="h-dvh bg-red-950 flex flex-col relative font-serif selection:bg-amber-500 selection:text-red-950 overflow-hidden">
    <!-- Texture Overlay -->
    <div class="fixed inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] z-0"></div>
    
    <FortuneAuthModal />
    
    <!-- Top Navigation Bar -->
    <div v-if="isAuthenticated || !isAuthEnabled" class="relative z-50">
      <div class="bg-red-900/95 backdrop-blur-md border-b-2 border-amber-600 shadow-lg px-4 py-3 flex items-center justify-between">
        
        <!-- Branding / Home Link -->
        <NuxtLink to="/fortune" class="flex items-center gap-2 group">
          <div class="w-8 h-8 md:w-10 md:h-10 rounded-full border border-amber-500/20 p-0.5 bg-amber-50/50 overflow-hidden flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
             <img src="~/assets/images/fuder-icon.png" alt="Fuder" class="w-full h-full object-contain" />
          </div>
          <div class="flex flex-col">
            <h1 class="text-amber-400 font-bold text-lg md:text-xl tracking-widest drop-shadow-sm leading-none">大林福德爺文財神廟</h1>
            <span class="text-amber-200/80 text-[10px] md:text-xs tracking-wider transform scale-90 origin-left">福德神威</span>
          </div>
        </NuxtLink>
        
        <!-- Navigation Links -->
        <div class="flex items-center gap-4">
            <NuxtLink 
              to="/about" 
              class="text-amber-200/80 hover:text-amber-400 text-sm font-bold tracking-wider transition-colors flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-amber-900/30"
              active-class="bg-amber-900/40 text-amber-400"
            >
              <Icon name="heroicons:information-circle" class="text-lg" />
              <span class="hidden md:inline">關於我們</span>
            </NuxtLink>
        </div>

        <!-- Language Switcher (Hidden for now) -->
        <!-- 
        <div class="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button 
                class="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-amber-400/80 hover:text-amber-300 transition-colors rounded-full hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30"
                title="切換語言"
              >
                <Icon name="fluent:translate-16-filled" class="text-xl md:text-2xl" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="min-w-[120px] bg-red-900 border-amber-600 text-amber-100">
              <DropdownMenuItem 
                v-for="lang in languages" 
                :key="lang.code"
                @click="handleSwitchLanguage(lang.code)"
                :class="[
                  'focus:bg-amber-600/30 focus:text-amber-200 cursor-pointer',
                  locale === lang.code ? 'bg-amber-600/20 text-amber-300' : ''
                ]"
              >
                {{ lang.label }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div> 
        -->
      </div>
      
      <!-- Decorative Sash -->
      <div class="h-1 w-full bg-linear-to-r from-red-800 via-amber-500 to-red-800 opacity-80"></div>
    </div>

    <!-- Main Content Area -->
    <div v-if="isAuthenticated || !isAuthEnabled" class="relative z-10 flex-1 flex flex-col min-h-0 animate-fade-in">
        <!-- Slot for page content -->
        <slot />
    </div>

  </div>
</template>

<style scoped>
/* Global Transition */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Custom Scrollbar for this section */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #451a03; 
}
::-webkit-scrollbar-thumb {
  background: #b45309; 
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #d97706; 
}
</style>
