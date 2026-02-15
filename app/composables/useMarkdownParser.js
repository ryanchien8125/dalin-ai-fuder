// composables/useMarkdownParser.ts
// Import package exports
import { createMarkdownParser, rehypeHighlight, createShikiHighlighter } from '@nuxtjs/mdc/runtime'
// Import desired Shiki themes and languages
import MaterialThemePalenight from 'shiki/themes/material-theme-palenight.mjs'
import HtmlLang from 'shiki/langs/html.mjs'
import MdcLang from 'shiki/langs/mdc.mjs'
import TsLang from 'shiki/langs/typescript.mjs'
import VueLang from 'shiki/langs/vue.mjs'
import cssLang from 'shiki/langs/css.mjs'
import ScssLang from 'shiki/langs/scss.mjs'
import YamlLang from 'shiki/langs/yaml.mjs'
import PythonLang from 'shiki/langs/python.mjs'
import JsLang from 'shiki/langs/javascript.mjs'
import CLang from 'shiki/langs/c.mjs'
import CppLang from 'shiki/langs/cpp.mjs'

export default function useMarkdownParser() {
  let parser

  const addTargetToLinks = () => {
    return (tree) => {
      const visit = (node) => {
        if (node.type === 'element' && node.tagName === 'a') {
          node.properties = node.properties || {}
          node.properties.target = '_blank'
          node.properties.class = 'text-hyperlink underline underline-offset-4 break-all'
        }

        if (Array.isArray(node.children)) {
          node.children.forEach(visit)
        }
      }

      visit(tree)
    }
  }

  const parse = async (markdown) => {
    if (!parser) {
      parser = await createMarkdownParser({
        rehype: {
          plugins: {
            addTargetToLinks: {
              instance: addTargetToLinks,
            },
            highlight: {
              instance: rehypeHighlight,
              options: {
                // Pass in your desired theme(s)
                theme: 'material-theme-palenight',
                // Create the Shiki highlighter
                highlighter: createShikiHighlighter({
                  bundledThemes: {
                    'material-theme-palenight': MaterialThemePalenight,
                  },
                  // Configure the bundled languages
                  bundledLangs: {
                    html: HtmlLang,
                    mdc: MdcLang,
                    vue: VueLang,
                    yml: YamlLang,
                    css: cssLang,
                    scss: ScssLang,
                    js: JsLang,
                    ts: TsLang,
                    javascript: JsLang,
                    typescript: TsLang,
                    python: PythonLang,
                    c: CLang,
                    cpp: CppLang,
                  },
                }),
              },
            },
          },
        },
      })
    }
    return parser(markdown)
  }

  return parse
}
