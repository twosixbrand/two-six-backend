const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const invoice = await prisma.dianEInvoicing.findFirst({
    where: { document_number: 'SETP990000011' }
  });

  if (!invoice) {
    console.log("Factura SETP990000011 no encontrada.");
    process.exit(1);
  }

  console.log("Encontrada factura ID:", invoice.id, " - CUFE:", invoice.cufe_code);

  const res = await fetch(`http://localhost:3050/api/v1/dian/invoices/${invoice.id}/credit-note`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'TwoSixAdminKey123!'
    },
    body: JSON.stringify({
      reasonCode: "2",
      reasonDesc: "Prueba automatizada anulación",
      customerDoc: "222222222222",
      customerDocType: "13"
    })
  });

  const body = await res.json();
  console.log("Respuesta creación nota:", body);

  if (!body.noteId) {
    console.log("No se pudo crear nota");
    process.exit(1);
  }

  console.log("Esperando 5 segundos para validación asincrónica en DIAN...");
  await new Promise(r => setTimeout(r, 5000));

  console.log("Sincronizando estado final...");
  const syncRes = await fetch(`http://localhost:3050/api/v1/dian/notes/${body.noteId}/sync-status`, {
    method: 'POST',
    headers: {
      'x-api-key': 'TwoSixAdminKey123!'
    }
  });

  const syncBody = await syncRes.json();
  console.log("Resultado Sync:", syncBody.statusCode, syncBody.statusDescription);
  console.log("Is Valid:", syncBody.isValid);
  
  if (syncBody.note && syncBody.note.status_message) {
    const raw = syncBody.note.status_message;
    const msgRegex = /<c:string>(.*?)<\/c:string>/g;
    let match;
    console.log("--- ERRORES/NOTAS DE LA DIAN ---");
    let hasErrors = false;
    while ((match = msgRegex.exec(raw)) !== null) {
      console.log(match[1]);
      hasErrors = true;
    }
    if (!hasErrors) {
      console.log("No hay mensajes de error en la respuesta.");
    }
  }

  process.exit(0);
}

run();
