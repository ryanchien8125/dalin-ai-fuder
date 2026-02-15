<script setup lang="ts">
import type { BulletLegendItemInterface } from '@unovis/ts'
import { buttonVariants } from '@/components/ui/button'
import { BulletLegend } from '@unovis/ts'
import { VisBulletLegend } from '@unovis/vue'
import { nextTick, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ items: BulletLegendItemInterface[] }>(), {
  items: () => [],
})

const emits = defineEmits<{
  'legendItemClick': [d: BulletLegendItemInterface, i: number]
  'update:items': [payload: BulletLegendItemInterface[]]
}>()

const elRef = ref<HTMLElement>()

onMounted(() => {
  const selector = `.${BulletLegend.selectors.item}`
  nextTick(() => {
    const elements = elRef.value?.querySelectorAll(selector)
    // buttonVariants({ variant: 'ghost', size: 'xs' }).split(' ')
    const classes = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'.split(' ')
    elements?.forEach(el => el.classList.add(...classes, '!inline-flex', '!mr-2'))
  })
})

function onLegendItemClick(d: BulletLegendItemInterface, i: number) {
  emits('legendItemClick', d, i)

  const item = props.items[i]

  if (item === undefined) {
    return
  }

  const isBulletActive = !item.inactive

  const isFilterApplied = props.items.some(i => i.inactive)
  if (isFilterApplied && isBulletActive) {
    // reset filter
    emits(
      'update:items',
      props.items.map(item => ({ ...item, inactive: false })),
    )
  } else {
    // apply selection, set other item as inactive
    emits(
      'update:items',
      props.items.map(item =>
        item.name === d.name ? { ...d, inactive: false } : { ...item, inactive: true },
      ),
    )
  }
}
</script>

<template>
  <div ref="elRef" class="w-max">
    <VisBulletLegend :items="items" :on-legend-item-click="onLegendItemClick" />
  </div>
</template>
