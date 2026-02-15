export interface userJWTPayload {
  id: string
  nickname: string
  email: string
  avatar: string
  roles: number[]
}

export interface chatTextButtonItem {
  text: string
  enable: boolean
  weight: number
}

export interface appInternationalizationI18nLanguageItem {
  enable: boolean
  prePrompt: string
  title: string
  answerConfirm: string
  answerFallback: {
    text: string
    enable: boolean
    relevant: {
      enable: boolean
      text: string
    }
  }
  greeting: {
    enable: boolean
    items: chatTextButtonItem[]
  }
  suggestion: {
    enable: boolean
    items: chatTextButtonItem[]
  }
}
