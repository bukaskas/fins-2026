-- AlterTable: widen OrderLine.qty to support fractional values (e.g. lesson duration / reference duration).
ALTER TABLE "OrderLine" ALTER COLUMN "qty" SET DATA TYPE DECIMAL(10,4);
