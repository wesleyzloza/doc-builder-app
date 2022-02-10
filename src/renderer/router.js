// Imports
import { createRouter, createWebHashHistory } from 'vue-router'

// Views
import Home from './views/Home.vue'
import Loading from './views/Loading.vue'

// Routes
const routes = [
  { path: '/', component: Home },
  { path: '/Loading', component: Loading }
]

// Router
export const router = createRouter({
  history: createWebHashHistory(),
  routes
})
