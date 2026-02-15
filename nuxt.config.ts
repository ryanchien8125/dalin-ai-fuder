// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  app: {
    head: {
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      meta: [
        { name: 'theme-color', content: '#300909' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
      ]
    }
  },

  build: {
    transpile: ['xlsx'],
  },
  devServer: {
    host: '0.0.0.0', 
  },
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4,
  },

  typescript: {
    typeCheck: true,
  },

  imports: {
    dirs: ['./stores'],
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    'dayjs-nuxt',
    '@nuxtjs/mdc',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/i18n',
  ],

  runtimeConfig: {
    webSite: {
      url: 'https://example.com',
    },
    rabbitmq: {
      host: 'rabbitmq.host',
      port: 'rabbitmq.port',
      user: 'rabbitmq.user',
      password: 'rabbitmq.password',
    },
    pg: {
      host: 'pg.host',
      port: 'pg.port',
      database: 'pg.database',
      user: 'pg.user',
      password: 'pg.password',
    },
    jwt: {
      signaturePrivateKey: 'signaturePrivateKey',
      signaturePublicKey: 'signaturePublicKey',
    },
    google: {
      oauth: {
        clientSecret: '這邊放上你的 Google Client Secret',
      },
    },
    drive: {
      upload: {
        baseDir: './upload',
      },
    },
    workflow: {
      apiKey: '',
    },
    generativeAi: {
      apiBase: '',
      apiToken: '',
      model: '',
    },
    fireCrawl: {
      apiKey: '',
      webhook: {
        host: '',
      },
    },
    socket: {
      server: {
        host: 'socket.server.host',
      },
      valkey: {
        host: 'socket.valkey.host',
        port: 'socket.valkey.port',
      },
      jwt: {
        signaturePrivateKey: 'signaturePrivateKey',
        signaturePublicKey: 'signaturePublicKey',
      }
    },
    fortune: {
      authCode: '8888',
      jwtSecret: 'fortune-secret-key-change-me',
      expiresIn: '3m',
    },
    public: {
      apiBase: '/api',
      google: {
        oauth: {
          clientId: '這邊放上你的 Google Client ID',
          redirectUri: 'http://localhost:3000',
        },
      },
      motion: {
        directives: {
          'pop-bottom': {
            initial: {
              scale: 0,
              opacity: 0,
              y: 100,
            },
            visible: {
              scale: 1,
              opacity: 1,
              y: 0,
            },
          },
        },
      },
      fortune: {
        authEnabled: false,
      },
    },
  },
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './app/components/ui',
  },
  dayjs: {
    locales: ['zh-tw'],
    plugins: ['relativeTime', 'utc', 'timezone'],
    defaultLocale: 'zh-tw',
    defaultTimezone: 'Asia/Taipei',
  },
  i18n: {
    restructureDir: 'i18n',
    langDir: 'locales',
    locales: [
      {
        code: 'en',
        language: 'en-US',
        file: 'en.json',
      },
      {
        code: 'zh-tw',
        language: 'zh-TW',
        file: 'zh-tw.json',
      },
      {
        code: 'ja',
        language: 'ja',
        file: 'ja.json',
      },
      {
        code: 'ko',
        language: 'ko',
        file: 'ko.json',
      },
    ],
    defaultLocale: 'zh-tw',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
  },
  vite: {
    server: {
      allowedHosts: ['.ngrok-free.app'],
    },
  },
  icon: {
    customCollections: [
      {
        prefix: 'custom-icons',
        dir: './app/assets/icons/custom-icons',
      },
    ],
  },
})
