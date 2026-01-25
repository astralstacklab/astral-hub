# Task 20: Google Cloud Storage 整合

## 概述

整合 Google Cloud Storage (GCS) 作為商品圖片儲存方案，替換現有的 base64 編碼方式，提供高效的圖片上傳、儲存與存取功能。

## 依賴

- Task 05: Products API（商品 API 已建立）
- Task 15: Admin Web Products（後台商品管理已建立）

---

## 一、GCP 設定

### 1.1 建立 GCP 專案與 Storage Bucket

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 Cloud Storage API
4. 建立 Storage Bucket：
   - 名稱：`card-erp-images`（全球唯一）
   - 位置類型：Region
   - 位置：asia-east1（台灣）
   - 儲存類別：Standard
   - 存取控制：精細（Fine-grained）
   - 公開存取：允許（設定 allUsers 為 Storage Object Viewer）

### 1.2 建立服務帳號

1. 前往「IAM 與管理」>「服務帳號」
2. 建立服務帳號：
   - 名稱：`card-erp-storage`
   - 角色：Storage Object Admin
3. 建立金鑰（JSON 格式）
4. 下載金鑰檔案並儲存為 `gcp-key.json`

### 1.3 環境變數設定

```bash
# apps/api/.env

# GCS 設定
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=card-erp-images
GCS_KEY_FILE=./gcp-key.json

# 圖片 CDN URL（可選，使用 Cloud CDN 加速）
GCS_CDN_URL=https://storage.googleapis.com/card-erp-images
```

---

## 二、安裝依賴

```bash
# apps/api
pnpm add @google-cloud/storage
pnpm add -D @types/node

# 圖片處理（可選，用於壓縮與調整大小）
pnpm add sharp
```

---

## 三、GCS Service

### 3.1 Storage Service

```typescript
// apps/api/src/services/storage.service.ts

import { Storage } from '@google-cloud/storage'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

export interface UploadOptions {
  folder?: string // 檔案夾名稱（如 'products', 'avatars'）
  maxWidth?: number // 最大寬度（壓縮用）
  quality?: number // 壓縮品質（1-100）
}

export class StorageService {
  private storage: Storage
  private bucketName: string
  private cdnUrl: string

  constructor() {
    this.storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      keyFilename: process.env.GCS_KEY_FILE,
    })
    this.bucketName = process.env.GCS_BUCKET_NAME!
    this.cdnUrl = process.env.GCS_CDN_URL!
  }

  /**
   * 上傳圖片（支援 Buffer 或 Base64）
   */
  async uploadImage(
    file: Buffer | string,
    options: UploadOptions = {}
  ): Promise<string> {
    const { folder = 'products', maxWidth = 1200, quality = 85 } = options

    // 轉換 base64 為 Buffer
    let buffer: Buffer
    if (typeof file === 'string') {
      // 移除 data:image/xxx;base64, 前綴
      const base64Data = file.replace(/^data:image\/\w+;base64,/, '')
      buffer = Buffer.from(base64Data, 'base64')
    } else {
      buffer = file
    }

    // 使用 sharp 壓縮與調整大小
    const processedBuffer = await sharp(buffer)
      .resize(maxWidth, undefined, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality })
      .toBuffer()

    // 產生唯一檔名
    const fileName = `${folder}/${uuidv4()}.jpg`

    // 上傳到 GCS
    const bucket = this.storage.bucket(this.bucketName)
    const file = bucket.file(fileName)

    await file.save(processedBuffer, {
      metadata: {
        contentType: 'image/jpeg',
      },
      public: true, // 設為公開存取
    })

    // 返回公開 URL
    return `${this.cdnUrl}/${fileName}`
  }

  /**
   * 批量上傳圖片
   */
  async uploadImages(
    files: Array<Buffer | string>,
    options: UploadOptions = {}
  ): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, options))
    return await Promise.all(uploadPromises)
  }

  /**
   * 刪除圖片
   */
  async deleteImage(imageUrl: string): Promise<void> {
    // 從 URL 提取檔名
    const fileName = imageUrl.replace(`${this.cdnUrl}/`, '')

    const bucket = this.storage.bucket(this.bucketName)
    const file = bucket.file(fileName)

    await file.delete()
  }

  /**
   * 批量刪除圖片
   */
  async deleteImages(imageUrls: string[]): Promise<void> {
    const deletePromises = imageUrls.map(url => this.deleteImage(url))
    await Promise.all(deletePromises)
  }

  /**
   * 檢查圖片是否存在
   */
  async imageExists(imageUrl: string): Promise<boolean> {
    const fileName = imageUrl.replace(`${this.cdnUrl}/`, '')
    const bucket = this.storage.bucket(this.bucketName)
    const file = bucket.file(fileName)

    const [exists] = await file.exists()
    return exists
  }
}
```

