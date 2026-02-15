import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    info: {
      id: null,
      name: '',
      description: '',
      resource: {
        items: [],
      },
      metadata: {
        channel: {
          web: {
            theme: { avatar: '/lamp-chat-avatar.svg', primary: '#3b82f6' },
            returnUrl: '',
          },
          api: {},
          line: {
            channelId: '',
            channelSecret: '',
            accessToken: '',
          },
          messenger: {
            pageId: '',
            accessToken: '',
          },
        },
        reference: {
          enable: false,
        },
      },
      internationalization: {
        i18n: {
          'zh-tw': {
            enable: true,
            prePrompt: '',
            title: '',
            answerConfirm: '',
            answerFallback: {
              enable: true,
              text: '',
              relevant: {
                enable: true,
                text: '',
              },
            },
            greeting: {
              enable: false,
              items: [],
            },
            suggestion: {
              enable: false,
              items: [],
            },
          },
        },
      },
    },
    list: [],
    preview: {
      greeting: '',
    },
  }),
  actions: {
    updateInfo(options) {
      this.info = {
        id: options.id,
        name: options.name,
        description: options.description,
        resource: options.resource,
        metadata: {
          ...options.metadata,
        },
        internationalization: {
          i18n: options.internationalization?.i18n ?? {},
        },
      }
    },
    async refreshList() {
      this.list = await $fetch('/api/v1/app/list', {
        headers: useRequestHeaders(['cookie']),
      }).then(response => response.data)
    },
  },
})
