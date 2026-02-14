import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { PrismaClient } from '../../../src/generated/prisma/client.js'
import { ProductsService } from '../../../src/modules/products/products.service.js'
import type { CreateProductInput } from '../../../src/modules/products/products.schema.js'

const prisma = new PrismaClient()
const service = new ProductsService(prisma)

const sampleProduct: CreateProductInput = {
  type: 'CARD',
  category: '寶可夢',
  name: '皮卡丘 V (SR)',
  series: '劍盾',
  cardNumber: 'PKM-TEST-001',
  gradingStatus: 'PSA',
  gradingScore: 10,
  costPrice: 1000,
  sellingPrice: 3000,
  channel: 'BOTH',
  description: '測試用商品',
}

beforeAll(async () => {
  await prisma.$connect()
})

afterAll(async () => {
  await prisma.orderItem.deleteMany()
  await prisma.product.deleteMany()
  await prisma.$disconnect()
})

beforeEach(async () => {
  await prisma.orderItem.deleteMany()
  await prisma.product.deleteMany()
})

describe('ProductsService', () => {
  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const product = await service.createProduct(sampleProduct)

      expect(product).toBeDefined()
      expect(product.id).toBeDefined()
      expect(product.name).toBe('皮卡丘 V (SR)')
      expect(product.type).toBe('CARD')
      expect(product.status).toBe('PENDING')
      expect(product.images).toEqual([])
    })

    it('should create an accessory product', async () => {
      const product = await service.createProduct({
        type: 'ACCESSORY',
        category: '周邊商品',
        name: '卡片保護殼',
        costPrice: 20,
        sellingPrice: 50,
        channel: 'BOTH',
        description: '35pt 磁吸保護殼',
        stockQuantity: 100,
      })

      expect(product.type).toBe('ACCESSORY')
      expect(product.stockQuantity).toBe(100)
    })
  })

  describe('getProductById', () => {
    it('should return product by id', async () => {
      const created = await service.createProduct(sampleProduct)

      const product = await service.getProductById(created.id)

      expect(product).toBeDefined()
      expect(product!.id).toBe(created.id)
      expect(product!.name).toBe('皮卡丘 V (SR)')
    })

    it('should return null for non-existent id', async () => {
      const product = await service.getProductById('00000000-0000-0000-0000-000000000000')
      expect(product).toBeNull()
    })

    it('should include seller relation when available', async () => {
      const seller = await prisma.seller.findFirst()
      if (!seller) return // skip if no sellers in db

      const created = await service.createProduct({
        ...sampleProduct,
        sellerId: seller.id,
      })

      const product = await service.getProductById(created.id)

      expect(product).toBeDefined()
      expect(product!.seller).toBeDefined()
      expect(product!.seller!.name).toBe(seller.name)
    })
  })

  describe('getProducts', () => {
    beforeEach(async () => {
      await prisma.orderItem.deleteMany()
      await prisma.product.deleteMany()

      // 建立多筆測試資料
      await service.createProduct({ ...sampleProduct, name: '皮卡丘 V', sellingPrice: 3000 })
      await service.createProduct({
        ...sampleProduct,
        name: '噴火龍 VMAX',
        category: '遊戲王',
        sellingPrice: 5000,
        status: 'LISTED',
      } as CreateProductInput)
      await service.createProduct({
        ...sampleProduct,
        name: '甲賀忍蛙 EX',
        sellingPrice: 4500,
        channel: 'ONLINE',
      })
    })

    it('should return paginated results', async () => {
      const result = await service.getProducts({ page: 1, limit: 2 })

      expect(result.products).toHaveLength(2)
      expect(result.total).toBe(3)
      expect(result.totalPages).toBe(2)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(2)
    })

    it('should filter by category', async () => {
      const result = await service.getProducts({ page: 1, limit: 20, category: '遊戲王' })

      expect(result.products).toHaveLength(1)
      expect(result.products[0].category).toBe('遊戲王')
    })

    it('should filter by channel', async () => {
      const result = await service.getProducts({ page: 1, limit: 20, channel: 'ONLINE' })

      expect(result.products).toHaveLength(1)
      expect(result.products[0].name).toBe('甲賀忍蛙 EX')
    })

    it('should filter by price range', async () => {
      const result = await service.getProducts({
        page: 1,
        limit: 20,
        minPrice: 4000,
        maxPrice: 6000,
      })

      expect(result.products).toHaveLength(2)
    })

    it('should search by name', async () => {
      const result = await service.getProducts({ page: 1, limit: 20, search: '皮卡丘' })

      expect(result.products).toHaveLength(1)
      expect(result.products[0].name).toBe('皮卡丘 V')
    })

    it('should sort by price ascending', async () => {
      const result = await service.getProducts({ page: 1, limit: 20, sort: 'price:asc' })

      const prices = result.products.map((p) => Number(p.sellingPrice))
      expect(prices[0]).toBeLessThanOrEqual(prices[1])
    })

    it('should sort by price descending', async () => {
      const result = await service.getProducts({ page: 1, limit: 20, sort: 'price:desc' })

      const prices = result.products.map((p) => Number(p.sellingPrice))
      expect(prices[0]).toBeGreaterThanOrEqual(prices[1])
    })
  })

  describe('updateProduct', () => {
    it('should update product fields', async () => {
      const created = await service.createProduct(sampleProduct)

      const updated = await service.updateProduct(created.id, {
        name: '皮卡丘 V (更新)',
        sellingPrice: 3500,
      })

      expect(updated.name).toBe('皮卡丘 V (更新)')
      expect(Number(updated.sellingPrice)).toBe(3500)
    })

    it('should support partial update', async () => {
      const created = await service.createProduct(sampleProduct)

      const updated = await service.updateProduct(created.id, {
        description: '只更新描述',
      })

      expect(updated.description).toBe('只更新描述')
      expect(updated.name).toBe(sampleProduct.name) // 未變
    })
  })

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const created = await service.createProduct(sampleProduct)

      await service.deleteProduct(created.id)

      const found = await service.getProductById(created.id)
      expect(found).toBeNull()
    })
  })

  describe('updateProductStatus', () => {
    it('should update status from PENDING to LISTED', async () => {
      const created = await service.createProduct(sampleProduct)
      expect(created.status).toBe('PENDING')

      const updated = await service.updateProductStatus(created.id, 'LISTED')
      expect(updated.status).toBe('LISTED')
    })
  })

  describe('addProductImage', () => {
    it('should add image to product', async () => {
      const created = await service.createProduct(sampleProduct)

      const updated = await service.addProductImage(
        created.id,
        'https://example.com/img.jpg',
        'front'
      )

      const images = updated.images as Array<{ url: string; type: string }>
      expect(images).toHaveLength(1)
      expect(images[0].url).toBe('https://example.com/img.jpg')
      expect(images[0].type).toBe('front')
    })

    it('should throw for non-existent product', async () => {
      await expect(
        service.addProductImage('00000000-0000-0000-0000-000000000000', 'url', 'front')
      ).rejects.toThrow('Product not found')
    })
  })
})
