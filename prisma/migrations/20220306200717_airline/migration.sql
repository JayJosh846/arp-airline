-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PASSENGER', 'AIRLINE', 'ADMIN');

-- CreateEnum
CREATE TYPE "CLASS" AS ENUM ('ECONOMY', 'BUSINESS', 'FIRST_CLASS', 'PREMIUM_ECONOMY');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('VERIFICATION', 'FA');

-- CreateTable
CREATE TABLE "Airline" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "airlineName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "mobileVerified" BOOLEAN NOT NULL DEFAULT false,
    "enabled2FA" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL DEFAULT E'PASSENGER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Airline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthCode" (
    "id" SERIAL NOT NULL,
    "airlineEmail" TEXT NOT NULL,
    "OTP" INTEGER NOT NULL,
    "category" "Category" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flight" (
    "id" SERIAL NOT NULL,
    "airlineName" TEXT NOT NULL,
    "flightCode" INTEGER NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "departureInfo" TEXT NOT NULL,
    "arrivalDate" TIMESTAMP(3) NOT NULL,
    "arrivalTime" TIMESTAMP(3) NOT NULL,
    "arrivalInfo" TEXT NOT NULL,
    "postedById" INTEGER NOT NULL,
    "airfare" TEXT NOT NULL,
    "class" "CLASS" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Airline_email_key" ON "Airline"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Airline_airlineName_key" ON "Airline"("airlineName");

-- CreateIndex
CREATE UNIQUE INDEX "Airline_mobile_key" ON "Airline"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "AuthCode_airlineEmail_key" ON "AuthCode"("airlineEmail");

-- CreateIndex
CREATE UNIQUE INDEX "AuthCode_OTP_key" ON "AuthCode"("OTP");

-- CreateIndex
CREATE UNIQUE INDEX "Flight_airlineName_key" ON "Flight"("airlineName");

-- CreateIndex
CREATE UNIQUE INDEX "Flight_flightCode_key" ON "Flight"("flightCode");

-- AddForeignKey
ALTER TABLE "AuthCode" ADD CONSTRAINT "AuthCode_airlineEmail_fkey" FOREIGN KEY ("airlineEmail") REFERENCES "Airline"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_airlineName_fkey" FOREIGN KEY ("airlineName") REFERENCES "Airline"("airlineName") ON DELETE RESTRICT ON UPDATE CASCADE;
