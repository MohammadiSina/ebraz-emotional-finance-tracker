/*
  Warnings:

  - The values [DAILY_PURCHASES,MONEY_TRANSFER,FOOD,CASH_WITHDRAWAL,HEALTH_BEAUTY,BILLS,FASHION,TRANSPORT,CULTURE_ART,SAVINGS_INVESTMENT,SPORT,GIFT,LOAN_INSTALLMENT] on the enum `Transaction_category` will be removed. If these variants are still used in the database, this will fail.
  - The values [IMPULSE,OBLIGATION] on the enum `Transaction_intent` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `transaction` MODIFY `category` ENUM('DAILY_EXPENSES', 'TRANSFERS', 'FOOD_AND_DRINKS', 'CASH', 'HEALTH_AND_BEAUTY', 'UTILITIES', 'CLOTHING', 'TRANSPORTATION', 'HOUSING', 'ENTERTAINMENT', 'ART_AND_CULTURE', 'SAVINGS_AND_INVESTMENTS', 'SPORTS', 'GIFTS_AND_DONATIONS', 'LOAN_PAYMENTS', 'OTHER') NOT NULL DEFAULT 'OTHER',
    MODIFY `intent` ENUM('PLANNED', 'IMPULSIVE', 'MANDATORY') NOT NULL;
