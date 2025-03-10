/*
  Warnings:

  - A unique constraint covering the columns `[nameInClient]` on the table `Model` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nameInClient` to the `Model` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SYSADMIN';

-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "nameInClient" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Model_nameInClient_key" ON "Model"("nameInClient");
