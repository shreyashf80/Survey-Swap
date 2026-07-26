-- CreateEnum
CREATE TYPE "SurveyStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CreditTransactionReason" AS ENUM ('SIGNUP_BONUS', 'EARNED_FILL', 'SPENT_ON_FILL');

-- CreateEnum
CREATE TYPE "AdminActionType" AS ENUM ('CANCEL_SURVEY', 'SUSPEND_USER', 'ADJUST_CREDITS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "recovery_code_hash" TEXT NOT NULL,
    "credit_balance" INTEGER NOT NULL DEFAULT 3,
    "total_forms_filled" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "google_form_url" TEXT NOT NULL,
    "target_responses" INTEGER NOT NULL,
    "current_responses" INTEGER NOT NULL DEFAULT 0,
    "status" "SurveyStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FillEvent" (
    "id" TEXT NOT NULL,
    "survey_id" TEXT NOT NULL,
    "filler_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FillEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" "CreditTransactionReason" NOT NULL,
    "related_survey_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAction" (
    "id" TEXT NOT NULL,
    "action_type" "AdminActionType" NOT NULL,
    "target_user_id" TEXT,
    "target_survey_id" TEXT,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "FillEvent_survey_id_filler_id_key" ON "FillEvent"("survey_id", "filler_id");

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FillEvent" ADD CONSTRAINT "FillEvent_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FillEvent" ADD CONSTRAINT "FillEvent_filler_id_fkey" FOREIGN KEY ("filler_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_related_survey_id_fkey" FOREIGN KEY ("related_survey_id") REFERENCES "Survey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAction" ADD CONSTRAINT "AdminAction_target_survey_id_fkey" FOREIGN KEY ("target_survey_id") REFERENCES "Survey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
