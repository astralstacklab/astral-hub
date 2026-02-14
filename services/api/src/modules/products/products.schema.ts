import { z } from 'zod/v4'

// ============================================
// Create Product
// ============================================
export const CreateProductSchema = z.object({
  type: z.enum(['CARD', 'ACCESSORY']),
  category: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  series: z.string().max(255).optional(),
  cardNumber: z.string().max(100).optional(),
  gradingStatus: z.enum(['RAW', 'PSA', 'ARS', 'BGS']).optional(),
  gradingScore: z.number().min(0).max(10).optional(),
  costPrice: z.number().positive(),
  sellingPrice: z.number().positive(),
  sellerId: z.string().uuid().optional(),
  channel: z.enum(['ONLINE', 'OFFLINE', 'BOTH']).default('BOTH'),
  description: z.string().min(1),
  conditionNotes: z.string().optional(),
  supplier: z.string().max(255).optional(),
  supplierContact: z.string().max(255).optional(),
  stockQuantity: z.number().int().positive().default(1),
})

export type CreateProductInput = z.infer<typeof CreateProductSchema>

// ============================================
// Update Product
// ============================================
export const UpdateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  series: z.string().max(255).optional(),
  cardNumber: z.string().max(100).optional(),
  gradingStatus: z.enum(['RAW', 'PSA', 'ARS', 'BGS']).optional(),
  gradingScore: z.number().min(0).max(10).optional(),
  costPrice: z.number().positive().optional(),
  sellingPrice: z.number().positive().optional(),
  channel: z.enum(['ONLINE', 'OFFLINE', 'BOTH']).optional(),
  description: z.string().min(1).optional(),
  conditionNotes: z.string().optional(),
  supplier: z.string().max(255).optional(),
  supplierContact: z.string().max(255).optional(),
  stockQuantity: z.number().int().positive().optional(),
})

export type UpdateProductInput = z.infer<typeof UpdateProductSchema>

// ============================================
// Query Products (querystring)
// ============================================
export const QueryProductsSchema = z.object({
  category: z.string().optional(),
  status: z.enum(['PENDING', 'LISTED', 'SOLD']).optional(),
  channel: z.enum(['ONLINE', 'OFFLINE', 'BOTH']).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['price:asc', 'price:desc', 'createdAt:asc', 'createdAt:desc']).optional(),
})

export type QueryProductsInput = z.infer<typeof QueryProductsSchema>

// ============================================
// Params / Patch
// ============================================
export const ProductIdParamSchema = z.object({
  id: z.string().uuid(),
})

export const UpdateProductStatusSchema = z.object({
  status: z.enum(['PENDING', 'LISTED', 'SOLD']),
})