---

## 四、API Routes

### 4.1 Upload Routes

```typescript
// apps/api/src/routes/upload.routes.ts

import { FastifyInstance } from 'fastify'
import { StorageService } from '../services/storage.service'
import multipart from '@fastify/multipart'

export async function uploadRoutes(fastify: FastifyInstance) {
  // 註冊 multipart 支援
  await fastify.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 10, // 最多 10 個檔案
    },
  })

  const storageService = new StorageService()

  /**
   * POST /api/upload/images - 上傳圖片（multipart/form-data）
   */
  fastify.post('/images', async (request, reply) => {
    const data = await request.file()

    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' })
    }

    // 驗證檔案類型
    if (!data.mimetype.startsWith('image/')) {
      return reply.code(400).send({ error: 'Only image files are allowed' })
    }

    try {
      const buffer = await data.toBuffer()
      const imageUrl = await storageService.uploadImage(buffer, {
        folder: 'products',
        maxWidth: 1200,
        quality: 85,
      })

      reply.send({ url: imageUrl })
    } catch (error) {
      fastify.log.error('Upload error:', error)
      return reply.code(500).send({ error: 'Upload failed' })
    }
  })

  /**
   * POST /api/upload/images-batch - 批量上傳圖片
   */
  fastify.post('/images-batch', async (request, reply) => {
    const parts = request.parts()
    const files: Buffer[] = []

    for await (const part of parts) {
      if (part.type === 'file') {
        // 驗證檔案類型
        if (!part.mimetype.startsWith('image/')) {
          continue
        }

        const buffer = await part.toBuffer()
        files.push(buffer)
      }
    }

    if (files.length === 0) {
      return reply.code(400).send({ error: 'No valid image files uploaded' })
    }

    try {
      const imageUrls = await storageService.uploadImages(files, {
        folder: 'products',
      })

      reply.send({ urls: imageUrls })
    } catch (error) {
      fastify.log.error('Batch upload error:', error)
      return reply.code(500).send({ error: 'Upload failed' })
    }
  })

  /**
   * POST /api/upload/images-base64 - 上傳 Base64 圖片
   */
  fastify.post('/images-base64', async (request, reply) => {
    const { images } = request.body as { images: string[] }

    if (!images || images.length === 0) {
      return reply.code(400).send({ error: 'No images provided' })
    }

    try {
      const imageUrls = await storageService.uploadImages(images, {
        folder: 'products',
      })

      reply.send({ urls: imageUrls })
    } catch (error) {
      fastify.log.error('Base64 upload error:', error)
      return reply.code(500).send({ error: 'Upload failed' })
    }
  })

  /**
   * DELETE /api/upload/images - 刪除圖片
   */
  fastify.delete('/images', async (request, reply) => {
    const { url } = request.body as { url: string }

    if (!url) {
      return reply.code(400).send({ error: 'No URL provided' })
    }

    try {
      await storageService.deleteImage(url)
      reply.send({ success: true })
    } catch (error) {
      fastify.log.error('Delete error:', error)
      return reply.code(500).send({ error: 'Delete failed' })
    }
  })
}
```

### 4.2 註冊路由

```typescript
// apps/api/src/app.ts

import { uploadRoutes } from './routes/upload.routes'

// ...

app.register(uploadRoutes, { prefix: '/api/upload' })
```

---

## 五、前端整合（後台）

### 5.1 更新 ImageUpload 組件

