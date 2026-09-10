-- CreateTable: availability_slots — еженедельные слоты доступности работодателя для собеседований
CREATE TABLE "availability_slots" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
