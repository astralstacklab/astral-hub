<script setup lang="ts">
import { withDefaults, ref, computed } from 'vue'
void computed

interface TableColumn {
  key: string // 對應 row 的 key
  label: string // 表頭顯示文字
  sortable?: boolean // 是否可排序
  width?: string // 欄位寬度（如 '120px'、'20%'）
  align?: 'left' | 'center' | 'right'
}

type SortDirection = 'asc' | 'desc' | null

interface Props {
  columns?: TableColumn[]
  rows?: Record<string, unknown>[]
  loading?: boolean
  striped?: boolean
  hoverable?: boolean
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  columns: () => [],
  rows: () => [],
  loading: false,
  striped: false,
  hoverable: true,
  emptyText: '暫無資料',
})
void props

const emit = defineEmits<{
  (e: 'sort', key: string, direction: SortDirection): void
}>()

const currentSortKey = ref<string | null>(null)
const currentSortDirection = ref<SortDirection>(null)

const handleSort = (column: TableColumn) => {
  if (!column.sortable) return

  let newDirection: SortDirection = null
  if (currentSortKey.value === column.key) {
    if (currentSortDirection.value === 'asc') {
      newDirection = 'desc'
    } else if (currentSortDirection.value === 'desc') {
      newDirection = null
    } else {
      newDirection = 'asc'
    }
  } else {
    newDirection = 'asc'
  }

  currentSortKey.value = column.key
  currentSortDirection.value = newDirection
  emit('sort', column.key, newDirection)
}

const columnAlignClasses = (align?: 'left' | 'center' | 'right') => {
  switch (align) {
    case 'left':
      return 'text-left'
    case 'center':
      return 'text-center'
    case 'right':
      return 'text-right'
    default:
      return 'text-left'
  }
}
</script>

<template>
  <div class="w-full overflow-x-auto">
    <div v-if="loading" class="relative min-h-[100px]">
      <slot name="loading">
        <div
          class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg"
        >
          <svg
            class="animate-spin h-8 w-8 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      </slot>
    </div>

    <table class="w-full text-sm">
      <thead
        class="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
      >
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :style="{ width: column.width }"
            :class="[
              'px-4 py-3',
              columnAlignClasses(column.align),
              { 'cursor-pointer select-none hover:text-gray-700': column.sortable },
            ]"
            @click="handleSort(column)"
          >
            <div
              class="flex items-center"
              :class="{
                'justify-center': column.align === 'center',
                'justify-end': column.align === 'right',
              }"
            >
              {{ column.label }}
              <span
                v-if="column.sortable && currentSortKey === column.key && currentSortDirection"
                class="ml-1"
              >
                {{ currentSortDirection === 'asc' ? '▲' : '▼' }}
              </span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        <template v-if="rows.length > 0">
          <tr
            v-for="(row, rowIndex) in rows"
            :key="rowIndex"
            :class="[
              { 'even:bg-gray-50': striped },
              { 'hover:bg-gray-100 transition-colors': hoverable },
            ]"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="['px-4 py-3 whitespace-nowrap', columnAlignClasses(column.align)]"
            >
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
                {{ row[column.key] }}
              </slot>
            </td>
          </tr>
        </template>
        <template v-else>
          <tr>
            <td :colspan="columns.length" class="px-4 py-3 text-center text-gray-500">
              <slot name="empty">
                {{ emptyText }}
              </slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
