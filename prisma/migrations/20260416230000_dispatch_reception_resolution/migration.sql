-- Estado de resolución de novedades de recepción. 100% aditivo.
CREATE TYPE "ReceptionResolutionStatus" AS ENUM ('NO_DISCREPANCY', 'PENDING_REVIEW', 'ACCEPTED', 'REJECTED');

ALTER TABLE "consignment_dispatch_item" ADD COLUMN "resolution_status" "ReceptionResolutionStatus" NOT NULL DEFAULT 'NO_DISCREPANCY';
ALTER TABLE "consignment_dispatch_item" ADD COLUMN "resolved_by" TEXT;
ALTER TABLE "consignment_dispatch_item" ADD COLUMN "resolved_at" TIMESTAMP(3);
