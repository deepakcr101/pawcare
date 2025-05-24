/*
  Warnings:

  - You are about to drop the column `appointmentDate` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `appointmentTime` on the `appointments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[dateTime,staffId]` on the table `appointments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dateTime` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Made the column `staffId` on table `appointments` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_staffId_fkey";

-- DropIndex
DROP INDEX "appointments_appointmentDate_appointmentTime_serviceId_key";

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "appointmentDate",
DROP COLUMN "appointmentTime",
ADD COLUMN     "dateTime" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "staffId" SET NOT NULL;

-- CreateTable
CREATE TABLE "staff_services" (
    "staff_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_services_pkey" PRIMARY KEY ("staff_id","service_id")
);

-- CreateTable
CREATE TABLE "staff_availabilities" (
    "staff_availability_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_availabilities_pkey" PRIMARY KEY ("staff_availability_id")
);

-- CreateIndex
CREATE INDEX "staff_availabilities_staff_id_startTime_endTime_idx" ON "staff_availabilities"("staff_id", "startTime", "endTime");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_dateTime_staffId_key" ON "appointments"("dateTime", "staffId");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("service_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_availabilities" ADD CONSTRAINT "staff_availabilities_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
