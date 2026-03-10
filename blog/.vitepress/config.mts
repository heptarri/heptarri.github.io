import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar';

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
})