```vue
<!-- apps/admin-web/components/ImageUpload.vue (更新) -->

<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">{{ label }}</label>

    <!-- 圖片預覽 -->
    <div v-if="images.length > 0" class="grid grid-cols-4 gap-4 mb-4">
      <div
        v-for="(image, index) in images"
        :key="index"
        class="relative aspect-square overflow-hidden rounded-md border-2 border-gray-300"
      >
        <img :src="image" :alt="`圖片 ${index + 1}`" class="w-full h-full object-cover">
        <button
          type="button"
          class="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
          :disabled="uploading"
          @click="removeImage(index)"
        >
          ×
        </button>
      </div>
    </div>

    <!-- 上傳按鈕 -->
    <div class="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        :disabled="uploading"
        @change="handleFileSelect"
      >
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="uploading"
        @click="openFileDialog"
      >
        {{ uploading ? '上傳中...' : '選擇圖片' }}
      </button>
      <p class="text-sm text-gray-500 mt-2">支援 JPG、PNG 格式，最多 {{ maxFiles }} 張，單檔最大 5MB</p>
    </div>

    <p v-if="error" class="text-sm text-red-600 mt-2">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label?: string
  modelValue: string[]
  maxFiles?: number
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  label: '商品圖片',
  maxFiles: 5,
})

const emit = defineEmits<Emits>()
const { apiFetch } = useApiClient()

const fileInput = ref<HTMLInputElement | null>(null)
const images = ref<string[]>([...props.modelValue])
const error = ref('')
const uploading = ref(false)

const openFileDialog = (): void => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event): Promise<void> => {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (!files || files.length === 0) return

  error.value = ''

  // 檢查數量限制
  if (images.value.length + files.length > props.maxFiles) {
    error.value = `最多只能上傳 ${props.maxFiles} 張圖片`
    return
  }

  uploading.value = true

  try {
    // 準備 FormData
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // 檢查檔案大小
      if (file.size > 5 * 1024 * 1024) {
        error.value = '圖片大小不可超過 5MB'
        continue
      }

      // 檢查檔案類型
      if (!file.type.startsWith('image/')) {
        error.value = '只能上傳圖片檔案'
        continue
      }

      formData.append('files', file)
    }

    // 上傳到 GCS
    const response = await fetch(`${process.env.NUXT_PUBLIC_API_BASE}/api/upload/images-batch`, {
      method: 'POST',
      body: formData,
      headers: {
        // 不設定 Content-Type，讓瀏覽器自動設定（包含 boundary）
      },
    })

    if (!response.ok) {
      throw new Error('上傳失敗')
    }

    const data = await response.json() as { urls: string[] }
    images.value.push(...data.urls)
    emit('update:modelValue', images.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '上傳失敗'
  } finally {
    uploading.value = false

    // 清空 input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const removeImage = async (index: number): Promise<void> => {
  if (!confirm('確定要刪除此圖片嗎？')) return

  const imageUrl = images.value[index]

  try {
    // 從 GCS 刪除
    await apiFetch('/api/upload/images', {
      method: 'DELETE',
      body: { url: imageUrl },
    })

    images.value.splice(index, 1)
    emit('update:modelValue', images.value)
  } catch (err) {
    alert('刪除失敗')
  }
}

watch(() => props.modelValue, (newValue) => {
  images.value = [...newValue]
})
</script>
```

---

## 六、更新 Products API（後端）

### 6.1 商品刪除時同步刪除圖片

```typescript
// apps/api/src/services/products.service.ts (更新)

import { StorageService } from './storage.service'

export class ProductsService {
  // ... 現有程式碼 ...

  private storageService = new StorageService()

  /**
   * 刪除商品（同時刪除圖片）
   */
  async deleteProduct(id: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      throw new Error('Product not found')
    }

    // 刪除圖片
    if (product.images && product.images.length > 0) {
      try {
        await this.storageService.deleteImages(product.images as string[])
      } catch (error) {
        // 記錄錯誤但不中斷刪除流程
        console.error('Failed to delete images:', error)
      }
    }

    // 刪除商品
    await this.prisma.product.delete({
      where: { id },
    })
  }
}
```

---

## 七、GCS Bucket 權限設定

### 7.1 設定公開讀取權限

```bash
# 使用 gsutil 設定 Bucket 權限（需安裝 Google Cloud SDK）
gsutil iam ch allUsers:objectViewer gs://card-erp-images
```

