import type { PrismaClient, Product, Prisma } from '../../../src/generated/prisma/client.js'
import type {
  CreateProductInput,
  UpdateProductInput,
  QueryProductsInput,
} from './products.schema.js'

export class ProductsService {
  constructor(private prisma: PrismaClient) {}

  async createProduct(data: CreateProductInput): Promise<Product> {
    return this.prisma.product.create({
      data: {
        ...data,
        images: [],
      },
    })
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        auction: true,
      },
    })
  }

  async getProducts(query: QueryProductsInput) {
    const { page, limit, category, status, channel, minPrice, maxPrice, search, sort } = query

    const where: Prisma.ProductWhereInput = {}

    if (category) where.category = category
    if (status) where.status = status
    if (channel) where.channel = channel
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cardNumber: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.sellingPrice = {}
      if (minPrice !== undefined) where.sellingPrice.gte = minPrice
      if (maxPrice !== undefined) where.sellingPrice.lte = maxPrice
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }
    if (sort) {
      const [field, order] = sort.split(':')
      if (field === 'price') {
        orderBy = { sellingPrice: order as Prisma.SortOrder }
      } else {
        orderBy = { [field]: order as Prisma.SortOrder }
      }
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ])

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data,
    })
  }

  async deleteProduct(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    })
  }

  async updateProductStatus(id: string, status: string): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data: { status: status as 'PENDING' | 'LISTED' | 'SOLD' },
    })
  }

  async addProductImage(id: string, imageUrl: string, imageType: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      throw new Error('Product not found')
    }

    const images = (product.images as Array<{ url: string; type: string }>) || []
    images.push({ url: imageUrl, type: imageType })

    return this.prisma.product.update({
      where: { id },
      data: { images },
    })
  }
}
