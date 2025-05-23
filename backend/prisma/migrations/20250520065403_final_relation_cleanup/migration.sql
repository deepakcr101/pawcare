/*
  Warnings:

  - The values [VET] on the enum `ServiceType` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `appointments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `appointment_id` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `end_time` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `owner_id` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `pet_id` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `service_id` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `staff_id` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `start_time` on the `appointments` table. All the data in the column will be lost.
  - The primary key for the `pets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `avatar_url` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the column `date_of_birth` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the column `medical_history` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the column `owner_id` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the column `pet_id` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the column `vaccination_history` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the column `phone_number` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[appointmentDate,appointmentTime,serviceId]` on the table `appointments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `services` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `appointmentDate` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `appointmentTime` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `appointments` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `ownerId` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `petId` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceId` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateOfBirth` to the `pets` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `pets` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `ownerId` to the `pets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `pets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AppointmentStatus" ADD VALUE 'CONFIRMED';
ALTER TYPE "AppointmentStatus" ADD VALUE 'NO_SHOW';

-- AlterEnum
BEGIN;
CREATE TYPE "ServiceType_new" AS ENUM ('VETERINARY', 'GROOMING', 'DAYCARE');
ALTER TABLE "services" ALTER COLUMN "type" TYPE "ServiceType_new" USING ("type"::text::"ServiceType_new");
ALTER TYPE "ServiceType" RENAME TO "ServiceType_old";
ALTER TYPE "ServiceType_new" RENAME TO "ServiceType";
DROP TYPE "ServiceType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_appointment_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_pet_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_consultations" DROP CONSTRAINT "ai_consultations_pet_id_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_pet_id_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_service_id_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_staff_id_fkey";

-- DropForeignKey
ALTER TABLE "daycare_slots" DROP CONSTRAINT "daycare_slots_pet_id_fkey";

-- DropForeignKey
ALTER TABLE "pets" DROP CONSTRAINT "pets_owner_id_fkey";

-- DropIndex
DROP INDEX "appointments_owner_id_idx";

-- DropIndex
DROP INDEX "appointments_pet_id_idx";

-- DropIndex
DROP INDEX "appointments_service_id_idx";

-- DropIndex
DROP INDEX "appointments_staff_id_idx";

-- DropIndex
DROP INDEX "pets_owner_id_idx";

-- AlterTable
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_pkey",
DROP COLUMN "appointment_id",
DROP COLUMN "end_time",
DROP COLUMN "owner_id",
DROP COLUMN "pet_id",
DROP COLUMN "service_id",
DROP COLUMN "staff_id",
DROP COLUMN "start_time",
ADD COLUMN     "appointmentDate" DATE NOT NULL,
ADD COLUMN     "appointmentTime" TIME(0) NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "ownerId" TEXT NOT NULL,
ADD COLUMN     "petId" TEXT NOT NULL,
ADD COLUMN     "serviceId" TEXT NOT NULL,
ADD COLUMN     "staffId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'SCHEDULED',
ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "pets" DROP CONSTRAINT "pets_pkey",
DROP COLUMN "avatar_url",
DROP COLUMN "created_at",
DROP COLUMN "date_of_birth",
DROP COLUMN "medical_history",
DROP COLUMN "owner_id",
DROP COLUMN "pet_id",
DROP COLUMN "updated_at",
DROP COLUMN "vaccination_history",
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "medicalHistory" JSONB,
ADD COLUMN     "ownerId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vaccinationHistory" JSONB,
ADD CONSTRAINT "pets_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "services" ALTER COLUMN "type" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "phone_number",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "appointments_appointmentDate_appointmentTime_serviceId_key" ON "appointments"("appointmentDate", "appointmentTime", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "services_name_key" ON "services"("name");

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("service_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daycare_slots" ADD CONSTRAINT "daycare_slots_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_consultations" ADD CONSTRAINT "ai_consultations_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