或透過 Console：
1. 進入 Bucket 詳情頁
2. 點選「權限」分頁
3. 點選「授予存取權」
4. 新增主體：`allUsers`
5. 角色：Storage Object Viewer
6. 儲存

### 7.2 CORS 設定（可選）

```json
[
  {
    "origin": ["http://localhost:3000", "https://your-domain.com"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

```bash
# 套用 CORS 設定
gsutil cors set cors.json gs://card-erp-images
```

---

## 八、安裝 @fastify/multipart

```bash
# apps/api
pnpm add @fastify/multipart
```

---

## 九、驗收標準

- [ ] GCS Bucket 建立完成並正確設定
- [ ] 服務帳號金鑰正確配置
- [ ] 圖片上傳功能正常運作（multipart）
- [ ] 批量上傳功能正常運作
- [ ] Base64 上傳功能正常運作
- [ ] 圖片壓縮與調整大小正常運作
- [ ] 圖片刪除功能正常運作
- [ ] 圖片 URL 可公開存取
- [ ] 商品刪除時同步刪除圖片
- [ ] 前端 ImageUpload 組件整合完成
- [ ] 無使用 `any` 型別（除單元測試外）

---

## 十、注意事項

1. **安全性**：
   - 服務帳號金鑰不可提交到 Git
   - 加入 `.gitignore`：`gcp-key.json`
   - 正式環境使用 GCP Secret Manager

2. **圖片壓縮**：
   - 自動調整大小至 1200px 寬
   - 品質設為 85%（平衡檔案大小與畫質）
   - 統一轉換為 JPEG 格式

3. **檔案命名**：
   - 使用 UUID 避免檔名衝突
   - 加上資料夾分類（products, avatars）
   - 保留原始副檔名（可選）

4. **成本優化**：
   - Standard 儲存類別適合常存取檔案
   - 定期清理未使用的圖片
   - 考慮使用 Cloud CDN 加速（額外費用）

5. **錯誤處理**：
   - 上傳失敗提供重試機制
   - 刪除失敗不應影響主流程
   - 記錄所有錯誤到日誌

6. **替代方案**：
   - 開發環境可使用本地儲存
   - 測試環境可使用 MinIO（S3 相容）
   - 生產環境使用 GCS

---

## 十一、開發環境替代方案（本地儲存）

### 11.1 Local Storage Service

```typescript
// apps/api/src/services/storage-local.service.ts

import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

export class LocalStorageService {
  private uploadDir = path.join(process.cwd(), 'uploads')
  private publicUrl = 'http://localhost:3001/uploads'

  constructor() {
    this.ensureUploadDir()
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir)
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true })
    }
  }

  async uploadImage(file: Buffer | string, options: { folder?: string } = {}): Promise<string> {
    const { folder = 'products' } = options
    const fileName = `${folder}-${uuidv4()}.jpg`
    const filePath = path.join(this.uploadDir, fileName)

    let buffer: Buffer
    if (typeof file === 'string') {
      const base64Data = file.replace(/^data:image\/\w+;base64,/, '')
      buffer = Buffer.from(base64Data, 'base64')
    } else {
      buffer = file
    }

    const processedBuffer = await sharp(buffer)
      .resize(1200, undefined, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()

    await fs.writeFile(filePath, processedBuffer)

    return `${this.publicUrl}/${fileName}`
  }

  async deleteImage(imageUrl: string): Promise<void> {
    const fileName = imageUrl.replace(`${this.publicUrl}/`, '')
    const filePath = path.join(this.uploadDir, fileName)

    try {
      await fs.unlink(filePath)
    } catch (error) {
      console.error('Delete error:', error)
    }
  }
}
```

### 11.2 靜態檔案服務

```typescript
// apps/api/src/app.ts

import fastifyStatic from '@fastify/static'
import path from 'path'

// 註冊靜態檔案服務
app.register(fastifyStatic, {
  root: path.join(process.cwd(), 'uploads'),
  prefix: '/uploads/',
})
```

---

## 十二、後續任務

- **Task 21**: Testing（單元測試與 E2E 測試）
- **Task 22**: Deployment（GCP Cloud Run 部署）
