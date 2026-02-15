<script setup lang="ts">
const { login, authError, showAuthModal } = useFortuneAuth()
const code = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  if (!code.value) return
  loading.value = true
  try {
    await login(code.value)
    code.value = ''
  } catch (e) {
    // handled in composable state
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div 
    v-if="showAuthModal" 
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
  >
    <div class="w-full max-w-sm rounded-2xl border border-[#b8860b]/50 bg-[#4a0e0e] p-8 shadow-[0_0_30px_rgba(184,134,11,0.2)] relative overflow-hidden transform transition-all">
      <!-- Decorative bg -->
      <div class="absolute -top-12 -right-12 size-32 rounded-full bg-[#ffd700]/10 blur-3xl" />
      <div class="absolute -bottom-12 -left-12 size-32 rounded-full bg-[#ffd700]/5 blur-3xl" />

      <div class="relative z-10">
        <div class="mb-6 flex justify-center">
          <div class="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffd700] to-[#b8860b] shadow-lg shadow-[#b8860b]/30">
            <Icon name="hugeicons:lock-key" class="size-8 text-[#4a0e0e]" mode="svg" />
          </div>
        </div>

        <h3 class="mb-2 text-center text-xl font-bold text-[#ffd700] tracking-wider">{{ $t('fortune.auth.title') }}</h3>
        <p class="mb-8 text-center text-sm text-[#ffd700]/70">
          {{ $t('fortune.auth.subtitle') }}
        </p>

        <div class="space-y-5">
          <div class="relative group">
            <input 
              v-model="code"
              type="password"
              :placeholder="$t('fortune.auth.placeholder')"
              class="w-full h-11 rounded-lg bg-[#2a0808]/50 border border-[#b8860b]/30 px-4 text-[#ffd700] placeholder-[#b8860b]/50 focus:outline-none focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700]/50 transition-all text-center tracking-widest text-lg"
              :disabled="loading"
              @keyup.enter="handleSubmit"
            />
          </div>

          <p v-if="authError" class="min-h-[1.5em] text-center text-xs font-bold text-[#ff4d4d] animate-bounce bg-red-900/20 py-1 rounded">
            {{ authError }}
          </p>
          <div v-else class="min-h-[1.5em]"></div>

          <button
            class="h-11 w-full rounded-lg bg-gradient-to-r from-[#b8860b] via-[#ffd700] to-[#b8860b] bg-[length:200%_100%] hover:bg-[100%_0] font-bold text-[#4a0e0e] shadow-lg transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center tracking-wide"
            :disabled="loading"
            @click="handleSubmit"
          >
            <Icon v-if="loading" name="svg-spinners:90-ring-with-bg" class="mr-2 size-5 text-[#4a0e0e]" />
            {{ loading ? $t('fortune.auth.submitting') : $t('fortune.auth.submit') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
