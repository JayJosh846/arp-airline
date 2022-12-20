/*
  Warnings:

  - A unique constraint covering the columns `[email,mobile]` on the table `Airline` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Airline_email_mobile_key" ON "Airline"("email", "mobile");
