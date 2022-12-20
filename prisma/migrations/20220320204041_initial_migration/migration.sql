/*
  Warnings:

  - You are about to drop the column `escrowAddr` on the `Flight` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Flight" DROP COLUMN "escrowAddr",
ADD COLUMN     "flightEscrow" TEXT;
