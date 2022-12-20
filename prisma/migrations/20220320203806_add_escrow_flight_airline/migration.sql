-- AlterTable
ALTER TABLE "Airline" ADD COLUMN     "addr" TEXT,
ADD COLUMN     "pvtKey" TEXT;

-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "escrowAddr" TEXT;
