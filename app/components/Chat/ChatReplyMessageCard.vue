<script setup>
// import { useChatStore } from '@/stores/chat.js'
import MDCRenderer from '@nuxtjs/mdc/runtime/components/MDCRenderer.vue'
import useMarkdownParser from '@/composables/useMarkdownParser'
import { messageReactionType } from '~~/config/chat'

const emit = defineEmits(['event'])

const props = defineProps({
  avatar: {
    type: String,
    default: null,
  },
  title: {
    type: String,
    default: '',
  },
  message: {
    type: Object,
    required: true,
  },
})

const dayjs = useDayjs()

const markdown = ref(null)
const parse = useMarkdownParser()
// const chatStore = useChatStore()

const referenceHandler = () => {
  // chatStore.setIsSidebarOpen(true)
  // chatStore.setReferences(props.message.references)
}

// onMounted(async () => {
//   markdown.value = await parse(props.message.data.content)
// })

// watch(
//   () => props.message.data.markdown,
//   async (nextValue) => {
//     if (nextValue) {
//       markdown.value = nextValue
//     } else {
//       markdown.value = null
//     }
//   },
//   { immediate: true },
// )

watch(
  () => props.message.data.content,
  async (nextValue) => {
    if (nextValue === '') {
      markdown.value = null
    } else {
      markdown.value = nextValue
    }
  },
  { immediate: true },
)

const reaction = ref(null)
watch(
  () => props.message.metadata?.reaction,
  async (nextValue) => {
    if (nextValue) {
      reaction.value = nextValue
    } else {
      reaction.value = null
    }
  },
  { immediate: true },
)

const copyTimer = ref(null)

const handleClickCopy = async () => {
  navigator.clipboard
    .writeText(props.message.data.content)
    .then(() => {
      if (copyTimer.value) {
        clearTimeout(copyTimer.value)
      }
      copyTimer.value = setTimeout(() => {
        copyTimer.value = null
      }, 3000)
    })
    .catch((err) => {
      console.error(err)
    })
}

const handleClickReaction = (reactionType) => {
  if (reaction.value === reactionType) {
    reaction.value = null
  } else {
    reaction.value = reactionType
  }

  $fetch(`/api/v1/chat/message/${props.message.id}/reaction`, {
    method: 'POST',
    body: {
      conversationId: props.message.conversationId,
      reaction: reactionType,
    },
  })
}

const parseFileExtension = (name) => {
  try {
    return String(name).split('.').pop()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return ''
  }
}

const previewFile = inject('previewFile')

const handleClickPreview = (item) => {
  const file = {
    id: item.objectId,
    name: item.name,
    extension: item.extension,
    url: `${useRequestURL().origin}/api/v1/drive/file/${item.objectId}/download`,
    originalInfo: {
      size: item.size,
    },
  }
  previewFile(file)
}

const previewQA = inject('previewQA')
const handleClickPreviewQA = (referenceItem) => {
  previewQA(referenceItem)
}

const pushEvent = (event) => {
  console.log('pushEvent')
  emit('event', event)
}

const chatStore = useChatStore()

const { locale } = useI18n()

const handleClickTTS = async () => {
  chatStore.playAudio({
    messageId: props.message.id,
    content: props.message.data.content,
    language: locale.value,
  })
}
</script>

