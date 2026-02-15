/*
  Warnings:

  - Added the required column `maxBid` to the `bids` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bids" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxBid" DECIMAL(10,2) NOT NULL;
