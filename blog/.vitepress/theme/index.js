import DefaultTheme from 'vitepress/theme'
import './custom.css' 

import MyLayout from './Layout.vue'

export default {
  extends: DefaultTheme,
  Layout: MyLayout,
  enhanceApp({ app, router, siteData }) {
  }
}