/*
  Warnings:

  - You are about to drop the column `activeOrganizationId` on the `session` table. All the data in the column will be lost.
  - You are about to drop the column `seats` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the `invitation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `member` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organization` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."invitation" DROP CONSTRAINT "invitation_inviterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."invitation" DROP CONSTRAINT "invitation_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."member" DROP CONSTRAINT "member_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."member" DROP CONSTRAINT "member_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."subscription" DROP CONSTRAINT "subscription_referenceId_fkey";

-- AlterTable
ALTER TABLE "public"."session" DROP COLUMN "activeOrganizationId";

-- AlterTable
ALTER TABLE "public"."subscription" DROP COLUMN "seats";

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "stripeCustomerId" TEXT;

-- DropTable
DROP TABLE "public"."invitation";

-- DropTable
DROP TABLE "public"."member";

-- DropTable
DROP TABLE "public"."organization";

-- AddForeignKey
ALTER TABLE "public"."subscription" ADD CONSTRAINT "subscription_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
