/*
  Warnings:

  - The primary key for the `Usage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `apiKeyId` on the `Usage` table. All the data in the column will be lost.
  - Added the required column `apiKey` to the `Usage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Usage" DROP CONSTRAINT "Usage_pkey",
DROP COLUMN "apiKeyId",
ADD COLUMN     "apiKey" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Usage_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Usage_id_seq";