<template>
  <div class="group relative flex flex-col">
    <!-- <div class="flex flex-row items-center">
      <div
        class="mr-2 inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white"
      >
        <img class="mx-2 size-6" :src="avatar ?? '~/assets/images/logo.svg'" >
      </div>
      <span class="font-semibold text-neutral-700"> {{ title }}</span>
    </div> -->
    <div class="flex w-fit max-w-full rounded-md bg-white px-5 py-3 text-[15px] shadow-sm">
      <template
        v-if="message.data.content === '' && message.generating === true"
      >
        <div class="flex items-center p-1">
          <Icon name="svg-spinners:gooey-balls-1" class="size-8 text-blue-400" mode="svg" />
        </div>
      </template>
      <template v-else>
        <div
          v-if="markdown !== null"
          class="max-w-full"
        >
          <MarkdownRenderer :data="markdown" />
          <!-- <MDCRenderer
            v-if="
              message.data.content !== '' &&
              Array.isArray(markdown?.body?.children) &&
              markdown.body.children.length > 0
            "
            class="prose max-w-full prose-inline-code:m-0 prose-inline-code:whitespace-break-spaces prose-inline-code:rounded-md prose-inline-code:bg-[rgba(175,184,193,0.2)] prose-inline-code:p-[.2em_.4em] prose-inline-code:text-[85%] prose-inline-code:font-medium prose-inline-code:text-inherit prose-inline-code:before:content-none prose-inline-code:after:content-none [&_pre]:scrollbar [&_pre]:scrollbar-track-gray-50 [&_pre]:scrollbar-thumb-gray-200"
            :body="markdown.body"
            :data="markdown.data"
          /> -->
          <div
            v-if="
              Array.isArray(message?.metadata?.layout?.footer?.items) &&
              message?.metadata.layout.footer.items.length > 0
            "
            class="my-2"
          >
            <div class="flex flex-col gap-1">
              <template v-for="item in message?.metadata.layout.footer.items" :key="item">
                <div
                  v-if="item.type === 'button' && item.action.type == 'message'"
                  class="cursor-pointer break-all rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200"
                  @click="
                    () =>
                      pushEvent({
                        name: 'clickQuestion',
                        value: item.action.text
                      })
                  "
                >
                  {{ item.action.label }}
                </div>
                <div
                  v-else-if="item.type === 'button' && item.action.type == 'reply'"
                  class="cursor-pointer break-all rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200"
                  @click="
                    () =>
                      pushEvent({
                        name: 'clickQuestion2',
                        value: item.action.text
                      })
                  "
                >
                  {{ item.action.label }}
                </div>
              </template>
            </div>
          </div>
          <template
            v-if="
              message.references &&
              Array.isArray(message.references.items) &&
              message.references.items.length > 0
            "
          >
            <div class="my-2 flex flex-row items-center">
              <span class="mr-2 flex-nowrap text-xs font-semibold text-gray-600">引用</span>
              <div class="h-px flex-1 bg-gray-300"/>
            </div>
            <div class="mb-2">
              <template v-for="referenceItem in message.references.items" :key="referenceItem">
                <div class="flex">
                  <div
                    v-if="referenceItem.type === 'document'"
                    class="flex cursor-pointer flex-row rounded bg-white px-3 py-2 text-sm font-medium hover:bg-gray-100"
                    variant="ghost"
                    @click="handleClickPreview(referenceItem)"
                  >
                    <template v-if="referenceItem.name">
                      <DriveExtensionIcon
                        :extension="parseFileExtension(referenceItem.name)"
                        size="16"
                        class="mr-1"
                      />
                      <span class="text-xs">{{ referenceItem.name }}</span>
                    </template>
                    <template v-else>
                      <DriveExtensionIcon size="16" class="mr-1" />
                      <span class="text-xs">{{ referenceItem.objectId }}</span>
                    </template>
                  </div>
                  <div
                    v-else-if="referenceItem.type === 'qa'"
                    class="flex cursor-pointer flex-row rounded bg-white px-3 py-2 text-sm font-medium hover:bg-gray-100"
                    variant="ghost"
                    @click="handleClickPreviewQA(referenceItem)"
                  >
                    <DriveExtensionIcon size="16" class="mr-1" />
                    <span class="text-xs">
                      {{ $t('chat.reply.footer.reference.qaSet.text') }}
                    </span>
                  </div>
                </div>
              </template>
            </div>
          </template>
        </div>
        <div v-else class="flex items-center p-1">
          <p  />
        </div>
      </template>
    </div>
    <div class="flex flex-row items-center mt-1">
      <span class="text-xs text-neutral-700 mr-2"> {{ title }}</span>
      <div v-if="message.createdAt" class="mr-1 text-xs text-gray-500">
        {{ dayjs(message.createdAt).format('HH:mm:ss') }}
      </div>
      <div
        v-if="
          chatStore.messageTTS.enable &&
          chatStore.messageTTS.messageId === message.id &&
          (chatStore.messageTTS.playing === true || chatStore.messageTTS.generating === true)
        "
        class="flex items-center mx-1 group/audio"
      >
        <div class="absolute text-blue-400 text-xs visible group-hover/audio:invisible">
          <Button
            variant="ghost"
            class="size-7 cursor-pointer p-1.5 transition-all"
            @click="null"
          >
            <Icon
              name="svg-spinners:bars-scale-middle"
            />
          </Button>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                class="size-7 scale-90 cursor-pointer p-1.5 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100"
                @click="chatStore.stopAudio()"
              >
                <Icon
                  name="heroicons:stop"
                  class="absolute text-gray-700 text-xs invisible group-hover/audio:visible"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {{ $t('chat.textInput.button.stop.text') }}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div v-if="message.generating !== true && message.type === 1">
        <div class="flex gap-0.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  class="size-7 scale-90 cursor-pointer p-1.5 opacity-0 transition-all group-hover:flex group-hover:scale-100 group-hover:opacity-100"
                  :class="
                    reaction === null
                      ? ['text-gray-700']
                      : reaction === messageReactionType.LIKE
                        ? ['text-green-600', 'scale-100', 'opacity-100']
                        : ['text-gray-300', 'hover:text-gray-700', 'hidden']
                  "
                  @click="handleClickReaction(messageReactionType.LIKE)"
                >
                  <Icon name="hugeicons:thumbs-up" class="size-[1.125rem]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {{ $t('chat.reply.action.like.tooltipContent.text') }}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  class="size-7 scale-90 cursor-pointer p-1.5 opacity-0 transition-all group-hover:flex group-hover:scale-100 group-hover:opacity-100"
                  :class="
                    reaction === null
                      ? ['text-gray-700']
                      : reaction === messageReactionType.DISLIKE
                        ? ['text-red-600', 'scale-100', 'opacity-100']
                        : ['text-gray-300', 'hover:text-gray-700', 'hidden']
                  "
                  @click="handleClickReaction(messageReactionType.DISLIKE)"
                >
                  <Icon name="hugeicons:thumbs-down" class="size-[1.125rem] text-inherit" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {{ $t('chat.reply.action.dislike.tooltipContent.text') }}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  class="size-7 scale-90 cursor-pointer p-1.5 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100"
                  @click="handleClickCopy"
                >
                  <Icon
                    :class="copyTimer ? 'visible' : 'collapse'"
                    name="hugeicons:tick-02"
                    class="absolute size-[1.125rem] text-gray-700"
                  />
                  <Icon
                    name="hugeicons:copy-01"
                    :class="copyTimer ? 'collapse' : 'visible'"
                    class="absolute size-[1.125rem] text-gray-700"
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {{ $t('chat.reply.action.copy.tooltipContent.text') }}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider
            v-if="chatStore.messageTTS.enable === true && chatStore.messageTTS.messageId !== message.id"
          >
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  class="size-7 scale-90 cursor-pointer p-1.5 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100"
                  @click="handleClickTTS"
                >
                  <Icon
                    name="heroicons:play"
                    class="absolute size-[1.125rem] text-gray-700"
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {{ $t('chat.reply.action.playAudio.tooltipContent.text') }}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  </div>
</template>
