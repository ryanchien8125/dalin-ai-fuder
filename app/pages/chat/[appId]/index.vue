<script setup>
import { useMutationObserver, useTextareaAutosize } from '@vueuse/core'
definePageMeta({
  layout: false,
})

const ttsEnable = ref(false)

const route = useRoute()

// NOTE: API Base URL，透過後端 proxy 轉發至外部 API，避免 CORS 問題
const API_BASE = '/api/v1' // 本地使用 Proxy

const appLocaleCookie = useCookie('app_locale')
const appLocale = ref('zh-tw')
const { initSocket, socket, status: socketStatus, connect: socketConnect } = useChatSocket()

if (appLocaleCookie.value) {
  let nextAppLocale
  if (/^zh/i.test(appLocaleCookie.value)) {
    nextAppLocale = 'zh-tw'
  } else if (/^ja/i.test(appLocaleCookie.value)) {
    nextAppLocale = 'ja'
  } else if (/^ko/i.test(appLocaleCookie.value)) {
    nextAppLocale = 'ko'
  } else if (/^en/i.test(appLocaleCookie.value)) {
    nextAppLocale = 'en'
  }

  if (!nextAppLocale && import.meta.client) {
    const browserLanguage = navigator.language
    if (/^zh/i.test(browserLanguage)) {
      nextAppLocale = 'zh-tw'
    } else if (/^ja/i.test(browserLanguage)) {
      nextAppLocale = 'ja'
    } else if (/^ko/i.test(browserLanguage)) {
      nextAppLocale = 'ko'
    } else if (/^en/i.test(browserLanguage)) {
      nextAppLocale = 'en'
    }
  }

  appLocale.value = nextAppLocale
}

watch(appLocale, (nextAppLocale) => {
  appLocaleCookie.value = nextAppLocale
})

// --- App Auth 邏輯 ---
const appConfigStore = useAppConfigStore()
const showAuthModal = ref(false)
const authCode = ref('')
const authLoading = ref(false)
const authError = ref('')

const checkAuthRequirement = () => {
  if (route.query.auth === 'c') {
    // 檢查 App 獨立配置 Store 中是否已經有 Token
    if (!appConfigStore.getToken()) {
      showAuthModal.value = true
      return true
    }
  }
  return false
}

const handleAuthSubmit = async () => {
  if (!authCode.value || authLoading.value) return
  authLoading.value = true
  authError.value = ''

  try {
    const response = await $fetch(`${API_BASE}/app/${route.params.appId}/auth`, {
      method: 'POST',
      body: {
        code: authCode.value,
      },
    })

    if (response.ok) {
      // 驗證成功後，將 Token 存入 App 獨立配置 Store (自動持久化至自定義 LocalStorage 結構)
      appConfigStore.setToken(response.data.token)
      showAuthModal.value = false
      // 觸發對話流初始化
      initConversationFlow()
    } else {
      authError.value = response.message || '驗證失敗'
    }
  } catch (err) {
    authError.value = err.data?.message || '驗證過程中發生錯誤'
    // 依使用者要求：驗證失敗即刻清除 Token
    appConfigStore.removeToken()
  } finally {
    authLoading.value = false
  }
}

// 修改原有的 useFetch 為手動觸發或 lazy，以便在驗證後才加載
const fetchAppInfoTrigger = ref(0)
const { data: appInfo, refresh: refreshAppInfo, status: appInfoStatus } = useFetch(() => `${API_BASE}/app/${route.params.appId}/info?default_app_locale=${appLocale.value}`, {
  immediate: false,
  headers: computed(() => {
    const token = appConfigStore.getToken()
    const chatUserToken = appConfigStore.getChatUserToken()
    return {
      'x-app-auth-token': token || '',
      'x-app-chat-user-token': chatUserToken || '',
    }
  }),
  onResponse({ response }) {
    if (response._data?.data?.appChatUser?.token) {
      appConfigStore.setChatUserToken(response._data.data.appChatUser.token)
    }
  },
  transform: response => response.data,
  default: () => ({
    metadata: {
      channel: {
        web: {
          theme: {
            avatar: '/lamp-chat-avatar.svg',
            primary: '#3b82f6',
          },
        },
      },
    },
    resource: { items: [] },
  }),
})

