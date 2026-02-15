<script lang="ts" setup>
import { Toaster as Sonner, type ToasterProps } from 'vue-sonner'

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
    rich-colors
    position="bottom-right"
    :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
      '--error-bg': '#ef4444',
      '--error-text': '#ffffff',
      '--error-border': '#dc2626',
      '--warning-bg': '#ef4444',
      '--warning-text': '#ffffff',
      '--warning-border': '#dc2626',
    }"
  />
</template>
