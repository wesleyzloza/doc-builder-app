<script>
// Libraries
import { v4 as guid } from 'uuid'
import { Application } from '../api/application'

// PrimeVue
import DataTable from 'primevue/datatable'
import Dropdown from 'primevue/dropdown'
import Column from 'primevue/column'
import ColumnGroup from 'primevue/columngroup'
import ContextMenu from 'primevue/contextmenu'

// Font-Awesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faPrint, faPrintSlash, faPrintSearch, faPencil, faCodeCommit, faTrash } from '@fortawesome/pro-light-svg-icons'
library.add(faCodeCommit, faPrint,faPrintSlash, faPrintSearch, faPencil, faTrash)

export default {
  data() {
    return {
      calendarShortcuts: [{
        text: 'Today',
        value: new Date(),
      }],
      document: Application.Document,
      selectedItems: null,
      selectedProduct: null,
      filters: null,
      itemDialogData: {guid: "", ID: "", Category: "", Product: "", Note: ""},
      itemDialogIsVisible: false,
      menuModel: [
        { label: 'Edit', icon: 'pi pi-fw pi-pencil', command: () => this.editItem(this.selectedProduct) },
        { label: 'Copy', icon: 'pi pi-fw pi-copy', command: () => this.copyItem(this.selectedProduct) },
        { label: 'Delete', icon: 'pi pi-fw pi-trash', command: () => this.deleteItem(this.selectedProduct) }
      ]
    }
  },
  components: {
    FontAwesomeIcon,
    DataTable,
    Dropdown,
    Column,
    ColumnGroup,
    ContextMenu,
  },
  computed: {
    includedItems() {
      return this.document.contents.filter(item => item.isIncluded === true)
    }
  },
  methods: {
    addRevision() {
      this.document.addRevision()
    },
    onRowReorder(event) {
      this.document.contents = event.value
    },
    onRowContextMenu(event) {
      this.$refs.cm.show(event.originalEvent)
    },
    editItem(itemRef) {
      this.itemDialogData = {...itemRef}
      this.itemDialogIsVisible = true
    },
    applyEdit() {
      let index = this.document.contents.findIndex(item => item.guid === this.itemDialogData.guid)
      if (index !== -1) {
        this.document.contents.splice(index, 1, {...this.itemDialogData})
      }
      this.itemDialogIsVisible = false
    },
    copyItem(itemRef) {
      let index = this.document.contents.findIndex(item => item.guid === itemRef.guid)
      let copy = {...itemRef}
      copy.guid = guid()
      if (index !== -1) {
        this.document.contents.splice(index, 0, copy)
      }
    },
    deleteItem(itemRef) {
      let index = this.document.contents.findIndex(item => item.guid === itemRef.guid)
      if (index !== -1) {
        this.document.contents.splice(index, 1)
      }
    },
    deleteRevision(guid) {
      this.document.removeRevision(guid)
    },
    rowClass(data){
      return data.isIncluded === true ? 'enabled-row' : 'disabled-row'
    },
    handleDoubleClick({data}) {
      data.isIncluded = !data.isIncluded
    }
  }
}
</script>

