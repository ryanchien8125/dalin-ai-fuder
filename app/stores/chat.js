import { defineStore } from 'pinia'

function htmlEntityDecode(str) {
  return str
  const parser = new DOMParser()
  const doc = parser.parseFromString(str, 'text/html')
  return doc.documentElement.textContent
}

function removeEmojis(str) {
  // return str.replace(
  //   /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD800-\uDFFF]|[\uFE00-\uFE0F]|[\u1F600-\u1F64F]|[\u1F300-\u1F5FF]|[\u1F680-\u1F6FF]|[\u2600-\u26FF]|[\u1F1E6-\u1F1FF])/g,
  //   '',
  // )
  return str
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    messageTTS: {
      enable: false,
      messageId: null,
      generating: false,
      playing: false,
      audio: null,
    },
  }),
  actions: {
    async playAudio({ content, messageId, language }) {
      if (this.messageTTS.enable == false) {
        return
      }
      this.stopAudio()
      this.messageTTS.generating = true
      this.messageTTS.messageId = messageId

      const response = await $fetch('/api/v1/conversation/1/message/tts', {
        method: 'POST',
        body: {
          content: removeEmojis(htmlEntityDecode(content)).replaceAll('&', '＆'),
          language,
        },
        responseType: 'blob',
      }).catch(() => null)
      this.messageTTS.generating = false

      if (!response) {
        return
      }

      if (this.messageTTS.playing === false) { // 播放聲音
        this.messageTTS.playing = true

        const audioUrl = URL.createObjectURL(response)

        // 建立新的 Audio 物件
        this.messageTTS.audio = new Audio(audioUrl)
        this.messageTTS.audio.addEventListener('ended', () => {
          this.messageTTS.playing = false
          this.messageTTS.messageId = null
        })

        await this.messageTTS.audio.play()
      }
    },
    stopAudio() {
      if (this.messageTTS.audio && this.messageTTS.playing === true) {
        this.messageTTS.audio.pause()
        this.messageTTS.audio.currentTime = 0
        this.messageTTS.playing = false
        this.messageTTS.messageId = null
      }
    },
    toggleMessageTTSEnable() {
      this.messageTTS.enable = !this.messageTTS.enable
      if (this.messageTTS.enable == false) {
        this.stopAudio()
      }
    },
  },
})
