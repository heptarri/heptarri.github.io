import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar';
import markdownItKatex from 'markdown-it-katex'
const customElements = [
    'math',
    'maction',
    'maligngroup',
    'malignmark',
    'menclose',
    'merror',
    'mfenced',
    'mfrac',
    'mi',
    'mlongdiv',
    'mmultiscripts',
    'mn',
    'mo',
    'mover',
    'mpadded',
    'mphantom',
    'mroot',
    'mrow',
    'ms',
    'mscarries',
    'mscarry',
    'mscarries',
    'msgroup',
    'mstack',
    'mlongdiv',
    'msline',
    'mstack',
    'mspace',
    'msqrt',
    'msrow',
    'mstack',
    'mstack',
    'mstyle',
    'msub',
    'msup',
    'msubsup',
    'mtable',
    'mtd',
    'mtext',
    'mtr',
    'munder',
    'munderover',
    'semantics',
    'math',
    'mi',
    'mn',
    'mo',
    'ms',
    'mspace',
    'mtext',
    'menclose',
    'merror',
    'mfenced',
    'mfrac',
    'mpadded',
    'mphantom',
    'mroot',
    'mrow',
    'msqrt',
    'mstyle',
    'mmultiscripts',
    'mover',
    'mprescripts',
    'msub',
    'msubsup',
    'msup',
    'munder',
    'munderover',
    'none',
    'maligngroup',
    'malignmark',
    'mtable',
    'mtd',
    'mtr',
    'mlongdiv',
    'mscarries',
    'mscarry',
    'msgroup',
    'msline',
    'msrow',
    'mstack',
    'maction',
    'semantics',
    'annotation',
    'annotation-xml'
]

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Heptari's Inn",
    description: "Development Documents of Heptari",
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: '首页', link: '/' },
            { text: '关于我', link: '/about' }
        ],

        sidebar: generateSidebar({
            documentRootPath: 'blog', // 你的文档根目录
            collapsed: true,         // 是否默认折叠
            capitalizeFirst: true,    // 首字母大写
            useTitleFromFrontmatter: true, // 优先使用 md 里的 title 字段
        }),

        search: {
            provider: 'local'
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/heptarri' }
        ],

        logo: "/archlinux.svg",

        footer: {
            message: "Released under MIT License",
            copyright: "Copyright (c) 2017-2026 Heptari"
        }
    },

    vite: {
        assetsInclude: ['**/*.zip'], // 显式告知 Vite 将 .zip 视为静态资源
    },
    ignoreDeadLinks: true,
    markdown: {
        config: (md) => {
            md.use(markdownItKatex)
        }
    },
    vue: {
        template: {
            compilerOptions: {
                isCustomElement: (tag) => customElements.includes(tag)
            }
        }
    }
})