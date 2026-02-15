<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css'

useHead({
  title: '大林福德爺文財神廟',
  link: [
    // 1. 預先連線以提升載入速度
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    // 2. 載入 Noto Serif TC 字體
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700;900&display=swap',
    },
  ],
})
const { locale, setLocale } = useI18n()
if (['zh-tw', 'ja'].includes(locale.value) === false) {
  setLocale('zh-tw')
}
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <Toaster />
    </ClientOnly>
  </div>
</template>
