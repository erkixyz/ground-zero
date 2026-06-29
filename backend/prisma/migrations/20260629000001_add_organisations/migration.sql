CREATE TABLE "Organisation" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "regCode"   TEXT,
  "street"    TEXT,
  "city"      TEXT,
  "zip"       TEXT,
  "country"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);
