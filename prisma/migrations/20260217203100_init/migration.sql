-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "description" TEXT,
    "topics" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Colleague" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "topics" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ArticleGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "canonicalArticleId" TEXT NOT NULL,
    "duplicateArticleIds" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_url_key" ON "Article"("url");

-- CreateIndex
CREATE INDEX "Article_publishedAt_idx" ON "Article"("publishedAt");

-- CreateIndex
CREATE INDEX "Article_topics_idx" ON "Article"("topics");

-- CreateIndex
CREATE UNIQUE INDEX "Colleague_name_key" ON "Colleague"("name");

-- CreateIndex
CREATE INDEX "ArticleGroup_canonicalArticleId_idx" ON "ArticleGroup"("canonicalArticleId");