const initConversationFlow = async () => {
  try {
    const result = await refreshAppInfo()
    if (result?.error && result?.error?.statusCode === 401) {
      // 若 Token 失效，清除之並彈出視窗
      appConfigStore.removeToken()
      showAuthModal.value = true
      return
    }
    initConversation()
  } catch (e) {
    console.error('Init flow failed', e)
  }
}

const initConversation = () => {
  if (!appInfo.value.id) {
    return
  }
  console.log('appInfo.value', appInfo.value)

  conversationId.value = appInfo.value.conversationId
  conversationStarters.value = appInfo.value.suggestion
  refresh()
  connect(appInfo.value)

  // // 設定可支援的語系
  appLocale.value = appInfo.value.language
  const appResourceLanguageSet = new Set()

  appInfo.value.resource.items.forEach((item) => {
    if (item.language) {
      appResourceLanguageSet.add(item.language)
    }
  })

  const nextAppSettingLocalSelectOptions = []
  appSettingLocalSelectDefaultOptions.forEach((item) => {
    if (appResourceLanguageSet.has(item.value)) {
      nextAppSettingLocalSelectOptions.push({ ...item })
    }
  })
  appSettingLocalSelectOptions.value = nextAppSettingLocalSelectOptions
}

const { loadLocaleMessages, t } = useI18n()

await loadLocaleMessages('en')
await loadLocaleMessages('ja')
await loadLocaleMessages('ko')
await loadLocaleMessages('zh-tw')

const appPrimaryColor = computed(() => {
  const primaryColor = appInfo.value.metadata?.channel?.web?.theme?.primary

  return primaryColor ? primaryColor : '#3b82f6'
})

const conversationId = ref(null)
const scrollContainer = ref(null)
const chatContainer = ref(null)

const scrollToBottom = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTo({
      top: chatContainer.value.scrollHeight,
      left: 0,
      behavior: 'smooth',
    })
  }
}

useMutationObserver(
  chatContainer,
  () => {
    scrollToBottom()
  },
  {
    childList: true,
    subtree: true,
    characterData: true,
  },
)

const { data, refresh: refreshMessage, status } = useLazyFetch(
  () => `${API_BASE}/chat/conversation/${conversationId.value}`,
  {
    immediate: false,
    server: false,
    transform: response => response.data,
    default: () => [],
  },
)

const messages = ref([])
const newMessages = ref([]) // 使用者送出，但尚未被伺服器接受的訊息
const chatStore = useChatStore()

watch(data, async (nextValue) => {
  if (Array.isArray(nextValue) === false) {
    return
  }
  const nextNewMessages = []
  for (let index = 0; index < nextValue.length; index++) {
    if (nextValue[index].data.content) {
      nextValue[index].data.markdown = nextValue[index].data.content
    }

    // 找到剛才使用者所發的訊息回覆
    if (latestUserMessageId.value && nextValue[index].parentId === latestUserMessageId.value) {
      chatStore.playAudio({
        messageId: nextValue[index].id,
        content: nextValue[index].data.content,
        language: appLocale.value,
      })
    }
  }
  messages.value = nextValue

  // 檢查等待發送的訊息
  for (let index = 0; index < newMessages.value.length; index++) {
    const newMessageItem = newMessages.value[index]
    console.log('newMessageItem', newMessageItem)
    const isFind = nextValue.findIndex(item => item.id === newMessageItem.message.id)
    if (isFind >= 0) {
      continue
    }

    const isFindR = nextValue.findIndex(item => item.type === 1 && item.parentId === newMessageItem.message.parentId)
    if (isFindR >= 0) {
      continue
    }

    nextNewMessages.push(newMessageItem)
  }

  newMessages.value = nextNewMessages
})

