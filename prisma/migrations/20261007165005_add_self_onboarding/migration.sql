-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('PROFILE_PENDING', 'WHATSAPP_PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "businessPhone" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'PROFILE_PENDING';
