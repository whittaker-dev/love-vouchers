-- CreateTable
CREATE TABLE "SetupStep" (
    "key" TEXT NOT NULL,
    "doneAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SetupStep_pkey" PRIMARY KEY ("key")
);