<template>
  <el-main>
    <el-card :body-style="{ padding: '4em' }">

      <h1 class="heading">{{document.title}}</h1>
      <h2 class="subheading">{{document.subtitle}}</h2>

      <el-form size="small" label-position="left" label-width="100px" style="max-width: 460px">
        <el-form-item label="Project #:">
          <el-input v-model="document.projectNumber"></el-input>
        </el-form-item>
        <el-form-item label="Document #:">
          <el-input v-model="document.documentNumber"></el-input>
        </el-form-item>
        <el-form-item label="Prepared by:">
          <el-input v-model="document.author"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="addRevision">+ Revision</el-button>
        </el-form-item>
      </el-form>

      <!-- Revisions -->
      <div v-if="document.revisions.length > 1">
        <el-divider></el-divider>
        <h3 class="revision-heading">Revisions</h3>
        <div v-for="(revision, index) in document.revisions" :key="revision.guid" class="revision-row">
          <div style="flex-grow: 0; width: 3em">
            <el-input :model-value="index" disabled size="small"/>
          </div>
          <div style="flex-grow: 1">
            <el-input v-model="revision.description" :disabled="index == 0" placeholder="description" size="small"/>
          </div>
          <div>
            <el-input v-model="revision.author" :disabled="index == 0" placeholder="author" size="small"/>
          </div>
          <el-date-picker v-model="revision.date" type="date" placeholder="Revision Date" :shortcuts="calendarShortcuts" size="small"></el-date-picker>
          <el-button @click="deleteRevision(revision.guid)" :disabled="index == 0" size="small">
            <font-awesome-icon :icon="['fal', 'trash']"/>
          </el-button>
        </div>
        <el-divider></el-divider>
      </div>
      

      <!-- Tabs -->
      <el-tabs type="card">

        <!-- Edit Tab -->
        <el-tab-pane>
          <!-- Label -->
          <template #label>
            <span>
              <font-awesome-icon :icon="['fal', 'pencil']"/>
            </span>
          </template>

          <!-- Content -->
          <DataTable
            :value="document.contents"
            class="data-table"
            dataKey="guid"
            responsiveLayout="scroll"
            removableSort
            rowGroupMode="subheader"
            groupRowsBy="Category"
            @rowReorder="onRowReorder"
            :rowClass="rowClass"
            contextMenu
            @rowContextmenu="onRowContextMenu"
            v-model:contextMenuSelection="selectedProduct"
            @rowDblclick="handleDoubleClick"
          >
            <Column field="Category" header="Category"></Column>
            <Column :rowReorder="true" headerStyle="width: 1em"></Column>
            <Column field="ID" header="ID" :sortable="true"></Column>
            <Column field="Note" header="Note">
              <template #body="slotProps">
                <span v-html="slotProps.data.Note" style="white-space: pre-line"></span>
              </template>
            </Column>
            <Column field="Product" header="Product"></Column>
            <Column header="Status">
              <template #body="slotProps">
                <el-button round @click="slotProps.data.isIncluded = !slotProps.data.isIncluded" :type="slotProps.data.isIncluded ? 'primary' : ''">
                  <font-awesome-icon :icon="['fal', 'print']" fixed-width v-if="slotProps.data.isIncluded"/>
                  <font-awesome-icon :icon="['fal', 'print-slash']" fixed-width v-if="!slotProps.data.isIncluded" />
                </el-button>
              </template>
            </Column>

            <!-- Subheader Template for Category -->
            <template #groupheader="slotProps">
              <span>
                <b>
                  {{ slotProps.data.Category }}
                </b>
              </span>
            </template>
          </DataTable>

          <!-- Data table context menu. -->
          <ContextMenu :model="menuModel" ref="cm" />
        </el-tab-pane>
        
        <!-- Print Preview -->
        <el-tab-pane>
          <!-- Label -->
          <template #label>
            <span>
              <font-awesome-icon :icon="['fal', 'print-search']"/>
            </span>
          </template>

          <!-- Content -->
          <ol class="print-preview">
            <el-empty v-if="includedItems.length === 0" description="Oops... looks like you didn't select any notes to include."></el-empty>

            <li v-for="item in includedItems" :key="item.guid">
              <div><span style="white-space: pre-line">{{item.Note}}</span></div>
            </li>
          </ol>
        </el-tab-pane>
      </el-tabs>


    </el-card>
  </el-main>

  <!-- Edit Dialog -->
  <el-dialog v-model="itemDialogIsVisible" title="Edit Item" destroy-on-close>
    <el-form size="small" label-position="top">
      <el-form-item label="ID">
        <el-input v-model="itemDialogData.ID" autocomplete="off"></el-input>
      </el-form-item>
      <el-form-item label="Category">
        <el-input v-model="itemDialogData.Category" autocomplete="off"></el-input>
      </el-form-item>
      <el-form-item label="Product Line">
        <el-input v-model="itemDialogData.Product" autocomplete="off"></el-input>
      </el-form-item>
      <el-form-item label="Note">
        <el-input v-model="itemDialogData.Note" type="textarea" :autosize="{ minRows: 2, maxRows: 20 }"></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="itemDialogIsVisible = false">Cancel</el-button>
        <el-button type="primary" @click="applyEdit">Apply</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style>
.heading {
  color: black;
  font-family: Arial, Helvetica, sans-serif;
  font-weight: bold;
  font-size: 24pt;
}

.subheading {
  color: black;
  font-family: Arial, Helvetica, sans-serif;
  font-weight: normal;
  font-size: 14pt;
  text-transform: uppercase;
  margin-bottom: 1em;
}

.revision-heading {
  color: black;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10pt;
  text-transform: uppercase;
}

.revision-row {
  display: flex;
}

.revision-row > div {
  display: flex;
  align-items: center;
}

.print-preview {
  padding: 0;
  list-style-type: none;
  counter-reset: item-counter;
  color: #606266;
}

.print-preview li {
  display: flex;
  padding: 2em;
  border-bottom: 1px solid #dcdfe6;
  counter-increment: item-counter;
}

.print-preview li:last-of-type {
  border-bottom: none;
}

.print-preview li::before {
  content: counter(item-counter)'.';
  display: block;
  flex-grow: 0;
  position: relative;
}

.print-preview li div {
  flex-grow: 1;
  padding-left: 1em;
}

tr {
  transition: all 0.2s;
}

tr.disabled-row {
  background: #f8f9fa !important;
}

tr.enabled-row + tr.disabled-row {
  box-shadow: inset 0 5px 5px -5px rgb(0 0 0 / 50%) !important;
  
}

tr.disabled-row * {
  color: #919191;
  font-style: italic;
}

.p-rowgroup-header {
  background: white !important;
}

.p-contextmenu {
  font-size: 10pt !important;
}

.el-card {
  margin: 0 auto;
  max-width: 920px !important;
}

.el-overlay-dialog {
  overflow: hidden !important;
  display: flex;
}

.el-dialog {
  display: flex;
  flex-direction: column;
  margin: 1em auto !important;
  height: var(100vh - 2em);
  width:  95vw !important;
  max-width: 920px !important;
}

.el-dialog__body {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  overflow: auto;
  flex-grow: 1;
}

.el-dialog__footer {
  flex-grow: 0;
}

.el-tabs__nav {
  float: right !important;
}

.el-tabs__header.is-top {
  margin-bottom: 0em;
}

.el-textarea__inner {
  font-size: 10pt;
  line-height: 12pt;
  word-break: keep-all;
  height: 320px;
}

.data-table {
  font-size: 10pt !important;
  border: 1px solid #e9ecef;
  border-top: none;
}

.p-datatable .p-datatable-thead > tr > th {
  background: white !important;
}

td[role="cell"] {
  user-select: none;
}

.pi-bars{
  cursor: grab !important;
}
</style>
