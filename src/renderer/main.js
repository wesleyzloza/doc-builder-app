// Vue Libraries
import { createApp } from 'vue'
import { router } from './router.js'

// Global Component Library - Element Plus
// https://element-plus.org/en-US/
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// Global Component Library - PrimeVue
import PrimeVue from 'primevue/config'
import 'primevue/resources/primevue.min.css' // Core CSS
import 'primevue/resources/themes/saga-blue/theme.css' // Theme
import 'primeicons/primeicons.css' // Icons

// Injection - TODO: move to preload.js
import { Application } from './api/application'
window.Application = Application
window.project = window.Application.Project

// Views
import App from './App.vue'

// Create application.
const app = createApp(App)

// Global methods/filters.
// https://v3.vuejs.org/guide/migration/filters.html#_2-x-syntax
app.config.globalProperties.$filters = {
  currencyUSD: (value) => {
    if (value !== 0 && !value) return ''
    if (typeof value === 'number') {
      return `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}`
    } else {
      return value
    }
  },
  percent: (value) => {
    if (value !== 0 && !value) return ''
    if (typeof value === 'number') {
      return `${Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value * 100)}%`
    } else {
      return value
    }
  }
}

app.use(ElementPlus)
app.use(PrimeVue)
app.use(router)
app.mount('#app')
