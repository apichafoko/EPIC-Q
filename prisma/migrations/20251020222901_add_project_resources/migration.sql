-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "brief_description" TEXT;

-- CreateTable
CREATE TABLE "project_resources" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "s3_key" TEXT,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "project_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_resources_project_id_idx" ON "project_resources"("project_id");

-- AddForeignKey
ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
