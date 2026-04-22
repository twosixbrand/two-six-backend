// Backfill de metadata en asientos contables MANUAL_DIAN_INVOICE creados
// antes de que el servicio guardara metadata. Lee los datos desde
// DianEInvoicing.manual_invoice_snapshot y los copia al JournalEntry.metadata.
// Idempotente: solo toca asientos con metadata IS NULL.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const entries = await prisma.journalEntry.findMany({
        where: { source_type: 'MANUAL_DIAN_INVOICE', metadata: null },
    });
    if (entries.length === 0) {
        console.log('Nada que hacer: todos los MANUAL_DIAN_INVOICE ya tienen metadata.');
        return;
    }

    const invoices = await prisma.dianEInvoicing.findMany({
        where: { id: { in: entries.map((e) => e.source_id!).filter(Boolean) } },
        select: { id: true, document_number: true, manual_invoice_snapshot: true },
    });
    const byId = new Map(invoices.map((i) => [i.id, i]));

    let updated = 0;
    for (const e of entries) {
        const inv = e.source_id ? byId.get(e.source_id) : null;
        if (!inv?.manual_invoice_snapshot) continue;
        let snap: any = null;
        try { snap = JSON.parse(inv.manual_invoice_snapshot); } catch { continue; }
        const metadata = JSON.stringify({
            customer_nit: snap.customer?.doc_number ?? null,
            customer_name: snap.customer?.name ?? null,
            customer_email: snap.customer?.email ?? null,
            invoice_number: inv.document_number,
            operation_date: snap.operation_date ?? null,
            notes: snap.notes ?? null,
        });
        await prisma.journalEntry.update({ where: { id: e.id }, data: { metadata } });
        updated++;
        console.log(`✓ Actualizado ${e.entry_number} (factura ${inv.document_number})`);
    }

    console.log(`\nTotal actualizados: ${updated}/${entries.length}`);
}

main()
    .catch((err) => { console.error(err); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
