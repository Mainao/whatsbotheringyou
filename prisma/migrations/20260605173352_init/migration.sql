-- CreateTable
CREATE TABLE "stars" (
    "id" UUID NOT NULL,
    "message" VARCHAR(280) NOT NULL,
    "author_id" TEXT NOT NULL,
    "star_color" TEXT NOT NULL DEFAULT '#FFD700',
    "drawing_data" TEXT,
    "reply_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "stars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replies" (
    "id" UUID NOT NULL,
    "star_id" UUID NOT NULL,
    "message" VARCHAR(200) NOT NULL,
    "author_id" TEXT NOT NULL,
    "angel_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_stats" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "star_count" INTEGER NOT NULL DEFAULT 0,
    "reply_count" INTEGER NOT NULL DEFAULT 0,
    "active_users" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stars_expires_at_idx" ON "stars"("expires_at");

-- CreateIndex
CREATE INDEX "stars_author_id_created_at_idx" ON "stars"("author_id", "created_at");

-- CreateIndex
CREATE INDEX "replies_star_id_idx" ON "replies"("star_id");

-- CreateIndex
CREATE INDEX "replies_author_id_created_at_idx" ON "replies"("author_id", "created_at");

-- CreateIndex
CREATE INDEX "reports_target_type_target_id_idx" ON "reports"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "reports_reporter_id_created_at_idx" ON "reports"("reporter_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "daily_stats_date_key" ON "daily_stats"("date");

-- AddForeignKey
ALTER TABLE "replies" ADD CONSTRAINT "replies_star_id_fkey" FOREIGN KEY ("star_id") REFERENCES "stars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_star_fk" FOREIGN KEY ("target_id") REFERENCES "stars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reply_fk" FOREIGN KEY ("target_id") REFERENCES "replies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