const conversationStarters = ref([])
const latestUserMessageId = ref(null)

const appSettingLocalSelectDefaultOptions = [
  {
    label: '🇺🇸 English',
    value: 'en',
  },
  {
    label: '🇹🇼 繁體中文',
    value: 'zh-tw',
  }, 
  {
      label: '🇯🇵 日本語',
      value: 'ja',
    },
    {
      label: '🇰🇷 한국어',
      value: 'ko',
    }
  ]
const appSettingLocalSelectOptions = ref([])

const refresh = () => {
  if (status.value !== 'pending' && conversationId.value) {
    refreshMessage()
  }
}

const isChatting = ref(false)

watch(messages, (nextValue) => {
  if (isChatting.value === false && Array.isArray(nextValue)) {
    isChatting.value = nextValue.some(item => item.type !== 0)
  }
  nextTick(() => {
    scrollToBottom()
  })
})

const { textarea, input: question } = useTextareaAutosize()

// watch(currentMessage, () => {
//   if (textarea && currentMessage.value.reply === undefined) {
//     nextTick(() => {
//       try {
//         textarea.value.focus()
//       } catch (e) {}
//     })
//   }
// })

const handleClickConversationStarterItem = (item) => {
  question.value = item.text
  handleSendMessage()
}

const messageRequestLoading = ref(false)

// Check if any message is currently generating or if an API request is in flight
const isGenerating = computed(() => {
  if (messageRequestLoading.value) return true
  // Check pending user messages for generating status
  return newMessages.value.some(m => m.reply?.generating === true)
})

