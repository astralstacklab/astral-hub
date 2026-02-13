<script setup lang="ts">
import { withDefaults, ref, computed, watch, onUnmounted, useSlots } from 'vue'

interface FileWithPreview extends File {
  preview?: string
}

interface Props {
  label?: string
  accept?: string
  maxSize?: number // MB
  multiple?: boolean
  preview?: boolean
  required?: boolean
  disabled?: boolean
  error?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  accept: 'image/*',
  maxSize: 5, // MB
  multiple: false,
  preview: true,
  required: false,
  disabled: false,
  error: '',
  hint: '',
})

const emit = defineEmits<{
  (e: 'change', files: File[]): void
  (e: 'remove', index: number): void
}>()

const slots = useSlots()
const componentId = `form-upload-${Math.random().toString(36).slice(2, 9)}`
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const internalError = ref('')
const selectedFiles = ref<FileWithPreview[]>([])

const hasLabel = computed(() => !!props.label || slots.label)
const hasMessage = computed(() => !!props.error || !!internalError.value || !!props.hint)
const displayError = computed(() => props.error || internalError.value)
const displayHint = computed(() => {
  if (props.hint) return props.hint
  const acceptTypes = props.accept === 'image/*' ? '圖片' : props.accept
  return `接受檔案類型: ${acceptTypes}，最大檔案大小: ${props.maxSize}MB。`
})

const openFileSelector = () => {
  if (props.disabled) return
  fileInput.value?.click()
}

const handleFileChange = (event: Event | DragEvent) => {
  if (props.disabled) return

  internalError.value = ''
  let files: FileList | null = null

  if (event instanceof DragEvent && event.dataTransfer) {
    files = event.dataTransfer.files
  } else if (event.target instanceof HTMLInputElement) {
    files = event.target.files
  }

  if (files && files.length > 0) {
    let newFiles: FileWithPreview[] = []
    if (props.multiple) {
      newFiles = [...selectedFiles.value]
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validate file size
      if (file.size > props.maxSize * 1024 * 1024) {
        internalError.value = `檔案 "${file.name}" 大小超過 ${props.maxSize}MB。`
        continue
      }

      // Validate file type (basic check based on accept prop)
      if (props.accept !== '*' && !file.type.match(new RegExp(props.accept.replace(/\*/g, '.*')))) {
        internalError.value = `檔案 "${file.name}" 類型不符合要求: ${props.accept}。`
        continue
      }

      const fileWithPreview: FileWithPreview = file
      if (props.preview && file.type.startsWith('image/') && typeof window !== 'undefined') {
        fileWithPreview.preview = URL.createObjectURL(file)
      }
      newFiles.push(fileWithPreview)

      if (!props.multiple) break // If not multiple, only take the first valid file
    }

    selectedFiles.value = props.multiple ? newFiles : newFiles.slice(0, 1)
    emit('change', selectedFiles.value)
  }

  // Reset file input value to allow selecting same file again
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const removeFile = (index: number) => {
  if (props.disabled) return
  const removedFile = selectedFiles.value[index]
  if (removedFile.preview && typeof window !== 'undefined') {
    URL.revokeObjectURL(removedFile.preview)
  }
  selectedFiles.value.splice(index, 1)
  emit('remove', index)
  emit('change', selectedFiles.value) // Emit change with updated files
}

const handleDragOver = (event: DragEvent) => {
  if (props.disabled) return
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (event: DragEvent) => {
  if (props.disabled) return
  event.preventDefault()
  isDragging.value = false
}

const handleDrop = (event: DragEvent) => {
  if (props.disabled) return
  event.preventDefault()
  isDragging.value = false
  handleFileChange(event)
}

// Cleanup object URLs on component unmount
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    selectedFiles.value.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })
  }
})

// Clear internal error when component error prop changes
watch(
  () => props.error,
  (newError) => {
    if (newError) {
      internalError.value = '' // Clear internal error if external error is provided
    }
  }
)
</script>

<template>
  <div class="space-y-1">
    <label v-if="hasLabel" :for="componentId" class="block text-sm font-medium text-gray-700">
      <slot name="label">{{ label }}</slot>
      <span v-if="required" class="text-danger ml-0.5">*</span>
    </label>

    <div
      class="relative"
      :class="[
        'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-gray-300',
        { 'opacity-50 cursor-not-allowed': disabled },
      ]"
      @click="openFileSelector"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        :multiple="multiple"
        :disabled="disabled"
        hidden
        @change="handleFileChange"
      />
      <slot name="dropzone">
        <div class="flex flex-col items-center justify-center">
          <svg
            class="w-10 h-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            ></path>
          </svg>
          <p class="mt-2 text-sm text-gray-500">
            拖放檔案到此處或
            <span class="text-primary font-medium">點擊上傳</span>
          </p>
        </div>
      </slot>
    </div>

    <!-- File Previews -->
    <div v-if="preview && selectedFiles.length > 0" class="mt-3 grid grid-cols-4 gap-2">
      <div
        v-for="(file, index) in selectedFiles"
        :key="index"
        class="relative w-full h-20 rounded overflow-hidden group"
      >
        <img
          v-if="file.preview"
          :src="file.preview"
          :alt="file.name"
          class="w-full h-full object-cover"
        />
        <div
          v-else
          class="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 p-1"
        >
          {{ file.name }}
        </div>
        <button
          type="button"
          class="absolute top-0 right-0 p-1 bg-danger text-white rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity"
          @click.stop="removeFile(index)"
        >
          &times;
        </button>
      </div>
    </div>

    <p v-if="hasMessage" :class="['text-sm', displayError ? 'text-danger' : 'text-gray-400']">
      {{ displayError || displayHint }}
    </p>
  </div>
</template>
