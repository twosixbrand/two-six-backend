const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTestAll() {
    const API_URL = 'http://localhost:3050/api/v1';

    console.log('🚀 INICIANDO TEST INTEGRAL DE DIAN (SOLO NOTA CRÉDITO)...');

    try {
        const invoiceId = 24; // SETP990000028 de la prueba exitosa anterior.
        
        console.log(`\n[1/1] Generando Nota Crédito a la Factura ID #${invoiceId}...`);
        console.log(`(Como la factura 24 ya está autorizada en la DIAN, su CUFE será válido automáticamente.)`);

        const creditNotePromise = axios.post(`${API_URL}/dian/invoices/${invoiceId}/credit-note`, {
            reasonCode: "2",
            reasonDesc: "Anulación de factura electrónica",
            customerDoc: "262626262626",
            customerDocType: "13",
            lines: [{ description: 'Devolución Total', quantity: 1, unitPrice: 100000, taxPercent: 19 }]
        }, { headers: { 'x-api-key': 'TwoSixAdminKey123!' } });

        try {
            const creditRes = await creditNotePromise;
            console.log(`✅ Nota Crédito recibida. Documento: NC${creditRes.data?.noteId || ''}`);
            console.log(creditRes.data);
        } catch (err) {
            console.log(`❌ Falló la Nota Crédito:`, err.response?.data || err.message);
        }

        console.log('\n🎉 PROCESO FINALIZADO. REVISA EL PORTAL WEB DE LA DIAN O LA TERMINAL PARA VERIFICAR SU APROBACIÓN.');

    } catch (error) {
        console.error('\n🚨 ERROR CATASTRÓFICO DURANTE EL SCRIPT:');
        console.error(error.response?.data || error.message);
    } finally {
        await prisma.$disconnect();
    }
}

runTestAll();
