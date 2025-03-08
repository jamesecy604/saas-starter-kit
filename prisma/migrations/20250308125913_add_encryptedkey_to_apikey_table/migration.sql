-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "encryptedKey" TEXT;

-- AlterTable
ALTER TABLE "Usage" ALTER COLUMN "apiKey" SET DEFAULT '';
