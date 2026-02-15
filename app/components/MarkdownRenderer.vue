<script setup>
import { marked } from 'marked'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import CodeBlock from '@tiptap/extension-code-block'
import { Markdown } from '@tiptap/markdown'
import { TableCell, TableKit } from '@tiptap/extension-table'
import { Editor, EditorContent } from '@tiptap/vue-3'

const props = defineProps({
  data: {
    type: String,
  },
})

const markdown = ref(null)


// 覆寫 marked 解析器以停用單波浪號 (~) 刪除線，但保留雙波浪號 (~~) 的預設行為
marked.use({
  tokenizer: {
    del(src) {
      // 1. 如果是雙波浪號開頭，回傳 false 以使用 marked 預設的 del tokenizer
      // 這樣可以確保未來 marked 更新時，我們能享有最新的解析邏輯
      if (src.startsWith('~~')) {
        return false
      }

      // 2. 攔截單波浪號，強制解析為純文字，避免被預設解析器視為刪除線
      const singleMatch = /^~(?=\S)([\s\S]*?\S)~/.exec(src)
      if (singleMatch) {
        return {
          type: 'text',
          raw: singleMatch[0],
          text: singleMatch[0]
        }
      }

      return false
    }
  },
  emStrong(src, maskedSrc, prevChar) {
      // 1. 攔截 CJK 標點符號後接粗體的特殊情況
      // 原因：GFM 規範要求左側 delimiter run 不可被 Unicode 標點符號跟隨（除非前一個字元也是標點）
      // 但「、『 等 Unicode 標點會被判定為 punctuation，導致 ** 無法視為 left-flanking delimiter
      // 解法：若發現 ** 後面接的是我們允許的中文標點，則強制解析為粗體

      // 定義允許緊接在 ** 後面的特殊標點符號
      const allowListRegex = /^\*\*(?=[「『（【《“‘])((?:\\[\s\S]|[^\\])+?)\*\*(?!\*)/
      const match = allowListRegex.exec(src)

      if (match) {
        return {
          type: 'strong',
          raw: match[0],
          text: match[1],
          tokens: this.lexer.inlineTokens(match[1])
        }
      }

      // 2. 其他情況回傳 false，讓 marked 使用原本的 emStrong 邏輯 (包含標準的 * 和 _ 處理)
      // 這樣可以最大程度保留原生的 GFM 行為，只修補我們需要的 edge case
      return false
    }
})

const editor = ref(new Editor({
  editable: false,
  extensions: [
    StarterKit,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Link.configure({
      HTMLAttributes: {
        class: 'text-hyperlink underline underline-offset-4 break-all',
        target: '_blank',
      },
    }),
    Image.configure({
      inline: true,
    }),
    Youtube.configure({
      controls: false,
      nocookie: true,
    }),
    CodeBlock,
    Markdown,
    TableKit.configure({
      table: { resizable: true },
      tableCell: false,
    }),
    TableCell,
  ],
  enablePasteRules: false,
}))

const reRender = (data) => {
  if (/^<.*?>/.test(data)) {
    editor.value.commands.setContent(data)
  } else {
    editor.value.commands.setContent(data, { contentType: 'markdown' })
  }
}

reRender(props.data)

watch(
  () => props.data,
  async (nextValue) => {
    if (nextValue === '') {
      markdown.value = ''
    } else {
      markdown.value = nextValue
      reRender(markdown.value)
    }
  },
  { immediate: true },
)
</script>

<template>
  <EditorContent class="prose" :editor="editor" />
</template>

<style>
.mdc-renderer {
  ul {
    padding: 0 2rem;
    list-style-type: disc;
  }

  ol {
    padding: 0 2rem;
    list-style-type: decimal;
  }

  div[data-youtube-video] {
    overflow-x: auto;
  }

  pre {
    white-space: pre-wrap;
  }
}

.ProseMirror {
  > * + * {
    margin-top: 0.75em;
  }

  blockquote {
    padding: 8px 16px;
    border-left: medium solid #3b82f6;
    border-radius: 0.3rem;
    text-align: center;
    background-color: #eff6ff;
  }

  ul {
    padding: 0 2rem;
    list-style-type: disc;
  }

  ol {
    padding: 0 2rem;
    list-style-type: decimal;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: bold;
  }

  h2 {
    font-size: 1.2rem;
    font-weight: bold;
  }

  h3 {
    font-size: 1.1rem;
    font-weight: bold;
  }

  h4 {
    font-size: 1rem;
    font-weight: normal;
  }

  a {
    color: hsl(var(--hyperlink));
    cursor: pointer;
  }

  table {
    border-collapse: collapse;
    margin: 0.5rem 0;
    overflow: hidden;
    table-layout: fixed;
    width: 100%;

    td,
    th {
      border: 1px solid rgba(61, 37, 20, .12);
      box-sizing: border-box;
      min-width: 1em;
      padding: 6px 8px;
      position: relative;
      vertical-align: top;

      >* {
        margin-bottom: 0;
      }
    }

    th {
      background-color: rgba(61, 37, 20, .05);
      font-weight: bold;
      text-align: left;
    }

    .selectedCell:after {
      background: var(--gray-2);
      content: '';
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      pointer-events: none;
      position: absolute;
      z-index: 2;
    }

    .column-resize-handle {
      background-color: var(--purple);
      bottom: -2px;
      pointer-events: none;
      position: absolute;
      right: -2px;
      top: 0;
      width: 4px;
    }
  }

  .tableWrapper {
    margin: 1.5rem 0;
    overflow-x: auto;
  }

  .resize-cursor {
    cursor: ew-resize;
    cursor: col-resize;
  }

  p {
    word-wrap: break-word;
    overflow-wrap: anywhere;
  }

  p:last-child:has(.ProseMirror-trailingBreak:only-child) {
    display: none;
    height: 0;
    margin: 0;
  }
}

.font-inter {
  font-family: 'Inter', sans-serif;
}

.font-comic {
  font-family: 'Comic Sans MS, Comic Sans', cursive;
}

.font-cursive {
  font-family: cursive;
}
</style>
