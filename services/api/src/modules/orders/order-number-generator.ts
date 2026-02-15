import type { PrismaClient } from '../../generated/prisma/client.js'

export async function generateOrderNumber(prisma: PrismaClient): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')

  const lastOrder = await prisma.order.findFirst({
    where: {
      orderNumber: {
        startsWith: `ORD${dateStr}`,
      },
    },
    orderBy: {
      orderNumber: 'desc',
    },
  })

  let sequence = 1
  if (lastOrder) {
    sequence = Number.parseInt(lastOrder.orderNumber.slice(-3), 10) + 1
  }

  return `ORD${dateStr}${sequence.toString().padStart(3, '0')}`
}
