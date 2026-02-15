<script setup lang="ts">
defineProps({
  message: {
    type: Object,
    required: true,
  },
})

const dayjs = useDayjs()
</script>

<template>
  <div class="flex flex-col items-end">
    <div
      class="w-fit whitespace-pre-wrap rounded-md px-5 py-3 text-[15px] shadow-sm"
      style="background-color: rgba(209, 213, 219, 0.7)"
    >
      {{ message.data.content }}
    </div>
    <div class="flex flex-row items-center h-6">
      <div v-if="message.status === 'error'" class="flex flex-row items-center gap-1 text-gray-500 hover:text-gray-700 cursor-pointer">
        <!-- <Icon name="heroicons:arrow-uturn-right-16-solid" class="size-3" mode="svg" /> -->
        <!-- <span class="text-xs">重傳</span> -->
        <span class="text-xs">傳送失敗</span>
      </div>
      <template v-else>
        <div v-if="message.createdAt" class="text-xs text-gray-500">
          {{ dayjs(message.createdAt).format('YYYY-MM-DD HH:mm:ss') }}
        </div>
        <Icon v-else name="svg-spinners:ring-resize" class="size-3 text-blue-400" mode="svg" />
      </template>
    </div>
  </div>
</template>

<style scoped></style>
