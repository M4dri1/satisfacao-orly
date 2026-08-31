-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mesa" INTEGER,
    "produtos" INTEGER NOT NULL,
    "atendimento" INTEGER NOT NULL,
    "limpeza" INTEGER NOT NULL,
    "espera" INTEGER NOT NULL,
    "nps" INTEGER NOT NULL,
    "comentario" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Evaluation_createdAt_idx" ON "Evaluation"("createdAt");

-- CreateIndex
CREATE INDEX "Evaluation_mesa_idx" ON "Evaluation"("mesa");
