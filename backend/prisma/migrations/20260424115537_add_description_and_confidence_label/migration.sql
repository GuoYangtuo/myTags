-- AlterTable
ALTER TABLE `category` ADD COLUMN `confidence` INTEGER NOT NULL DEFAULT 50,
    ADD COLUMN `confidenceLabel` VARCHAR(191) NOT NULL DEFAULT '置信度',
    ADD COLUMN `description` VARCHAR(191) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE `tag` ADD COLUMN `confidenceLabel` VARCHAR(191) NOT NULL DEFAULT '置信度',
    ADD COLUMN `description` VARCHAR(191) NOT NULL DEFAULT '';
