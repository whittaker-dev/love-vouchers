/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Voucher` table. All the data in the column will be lost.
  - You are about to drop the `Upload` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "avatarUrl",
ADD COLUMN     "avatarEmoji" TEXT NOT NULL DEFAULT '🐰';

-- AlterTable
ALTER TABLE "Voucher" DROP COLUMN "imageUrl";

-- DropTable
DROP TABLE "Upload";
