-- AlterTable
ALTER TABLE "TopicSubtopic" ADD COLUMN     "prerequisites" JSONB NOT NULL DEFAULT '[]';
