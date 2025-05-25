/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the column `medicalHistory` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the column `vaccinationHistory` on the `pets` table. All the data in the column will be lost.
  - Added the required column `date_of_birth` to the `pets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `owner_id` to the `pets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `pets` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `species` on the `pets` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PetSpecies" AS ENUM ('DOG', 'CAT', 'BIRD', 'REPTILE', 'FISH', 'RODENT', 'OTHER');

-- CreateEnum
CREATE TYPE "PetGender" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');

-- DropForeignKey
ALTER TABLE "pets" DROP CONSTRAINT "pets_ownerId_fkey";

-- AlterTable
ALTER TABLE "pets" DROP COLUMN "avatarUrl",
DROP COLUMN "createdAt",
DROP COLUMN "dateOfBirth",
DROP COLUMN "medicalHistory",
DROP COLUMN "ownerId",
DROP COLUMN "updatedAt",
DROP COLUMN "vaccinationHistory",
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date_of_birth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "gender" "PetGender",
ADD COLUMN     "medical_history" JSONB,
ADD COLUMN     "owner_id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vaccination_history" JSONB,
DROP COLUMN "species",
ADD COLUMN     "species" "PetSpecies" NOT NULL;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
