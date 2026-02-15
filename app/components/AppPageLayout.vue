<template>
  <div class="flex-1 w-full flex flex-col relative bg-[#300909]">
    
    <header v-if="$slots.header" class="shrink-0 z-20">
      <slot name="header" />
    </header>

    <main class="flex-1 z-10 flex flex-col min-h-0">
      <slot />
    </main>

    <footer v-if="$slots.footer" class="shrink-0 z-20 pb-safe">
      <slot name="footer" />
    </footer>

    <div class="fixed inset-0 z-0 pointer-events-none">
      <slot name="background" />
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  display: none;
}
.custom-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>