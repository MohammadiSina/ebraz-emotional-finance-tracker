-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('INCOME', 'EXPENSE') NOT NULL DEFAULT 'EXPENSE',
    `currency` ENUM('IRT', 'USD') NOT NULL DEFAULT 'IRT',
    `amount` FLOAT NOT NULL,
    `amountInUsd` FLOAT NOT NULL,
    `exchangeRate` FLOAT NOT NULL,
    `category` ENUM('DAILY_EXPENSES', 'TRANSFERS', 'SALARY', 'FOOD_AND_DRINKS', 'CASH', 'HEALTH_AND_BEAUTY', 'UTILITIES', 'CLOTHING', 'TRANSPORTATION', 'HOUSING', 'ENTERTAINMENT', 'ART_AND_CULTURE', 'SAVINGS_AND_INVESTMENTS', 'SPORTS', 'GIFTS_AND_DONATIONS', 'LOAN_PAYMENTS', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `intent` ENUM('PLANNED', 'IMPULSIVE', 'MANDATORY') NOT NULL,
    `emotion` ENUM('REGRET', 'SATISFACTION', 'STRESS', 'NEUTRAL', 'GUILT', 'RELIEF') NOT NULL,
    `note` VARCHAR(200) NULL,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Transaction_userId_occurredAt_idx`(`userId`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExchangeRate` (
    `currency` CHAR(6) NOT NULL,
    `rate` FLOAT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`currency`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Insight` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `period` CHAR(7) NOT NULL,
    `content` TEXT NOT NULL,
    `llmModel` VARCHAR(50) NOT NULL,
    `llmRequestId` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Insight_userId_period_key`(`userId`, `period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Insight` ADD CONSTRAINT `Insight_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
