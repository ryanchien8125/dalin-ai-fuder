<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
await navigateTo('/fortune', { replace: true })
</script>

<template>
  <div>
    <Toaster />
  </div>
</template>