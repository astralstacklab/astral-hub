-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('ECPAY', 'MANUAL', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentLogStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "payment_logs" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "method" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentLogStatus" NOT NULL,
    "transactionId" TEXT,
    "requestData" JSONB,
    "responseData" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_logs_orderId_idx" ON "payment_logs"("orderId");

-- CreateIndex
CREATE INDEX "payment_logs_transactionId_idx" ON "payment_logs"("transactionId");

-- AddForeignKey
ALTER TABLE "payment_logs" ADD CONSTRAINT "payment_logs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
