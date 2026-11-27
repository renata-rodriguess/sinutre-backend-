-- CreateTable
CREATE TABLE "water_intakes" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "water_intakes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "water_intakes" ADD CONSTRAINT "water_intakes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