const handleSendMessage = async () => {
  if (question.value === '' || isGenerating.value === true) {
    return
  }

  messageRequestLoading.value = true

  const questionContent = question.value
  const userSendMessage = reactive({
    id: `${Math.random()}`,
    requestId: null,
    loading: true,
    requestStatus: 'pending',
    streamStatus: 'idle',
    abort: false,
    message: {
      id: null,
      parentId: null,
      conversationId: null,
      type: 2,
      data: {
        content: questionContent, // markdown 語法
        useModel: 'taiwin',
      },
      metadata: {},
      status: 'pending',
    },
    reply: null,
    controller: new AbortController(),
  })
  // 使用者的問題
  newMessages.value.push(userSendMessage)

  question.value = ''

  nextTick(() => {
    scrollToBottom()
  })

  // const handleStreamMessageTrigger = (trigger) => {
  //   console.log('handleStreamMessageTrigger', trigger)
  //   trigger.items.forEach((item) => {
  //     if (item.name === 'change-language') {
  //       setLocale(item.data.language)
  //     }
  //   })
  // }

  const response = await $fetch(`${API_BASE}/chat/completion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'x-app-auth-token': appConfigStore.getToken() || '',
    },
    body: {
      appId: appInfo.value.id,
      conversationId: conversationId.value,
      content: questionContent,
      language: appLocale.value,
    },
    signal: userSendMessage.controller.signal,
    timeout: 30000,
  }).then((response) => {
    userSendMessage.requestId = response.data.requestId
    userSendMessage.message.id = response.data.messageId
    userSendMessage.message.createdAt = response.data.createdAt
    userSendMessage.requestStatus = 'success'

    latestUserMessageId.value = userSendMessage.messageId
    return response
  })
    .catch((e) => {
      console.log(e)
      if (e.statusCode === 401) {
        appConfigStore.removeToken()
        showAuthModal.value = true
      }
      userSendMessage.requestStatus = 'error'
      messageRequestLoading.value = false
    })

  if (!response) {
    messageRequestLoading.value = false
    return
  }

  console.log('userSendMessage.requestId', userSendMessage.requestId)

  userSendMessage.reply = {
    id: null,
    parentId: userSendMessage.message.id,
    conversationId: null,
    type: 1,
    data: {
      content: '',
    },
    generating: true,
    status: 'generating',
  }

  userSendMessage.streamStatus = 'pending'
  messageRequestLoading.value = false


  console.log('userSendMessage', userSendMessage)

  // Set 60s timeout for the entire generation process
  userSendMessage.timer = setTimeout(() => {
    if (userSendMessage.reply?.generating === true) {
      userSendMessage.reply.generating = false
      userSendMessage.reply.status = 'error'
      userSendMessage.reply.data.content += '\n\n(系統逾時：回應時間過長)'
      userSendMessage.streamStatus = 'error'
      // messageRequestLoading.value = false // No longer needed, computed handles it
      console.warn('Message generation timed out:', userSendMessage.requestId)
    }
  }, 60000) // 60 seconds

  return

  userSendMessage.streamStatus = 'pending'
  // should use await-for-of if not for https://bugs.chromium.org/p/chromium/issues/detail?id=929585
  const reader = stream.getReader()
  let done = false
  let value
  while (!done) {
    const chunk = await reader.read()
    done = chunk.done
    value += new TextDecoder().decode(chunk.value)

    const dataLines = value.split('\n')

    for (let index = 0; index < dataLines.length; index++) {
      const line = dataLines[index]
      const json = line.substring(6) // [data: ] = 6 Byte
      try {
        const jsonObj = JSON.parse(json)
        if (jsonObj.done === true) {
          done = true
          // userSendMessage.reply.data.content += jsonObj.content
        } else if (jsonObj.conversationId) {
          conversationId.value = jsonObj.conversationId
        }

        if (jsonObj.content !== undefined) {
          userSendMessage.reply.data.content += jsonObj.content
        }

        // 有拿到表示使用者發送的問題，已經確實寫入資料庫
        if (jsonObj.messageId) {
          userSendMessage.message.id = jsonObj.messageId
          userSendMessage.reply.parentId = jsonObj.messageId
          userSendMessage.message.createdAt = jsonObj.createdAt
          latestUserMessageId.value = jsonObj.messageId
        }

        if (jsonObj.trigger) {
          handleStreamMessageTrigger(jsonObj.trigger)
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        if (index + 1 === dataLines.length) {
          value = line
        }
      }
    }
  }

  userSendMessage.streamStatus = 'success'

  messageRequestLoading.value = false
}


const handleTextareaKeydown = (e) => {
  if (e.keyCode === 13 && !e.shiftKey) {
    e.preventDefault()
    handleSendMessage()
  }
}

const handleStop = () => {
  for (let index = 0; index < newMessages.value.length; index += 1) {
    const item = newMessages.value[index]

    try {
      item.controller.abort()
      newMessages.value[index].abort = true
      newMessages.value[index].message.status = 'error'
      if (newMessages.value[index].reply) {
        newMessages.value[index].reply.generating = false
        newMessages.value[index].reply.status = 'error'
      }
    } catch (e) {
      console.log(e)
    }
  }

  messageRequestLoading.value = false

  // refresh()
}

const preview = ref({
  open: false,
})

const previewFile = (file) => {
  preview.value = {
    open: true,
    id: file.id,
    name: file.name,
    extension: file.extension,
    url: `${API_BASE}/drive/file/${file.id}/download`,
    size: file.originalInfo.size,
  }
}

provide('previewFile', previewFile)

const previewQADialog = ref({
  open: false,
})

const previewQA = (item) => {
  previewQADialog.value = {
    open: true,
    data: {
      question: item.question,
      answer: item.answer,
    },
  }
}

provide('previewQA', previewQA)

const handleChatReplyMessageCardEvent = (event) => {
  console.log(event)

  if (event.name === 'clickQuestion') {
    question.value = event.value
    handleSendMessage()
  }
}

const handleClickNavigationMenuItem = (name) => {
  if (name === 'reload') {
    // TODO: 不要這麼暴力
    window.location.reload()
  } else if (name === 'change-language') {
    question.value = t('chat.navigation.change_language', {}, { locale: appLocale })
    handleSendMessage()
  } else if (name === 'information') {
    question.value = t('chat.navigation.user_guide', {}, { locale: appLocale })
    handleSendMessage()
  } else if (name === 'business-introduction') {
    question.value = t('chat.navigation.about_us', {}, { locale: appLocale })
    handleSendMessage()
  }
}

const connect = async (options) => {
  if (!options.id) {
    return
  }

  initSocket({
    getToken: () => {
      // 回傳 Promise<string>
      return $fetch(`${API_BASE}/service/socket/switch-token`, {
        method: 'POST',
        headers: {
          'x-app-auth-token': appConfigStore.getToken() || '',
          'x-app-chat-user-token': appConfigStore.getChatUserToken() || '',
        },
        body: {
          conversationId: conversationId.value,
        },
      }).then(res => res.token)
    },
  })

  socket.value.on('connect', () => {
    console.log('Socket Connected, joining conversation:', conversationId.value)
  })

  socket.value.on('message', (msg) => {
    console.log(msg)
    const payload = msg.data ?? {}
    const findMessage = newMessages.value.find(item => item.requestId === msg.requestId)

    if (msg.event === 'message:ack') {
      // if (payload.messageId && findMessage) {
      //   findMessage.message.id = payload.messageId
      //   findMessage.reply.parentId = payload.messageId
      //   findMessage.message.createdAt = payload.createdAt
      //   latestUserMessageId.value = payload.messageId
      // }
    } else if (msg.event === 'message:chunk' && findMessage) {
      if (payload.content) {
        findMessage.reply.data.content += payload.content
      } else if (payload.done === true) {
        if (findMessage.timer) clearTimeout(findMessage.timer)
        findMessage.reply.generating = false
        refresh()
      }
    } else if (msg.event === 'done' && findMessage) {
       if (findMessage.timer) clearTimeout(findMessage.timer)
       findMessage.reply.generating = false
       findMessage.streamStatus = 'success'
       refresh()
    } else if (msg.event === 'refresh') {
      refresh()
    }
  })

  socket.value.on('reconnect', () => {
    console.log('Socket reconnected')
  })
}

const handleLogout = () => {
  appConfigStore.removeToken()
  window.location.reload()
}

onMounted(() => {
  if (checkAuthRequirement()) {
    // 需要驗證
  } else {
    // 不需要驗證可以直接開始初始化對話視窗
    initConversationFlow()
  }
})
</script>

<template>
  <div class="flex h-dvh flex-col" :style="`--app-primary-color: ${appPrimaryColor}`">
    <header class="flex h-[var(--header-hight)] items-center justify-between gap-1 border-b px-4" :style="{
      'background-color': appPrimaryColor
    }">
      <div>
        <div class="flex flex-row items-center">
          <div
            class="mr-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white overflow-hidden">
            <label for="file-upload"
              :class="appInfo.metadata?.channel?.web?.theme?.avatar === '/lamp-chat-avatar.svg' ? ['size-10'] : ['size-10']"
              class="relative cursor-pointer">
              <img class="size-full object-cover object-center absolute"
                :src="appInfo.metadata?.channel?.web?.theme?.avatar ?? '~/assets/images/logo.svg'">
            </label>
          </div>
          <div class="flex flex-col">
            <span v-if="appInfo.internationalization?.i18n?.[appLocale]?.title ?? appInfo.name"
              class="text-lg font-semibold text-white">
              {{ appInfo.internationalization?.i18n?.[appLocale]?.title ?? appInfo.name }}
            </span>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-1">
        <DropdownMenu v-if="appConfigStore.getToken()">
          <DropdownMenuTrigger>
            <div
              class="flex size-10 cursor-pointer items-center justify-center rounded-full text-white hover:bg-gray-50/10">
              <Icon name="ion:person-circle-outline" class="text-2xl" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem class="flex items-center gap-2" @click="handleLogout">
              <Icon name="ion:log-out-outline" class="size-4" />
              {{ $t('userAvatarMenu.logout', {}, { locale: appLocale }) }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div
              class="flex size-10 cursor-pointer items-center justify-center rounded-full text-white hover:bg-gray-50/10">
              <Icon name="ion:menu" class="text-2xl" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem class="flex items-center gap-2" @click="handleClickNavigationMenuItem('reload')">
              <Icon name="ion:reload" class="size-4" />
              {{ $t('chat.navigation.restart_conversation', {}, { locale: appLocale }) }}
            </DropdownMenuItem>
            <!-- <DropdownMenuItem
              class="flex items-center gap-2"
              @click="handleClickNavigationMenuItem('change-language')"
            >
              <Icon name="ion:earth" class="size-4" />
              {{ $t('chat.navigation.change_language', {}, { locale: appLocale }) }}
            </DropdownMenuItem> -->
            <DropdownMenuSub>
              <DropdownMenuSubTrigger class="flex items-center gap-2">
                <Icon name="ion:earth" class="size-4" />
                {{ $t('chat.navigation.change_language', {}, { locale: appLocale }) }}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem v-for="item in appSettingLocalSelectOptions" :key="item.value"
                    class="flex items-center gap-2" @click="appLocale = item.value">
                    {{ item.label }}
                    <Icon v-if="appLocale === item.value" name="ion:checkmark-round" class="size-4" :style="{
                      color: appPrimaryColor
                    }" />
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <!-- <DropdownMenuItem
              class="flex items-center gap-2"
              @click="handleClickNavigationMenuItem('information')"
            >
              <Icon name="ion:information" class="size-4" />
              {{ $t('chat.navigation.user_guide', {}, { locale: appLocale }) }}
            </DropdownMenuItem> -->
            <!-- <DropdownMenuItem
              class="flex items-center gap-2"
              @click="handleClickNavigationMenuItem('business-introduction')"
            >
              <Icon name="ion:business" class="size-4" />
              {{ $t('chat.navigation.about_us', {}, { locale: appLocale }) }}
            </DropdownMenuItem> -->
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu v-if="ttsEnable">
          <DropdownMenuTrigger>
            <div
              class="flex size-10 cursor-pointer items-center justify-center rounded-full text-white hover:bg-gray-50/10"
              @click="chatStore.toggleMessageTTSEnable">
              <Icon
                :name="chatStore.messageTTS.enable ? 'heroicons:speaker-wave-16-solid' : 'heroicons:speaker-x-mark-16-solid'"
                class="text-2xl" />
            </div>
          </DropdownMenuTrigger>
        </DropdownMenu>
        <!-- <DropdownMenu>
          <DropdownMenuTrigger>
            <div
              class="flex size-10 cursor-pointer items-center justify-center rounded-full text-white hover:bg-gray-50/10"
            >
              <Icon name="ion:language" class="text-2xl" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem class="flex items-center gap-2" @click="setLocale('en')">
              🇺🇸 English
              <Icon
                v-if="locale === 'en'"
                name="ion:checkmark-round"
                class="size-4"
                :style="{
                  color: appPrimaryColor
                }"
              />
            </DropdownMenuItem>
            <DropdownMenuItem class="flex items-center gap-2" @click="setLocale('zh-tw')">
              🇹🇼 繁體中文
              <Icon
                v-if="locale === 'zh-tw'"
                name="ion:checkmark-round"
                class="size-4"
                :style="{
                  color: appPrimaryColor
                }"
              />
            </DropdownMenuItem>
            <DropdownMenuItem class="flex items-center gap-2" @click="setLocale('ja')">
              🇯🇵 日本語
              <Icon
                v-if="locale === 'ja'"
                name="ion:checkmark-round"
                class="size-4"
                :style="{
                  color: appPrimaryColor
                }"
              />
            </DropdownMenuItem>

            <DropdownMenuItem class="flex items-center gap-2" @click="setLocale('ko')">
              🇰🇷 한국어
              <Icon
                v-if="locale === 'ko'"
                name="ion:checkmark-round"
                class="size-4"
                :style="{
                  color: appPrimaryColor
                }"
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> -->
        <!-- <div
          class="flex size-10 cursor-pointer items-center justify-center rounded-full text-white hover:bg-gray-50/10"
        >
          <Icon name="ion:close" class="size-6" />
        </div> -->
      </div>
    </header>
    <div class="flex h-[calc(100dvh-var(--header-hight))] flex-col bg-gray-50 px-4">
      
      <!-- Socket Status Banner -->
      <div v-if="socketStatus === 'CONNECTING'" class="flex w-full items-center justify-center bg-yellow-100 py-1 text-center text-xs text-yellow-700">
        <Icon name="svg-spinners:ring-resize" class="mr-1 size-3" />
        連線中...
      </div>
      <div v-if="socketStatus === 'DISCONNECTED' || socketStatus === 'FAILED'" class="flex w-full items-center justify-center bg-red-100 py-1 text-center text-xs text-red-700">
        <Icon name="ion:alert-circled" class="mr-1 size-3" />
        <span class="mr-2">網路已斷線</span>
        <button
          class="rounded border border-red-200 bg-white px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-50"
          @click="socketConnect"
        >
          重新連線
        </button>
      </div>

      <div ref="scrollContainer"
        class="flex flex-1 overflow-y-auto pr-2 pt-4 scrollbar scrollbar-track-gray-50 scrollbar-thumb-gray-200">
        <div id="chatContainer" ref="chatContainer" class="flex w-full flex-col gap-5">
          <template v-if="conversationId === null">
            <div class="flex h-full flex-col items-center justify-center">
            </div>
          </template>
          <template v-else>
            <template v-for="message in messages" :key="message.id">
              <ChatReplyMessageCard v-if="message.type === 0 || message.type === 1"
                :avatar="appInfo.metadata?.channel?.web?.theme?.avatar"
                :title="appInfo.internationalization?.i18n?.[appLocale]?.title ?? appInfo.name" :message="message"
                @event="handleChatReplyMessageCardEvent" />
              <ChatSendMessageCard v-else-if="message.type === 2" :message="message" />
            </template>

            <!-- 使用者佇列等待的訊息 -->
            <template v-for="item in newMessages" :key="item.id">
              <template v-if="item.message.type === 2">
                <!-- {{item}}
                requestStatus: {{ item.requestStatus }}, streamStatus: {{ item.streamStatus }} -->
                <ChatSendMessageCard :message="item.message" />
              </template>
              <template v-if="item.reply && (item.reply.type === 0 || item.reply.type === 1)">
                <ChatReplyMessageCard :avatar="appInfo.metadata?.channel?.web?.theme?.avatar"
                  :title="appInfo.internationalization?.i18n?.[appLocale]?.title ?? appInfo.name" :message="item.reply"
                  @event="handleChatReplyMessageCardEvent" />
              </template>
            </template>
          </template>
          <!-- <div v-if="isChatting === false" class="flex flex-1 flex-col items-end justify-end gap-2">
            <template v-for="conversation in conversationStarters" :key="conversation.id">
              <div
                class="cursor-pointer rounded-full border bg-white px-4 py-2 hover:bg-gray-50"
                @click="handleClickConversationStarterItem(conversation)"
              >
                <span class="text-[15px] text-neutral-600">{{ conversation.text }}</span>
              </div>
            </template>
          </div> -->
        </div>
      </div>

      <div v-if="conversationId" class="mt-4 flex w-full">
        <div class="relative flex w-full items-center rounded-3xl border-2 bg-white py-0.5">
          <div class="w-full pl-4 pr-12">
            <textarea ref="textarea" v-model="question" :disabled="isGenerating" :placeholder="isGenerating
              ? $t('chat.text_input_placeholder.replying', {}, { locale: appLocale })
              : $t('chat.text_input_placeholder.default', {}, { locale: appLocale })
              "
              class="max-h-28 w-full resize-none bg-white px-1 py-2 align-middle text-[1rem] text-neutral-700 scrollbar scrollbar-track-gray-50/0 scrollbar-thumb-gray-200 focus:outline-none"
              @keydown="handleTextareaKeydown" />
          </div>
          <div class="pointer-events-none absolute z-0 w-full">
            <div class="flex size-full items-center justify-end px-2">
              <div class="group relative">
                <div class="absolute inset-0 bg-white opacity-0 transition-opacity group-hover:opacity-10" />
                <template v-if="isGenerating">
                  <Button type="submit" class="pointer-events-auto z-10 size-8 rounded-full p-0" :style="{
                    'background-color': appPrimaryColor
                  }" @click="handleStop">
                    <Icon name="fluent:stop-16-filled" class="size-4" />
                  </Button>
                </template>
                <template v-else-if="question !== ''">
                  <Button type="submit" class="pointer-events-auto z-10 size-8 rounded-full p-0" :style="{
                    'background-color': appPrimaryColor
                  }" @click="handleSendMessage">
                    <Icon name="fluent:arrow-up-12-filled" class="size-4" />
                  </Button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="my-2 flex flex-row items-center justify-center text-xs text-gray-400">
        <!-- Powered by
        <img class="ml-2 mr-1 size-4" src="~/assets/images/logo.svg" />
        <span class="font-medium text-gray-600">Lamp Chatbot</span> -->
      </div>
      <!-- <DrivePreviewFileDialog v-model:open="preview.open" :file-info="preview" />
      <DrivePreviewQADialog v-model:open="previewQADialog.open" :data="previewQADialog.data" /> -->
      <!-- Code 驗證 Modal -->
      <div v-if="showAuthModal"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
        <div
          class="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-2xl transition-all scale-in-center overflow-hidden relative">
          <!-- 裝飾性背景 -->
          <div class="absolute -top-12 -right-12 size-32 rounded-full bg-blue-50/50 blur-3xl" />

          <div class="relative z-10">
            <div class="mb-6 flex justify-center">
              <div class="flex size-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
                <Icon name="hugeicons:lock-key" class="size-7 text-white" />
              </div>
            </div>

            <h3 class="mb-2 text-center text-xl font-bold text-slate-900">身分驗證</h3>
            <p class="mb-8 text-center text-sm text-slate-500">請輸入此應用程式的存取代碼以開啟聊天室。</p>

            <div class="space-y-4">
              <div class="space-y-2">
                <div class="relative">
                  <Input v-model="authCode" type="text" placeholder="請輸入代碼"
                    class="h-12 border-slate-200 bg-slate-50/50 px-4 text-center text-xl font-bold tracking-[0.5em] transition-all focus-visible:ring-2 focus-visible:ring-blue-600"
                    :disabled="authLoading" @keyup.enter="handleAuthSubmit" />
                </div>
                <p v-if="authError" class="text-center text-xs font-semibold text-red-500 animate-bounce">{{ authError
                }}</p>
              </div>

              <Button
                class="h-12 w-full bg-blue-600 font-bold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-95 disabled:opacity-50"
                :disabled="authLoading" @click="handleAuthSubmit">
                <template v-if="authLoading">
                  <Icon name="svg-spinners:90-ring-with-bg" class="mr-2 size-4" />
                  驗證中...
                </template>
                <template v-else>
                  確認進入
                </template>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
a {
  color: var(--app-primary-color);
}
</style>
