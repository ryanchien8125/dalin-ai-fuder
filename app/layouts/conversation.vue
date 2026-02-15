<template>
  <SidebarProvider :default-open="false" style="--sidebar-width: 16rem; --sidebar-width-icon: 3.5rem;">
    <MainSidebar id="main-sidebar" />
    <SidebarInset class="h-[100dvh]">
      <header class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div class="flex items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem class="hidden md:block">
                <BreadcrumbLink>
                  {{ $t('navigation.conversation.label') }}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <!-- <BreadcrumbSeparator class="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
              </BreadcrumbItem> -->
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <slot />
    </SidebarInset>
  </SidebarProvider>
</template>
