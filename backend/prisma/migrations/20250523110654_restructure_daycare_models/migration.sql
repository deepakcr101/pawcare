/*
  Warnings:

  - You are about to drop the column `daycare_slot_id` on the `activity_logs` table. All the data in the column will be lost.
  - The primary key for the `pets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the `daycare_slots` table. If the table is not empty, all the data it contains will be lost.
  - The required column `pet_id` was added to the `pets` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "DaycareBookingStatus" AS ENUM ('BOOKED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DaycareSessionStatus" AS ENUM ('AVAILABLE', 'FULL', 'CLOSED');

-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_daycare_slot_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_pet_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_consultations" DROP CONSTRAINT "ai_consultations_pet_id_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_petId_fkey";

-- DropForeignKey
ALTER TABLE "daycare_slots" DROP CONSTRAINT "daycare_slots_pet_id_fkey";

-- DropForeignKey
ALTER TABLE "daycare_slots" DROP CONSTRAINT "daycare_slots_room_id_fkey";

-- DropIndex
DROP INDEX "activity_logs_daycare_slot_id_idx";

-- AlterTable
ALTER TABLE "activity_logs" DROP COLUMN "daycare_slot_id",
ADD COLUMN     "daycare_booking_id" TEXT;

-- AlterTable
ALTER TABLE "pets" DROP CONSTRAINT "pets_pkey",
DROP COLUMN "id",
ADD COLUMN     "pet_id" TEXT NOT NULL,
ADD CONSTRAINT "pets_pkey" PRIMARY KEY ("pet_id");

-- DropTable
DROP TABLE "daycare_slots";

-- DropEnum
DROP TYPE "DaycareStatus";

-- CreateTable
CREATE TABLE "daycare_sessions" (
    "daycare_session_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalCapacity" INTEGER NOT NULL,
    "currentBookings" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(65,30) NOT NULL,
    "status" "DaycareSessionStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daycare_sessions_pkey" PRIMARY KEY ("daycare_session_id")
);

-- CreateTable
CREATE TABLE "daycare_bookings" (
    "daycare_booking_id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "status" "DaycareBookingStatus" NOT NULL,
    "room_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "daycare_session_id" TEXT NOT NULL,

    CONSTRAINT "daycare_bookings_pkey" PRIMARY KEY ("daycare_booking_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daycare_sessions_date_key" ON "daycare_sessions"("date");

-- CreateIndex
CREATE INDEX "daycare_bookings_pet_id_idx" ON "daycare_bookings"("pet_id");

-- CreateIndex
CREATE INDEX "daycare_bookings_room_id_idx" ON "daycare_bookings"("room_id");

-- CreateIndex
CREATE INDEX "daycare_bookings_daycare_session_id_idx" ON "daycare_bookings"("daycare_session_id");

-- CreateIndex
CREATE INDEX "activity_logs_daycare_booking_id_idx" ON "activity_logs"("daycare_booking_id");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("pet_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daycare_bookings" ADD CONSTRAINT "daycare_bookings_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("pet_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daycare_bookings" ADD CONSTRAINT "daycare_bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "daycare_rooms"("room_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daycare_bookings" ADD CONSTRAINT "daycare_bookings_daycare_session_id_fkey" FOREIGN KEY ("daycare_session_id") REFERENCES "daycare_sessions"("daycare_session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("pet_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_daycare_booking_id_fkey" FOREIGN KEY ("daycare_booking_id") REFERENCES "daycare_bookings"("daycare_booking_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_consultations" ADD CONSTRAINT "ai_consultations_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("pet_id") ON DELETE RESTRICT ON UPDATE CASCADE;
