<script>
  import { Application } from './api/application'
  import ScrollTop from 'primevue/scrolltop';
 
  export default {
    async created() {
      this.applicationVersion = await Application.version() 
    },
    data() {
      return {
        applicationVersion: undefined
      }
    },
    components: {
      ScrollTop
    }
  }
</script>

<template>
  <div class="app">
    <!-- Menu -->
    <div class="menu"></div>

    <!-- View Container -->
    <div class="container">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
      <ScrollTop target="parent" behavior="auto"/>
    </div>

    <!-- Status Bar -->
    <div class="status-bar">
      <span v-if="applicationVersion">v{{ applicationVersion }}</span>
    </div>
  </div>
</template>

<style scoped>
  .app {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  .menu {
    display: flex;
    flex-grow: 0;
    flex-shrink: 0;
    width: 100%;
    height: 2px;
    background: #ccc;
    box-shadow: var(--evo-depth-8);
    position: relative;
    z-index: 1;
  }

  .container {
    width: 100%;
    flex-grow: 1;
    flex-shrink: 1;
    overflow-x: hidden;
    overflow-y: scroll;
  }

  .status-bar {
    display: flex;
    flex-grow: 0;
    flex-shrink: 0;
    justify-self: flex-end;
    justify-content: flex-end;
    width: 100%;
    height: 18px;
    padding: 0px 8px;
    color: #999;
    background: white;
    box-shadow: 0px -1px 3px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 1;
  }

  .p-scrolltop.p-link {
    background: #003e51;
  }
</style>
