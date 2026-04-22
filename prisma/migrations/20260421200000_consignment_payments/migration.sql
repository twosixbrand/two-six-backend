-- Pagos de consignación: el aliado reporta pagos por transferencia
-- o efectivo. Two Six aprueba/rechaza desde el CMS. 100% aditivo.

CREATE TYPE "ConsignmentPaymentMethod" AS ENUM ('TRANSFERENCIA', 'EFECTIVO', 'OTRO');
CREATE TYPE "ConsignmentPaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "consignment_payment" (
  "id" SERIAL NOT NULL,
  "id_order" INTEGER NOT NULL,
  "id_customer" INTEGER NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "payment_method" "ConsignmentPaymentMethod" NOT NULL,
  "proof_image_url" TEXT,
  "reference_number" TEXT,
  "notes" TEXT,
  "status" "ConsignmentPaymentStatus" NOT NULL DEFAULT 'PENDING',
  "rejected_reason" TEXT,
  "approved_by" TEXT,
  "approved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3),

  CONSTRAINT "consignment_payment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "consignment_payment" ADD CONSTRAINT "consignment_payment_id_order_fkey" FOREIGN KEY ("id_order") REFERENCES "order"("id_order") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consignment_payment" ADD CONSTRAINT "consignment_payment_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
