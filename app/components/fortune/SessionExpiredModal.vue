<script setup>
/**
 * Session 過期 Modal
 * 當使用者重整頁面導致流程中斷時顯示
 */
const { t } = useI18n()

defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm'])

const handleConfirm = () => {
  emit('confirm')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div 
        v-if="show" 
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="handleConfirm"
      >
        <!-- 背景遮罩 -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        
        <!-- Modal 內容 -->
        <div class="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-modal-in">
          <!-- 圖標 -->
          <div class="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
            <Icon name="heroicons:arrow-path" class="w-8 h-8 text-amber-600" mode="svg" />
          </div>
          
          <!-- 標題 -->
          <h3 class="text-lg font-bold text-gray-800 mb-2">{{ t('fortune.sessionExpired.title') }}</h3>
          
          <!-- 訊息 -->
          <p class="text-gray-600 mb-6">{{ t('fortune.sessionExpired.message') }}</p>
          
          <!-- 按鈕 -->
          <button 
            @click="handleConfirm"
            class="w-full px-6 py-2.5 bg-[#b8860b] text-white rounded-full hover:bg-[#8b4513] transition-colors"
          >
            {{ t('fortune.sessionExpired.confirm') }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.animate-modal-in {
  animation: modal-in 0.3s ease-out;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
