import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 開始清理舊資料...')

  // 按照外鍵依賴順序刪除（子表先刪）
  await prisma.pointsLog.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.bid.deleteMany()
  await prisma.auction.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.sellerTransaction.deleteMany()
  await prisma.product.deleteMany()
  await prisma.seller.deleteMany()
  await prisma.user.deleteMany()
  await prisma.adminUser.deleteMany()

  console.log('✅ 舊資料已清理')

  // ============================================
  // 1. 建立管理員
  // ============================================
  console.log('👤 建立管理員...')

  const superAdmin = await prisma.adminUser.create({
    data: {
      username: 'admin',
      email: 'admin@astral-hub.com',
      passwordHash: '$2b$10$placeholder_hash_for_seed_data_only',
      name: '系統管理員',
      role: 'SUPER_ADMIN',
    },
  })

  const staffUser = await prisma.adminUser.create({
    data: {
      username: 'staff01',
      email: 'staff01@astral-hub.com',
      passwordHash: '$2b$10$placeholder_hash_for_seed_data_only',
      name: '門市店員 A',
      role: 'STAFF',
    },
  })

  console.log(`  ✅ 管理員: ${superAdmin.name}, ${staffUser.name}`)

  // ============================================
  // 2. 建立賣家
  // ============================================
  console.log('🏪 建立賣家...')

  const seller1 = await prisma.seller.create({
    data: {
      email: 'seller1@example.com',
      name: '卡片達人小明',
      phone: '0912345678',
      passwordHash: '$2b$10$placeholder_hash_for_seed_data_only',
      level: 'GOLD',
      totalSales: 150000,
      commissionRate: 8,
      onlineListingFee: 30,
      offlineListingFee: 0,
      balance: 25000,
    },
  })

  const seller2 = await prisma.seller.create({
    data: {
      email: 'seller2@example.com',
      name: '寶可夢專賣店',
      phone: '0923456789',
      passwordHash: '$2b$10$placeholder_hash_for_seed_data_only',
      level: 'SILVER',
      totalSales: 50000,
      commissionRate: 10,
      onlineListingFee: 30,
      offlineListingFee: 0,
      balance: 8000,
    },
  })

  console.log(`  ✅ 賣家: ${seller1.name}, ${seller2.name}`)

  // ============================================
  // 3. 建立買家
  // ============================================
  console.log('🛒 建立買家...')

  const buyer1 = await prisma.user.create({
    data: {
      email: 'buyer1@gmail.com',
      name: '陳小華',
      phone: '0934567890',
      provider: 'GOOGLE',
      providerId: 'google_uid_001',
      loyaltyPoints: 500,
      memberLevel: 'GOLD',
    },
  })

  const buyer2 = await prisma.user.create({
    data: {
      email: 'buyer2@gmail.com',
      name: '林小美',
      phone: '0945678901',
      provider: 'FACEBOOK',
      providerId: 'fb_uid_001',
      loyaltyPoints: 120,
      memberLevel: 'STANDARD',
    },
  })

  console.log(`  ✅ 買家: ${buyer1.name}, ${buyer2.name}`)

  // ============================================
  // 4. 建立商品
  // ============================================
  console.log('📦 建立商品...')

  const product1 = await prisma.product.create({
    data: {
      type: 'CARD',
      category: '寶可夢',
      name: '皮卡丘 V (SR)',
      series: '劍盾',
      cardNumber: 'PKM-043-2024',
      gradingStatus: 'PSA',
      gradingScore: 10,
      costPrice: 1000,
      sellingPrice: 3000,
      sellerId: seller1.id,
      status: 'LISTED',
      channel: 'BOTH',
      description: '全新未拆封 PSA 10 完美鑑定卡，四角銳利無白邊',
      images: JSON.stringify([
        { url: 'https://example.com/pikachu-front.jpg', type: 'front' },
        { url: 'https://example.com/pikachu-back.jpg', type: 'back' },
        { url: 'https://example.com/pikachu-cert.jpg', type: 'cert' },
      ]),
    },
  })

  const product2 = await prisma.product.create({
    data: {
      type: 'CARD',
      category: '遊戲王',
      name: '青眼白龍 (20th Secret)',
      series: '20th Anniversary',
      cardNumber: 'YGO-00001-2024',
      gradingStatus: 'BGS',
      gradingScore: 9.5,
      costPrice: 5000,
      sellingPrice: 12000,
      sellerId: seller1.id,
      status: 'LISTED',
      channel: 'ONLINE',
      description: 'BGS 9.5 近完美品，含原廠保護殼',
      images: JSON.stringify([{ url: 'https://example.com/blue-eyes-front.jpg', type: 'front' }]),
    },
  })

  const product3 = await prisma.product.create({
    data: {
      type: 'CARD',
      category: '寶可夢',
      name: '噴火龍 VMAX (HR)',
      series: '漆黑的蓋歐卡',
      cardNumber: 'PKM-308-2023',
      gradingStatus: 'RAW',
      costPrice: 800,
      sellingPrice: 1500,
      sellerId: seller2.id,
      status: 'LISTED',
      channel: 'BOTH',
      description: '裸卡近美品，適合自行送鑑',
      conditionNotes: '右下角有極微白邊',
      images: JSON.stringify([
        { url: 'https://example.com/charizard-front.jpg', type: 'front' },
        { url: 'https://example.com/charizard-back.jpg', type: 'back' },
      ]),
    },
  })

  const product4 = await prisma.product.create({
    data: {
      type: 'ACCESSORY',
      category: '周邊商品',
      name: 'Ultra PRO 卡片保護殼 (35pt)',
      costPrice: 20,
      sellingPrice: 50,
      status: 'LISTED',
      channel: 'BOTH',
      description: 'Ultra PRO 35pt 磁吸式卡片保護殼，適合一般厚度卡片',
      stockQuantity: 100,
      images: JSON.stringify([]),
    },
  })

  const product5 = await prisma.product.create({
    data: {
      type: 'CARD',
      category: '寶可夢',
      name: '甲賀忍蛙 EX (SAR)',
      series: '古代未來',
      cardNumber: 'PKM-202-2025',
      gradingStatus: 'ARS',
      gradingScore: 10,
      costPrice: 2000,
      sellingPrice: 4500,
      sellerId: seller2.id,
      status: 'PENDING',
      channel: 'ONLINE',
      description: 'ARS 10 滿分鑑定卡，極稀有',
      images: JSON.stringify([{ url: 'https://example.com/greninja-front.jpg', type: 'front' }]),
    },
  })

  console.log(
    `  ✅ 商品: ${[product1, product2, product3, product4, product5].map((p) => p.name).join(', ')}`
  )

  // ============================================
  // 5. 建立競標
  // ============================================
  console.log('🔨 建立競標...')

  const auction1 = await prisma.auction.create({
    data: {
      productId: product2.id,
      startingPrice: 8000,
      buyNowPrice: 15000,
      currentPrice: 9500,
      incrementAmount: 500,
      currentBidderId: buyer1.id,
      startTime: new Date('2026-02-14T10:00:00Z'),
      endTime: new Date('2026-02-17T22:00:00Z'),
      status: 'ACTIVE',
    },
  })

  console.log(`  ✅ 競標: ${product2.name} (目前出價 $9,500)`)

  // 建立出價記錄
  await prisma.bid.createMany({
    data: [
      {
        auctionId: auction1.id,
        bidderId: buyer2.id,
        amount: 8000,
        maxBid: 9000,
        createdAt: new Date('2026-02-14T10:05:00Z'),
      },
      {
        auctionId: auction1.id,
        bidderId: buyer1.id,
        amount: 8500,
        maxBid: 8500,
        createdAt: new Date('2026-02-14T11:30:00Z'),
      },
      {
        auctionId: auction1.id,
        bidderId: buyer2.id,
        amount: 9000,
        maxBid: 9000,
        createdAt: new Date('2026-02-15T09:00:00Z'),
      },
      {
        auctionId: auction1.id,
        bidderId: buyer1.id,
        amount: 9500,
        maxBid: 10000,
        createdAt: new Date('2026-02-15T14:20:00Z'),
      },
    ],
  })

  console.log('  ✅ 出價記錄: 4 筆')

  // ============================================
  // 6. 建立訂單
  // ============================================
  console.log('📋 建立訂單...')

  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-20260213-001',
      buyerId: buyer1.id,
      buyerName: buyer1.name,
      buyerEmail: buyer1.email,
      buyerPhone: buyer1.phone,
      subtotal: 3000,
      shippingFee: 60,
      discountAmount: 0,
      finalAmount: 3060,
      paymentMethod: 'CREDIT_CARD',
      paymentStatus: 'PAID',
      paymentTransactionId: 'ecpay_txn_20260213_001',
      paidAt: new Date('2026-02-13T15:30:00Z'),
      shippingMethod: 'SEVEN_ELEVEN',
      shippingAddress: JSON.stringify({
        name: '陳小華',
        phone: '0934567890',
        storeId: '991234',
        storeName: '7-11 信義門市',
      }),
      trackingNumber: 'SV20260213001',
      shippedAt: new Date('2026-02-14T09:00:00Z'),
      status: 'SHIPPED',
      channel: 'ONLINE',
      items: {
        create: {
          productId: product1.id,
          productName: product1.name,
          productPrice: product1.sellingPrice,
          sellerId: seller1.id,
        },
      },
    },
  })

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-20260214-001',
      buyerName: '現場客人',
      subtotal: 100,
      shippingFee: 0,
      discountAmount: 0,
      finalAmount: 100,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      paidAt: new Date('2026-02-14T11:00:00Z'),
      shippingMethod: 'IN_STORE',
      status: 'COMPLETED',
      channel: 'POS',
      items: {
        create: [
          {
            productId: product4.id,
            productName: product4.name,
            productPrice: product4.sellingPrice,
          },
          {
            productId: product4.id,
            productName: product4.name,
            productPrice: product4.sellingPrice,
          },
        ],
      },
    },
  })

  console.log(`  ✅ 訂單: ${order1.orderNumber} (線上), ${order2.orderNumber} (POS)`)

  // ============================================
  // 7. 建立賣家交易記錄
  // ============================================
  console.log('💰 建立賣家交易記錄...')

  await prisma.sellerTransaction.createMany({
    data: [
      {
        sellerId: seller1.id,
        type: 'SALE',
        amount: 3000,
        orderId: order1.id,
        productId: product1.id,
        description: '皮卡丘 V (SR) 售出',
      },
      {
        sellerId: seller1.id,
        type: 'COMMISSION',
        amount: -240,
        orderId: order1.id,
        description: '佣金 8% (3000 × 0.08)',
      },
      {
        sellerId: seller1.id,
        type: 'LISTING_FEE',
        amount: -30,
        productId: product1.id,
        description: '線上上架費',
      },
    ],
  })

  console.log('  ✅ 賣家交易記錄: 3 筆')

  // ============================================
  // 8. 建立操作記錄
  // ============================================
  console.log('📝 建立操作記錄...')

  await prisma.auditLog.createMany({
    data: [
      {
        userId: superAdmin.id,
        userType: 'ADMIN',
        userName: superAdmin.name,
        action: 'CREATE',
        entityType: 'Product',
        entityId: product1.id,
        changes: JSON.stringify({ name: product1.name }),
      },
      {
        userId: superAdmin.id,
        userType: 'ADMIN',
        userName: superAdmin.name,
        action: 'UPDATE',
        entityType: 'Product',
        entityId: product1.id,
        changes: JSON.stringify({
          status: { from: 'PENDING', to: 'LISTED' },
        }),
      },
    ],
  })

  console.log('  ✅ 操作記錄: 2 筆')

  // ============================================
  // 9. 建立紅利點數記錄
  // ============================================
  console.log('🎁 建立紅利點數記錄...')

  await prisma.pointsLog.createMany({
    data: [
      {
        userId: buyer1.id,
        amount: 30,
        type: 'EARN',
        orderId: order1.id,
        description: '訂單 ORD-20260213-001 消費回饋',
      },
      {
        userId: buyer1.id,
        amount: -50,
        type: 'REDEEM',
        description: '兌換折扣券',
      },
    ],
  })

  console.log('  ✅ 紅利點數記錄: 2 筆')

  // ============================================
  // 統計
  // ============================================
  console.log('\n📊 Seed 完成！資料統計：')
  console.log(`  管理員: ${await prisma.adminUser.count()} 筆`)
  console.log(`  賣家: ${await prisma.seller.count()} 筆`)
  console.log(`  買家: ${await prisma.user.count()} 筆`)
  console.log(`  商品: ${await prisma.product.count()} 筆`)
  console.log(`  競標: ${await prisma.auction.count()} 筆`)
  console.log(`  出價: ${await prisma.bid.count()} 筆`)
  console.log(`  訂單: ${await prisma.order.count()} 筆`)
  console.log(`  訂單項目: ${await prisma.orderItem.count()} 筆`)
  console.log(`  賣家交易: ${await prisma.sellerTransaction.count()} 筆`)
  console.log(`  操作記錄: ${await prisma.auditLog.count()} 筆`)
  console.log(`  點數記錄: ${await prisma.pointsLog.count()} 筆`)
}

main()
  .catch((e) => {
    console.error('❌ Seed 失敗:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
