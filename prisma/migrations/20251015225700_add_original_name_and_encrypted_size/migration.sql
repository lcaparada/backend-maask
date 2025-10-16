/*
  Warnings:

  - Added the required column `encrypted_size` to the `profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `original_name` to the `profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "encrypted_size" BIGINT NOT NULL,
ADD COLUMN     "original_name" VARCHAR(255) NOT NULL;
