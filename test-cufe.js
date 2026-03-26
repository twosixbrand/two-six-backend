const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const order = await prisma.order.findUnique({
      where: { id: 27 },
      include: { orderItems: true }
    });
    
    let orderLines = order.orderItems.map(item => ({
      description: item.product_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      taxPercent: 19
    }));
    
    // dian.controller.ts logic
    let subtotal = 0;
    let taxTotal = 0;
    orderLines.forEach((l) => {
      const up = Number(l.unitPrice.toFixed(2));
      const lt = Number((l.quantity * up).toFixed(2));
      const tp = l.taxPercent ?? 19;
      const ut = Number((up * (tp / 100)).toFixed(2));
      const t = Number((ut * l.quantity).toFixed(2));
      subtotal += lt;
      taxTotal += t;
    });
    const total = subtotal + taxTotal;
    
    console.log("== dian.controller.ts ==");
    console.log("ValFac (subtotal):", subtotal.toFixed(2));
    console.log("ValImp1 (taxTotal):", taxTotal.toFixed(2));
    console.log("ValTot (total):", total.toFixed(2));
    
    // dian-ubl.service.ts logic
    let sub2 = 0;
    let tax2 = 0;
    const processedLines = orderLines.map(l => {
      const unitPrice = Number(l.unitPrice.toFixed(2));
      const lineTotal = Number((l.quantity * unitPrice).toFixed(2));
      const lineTaxPercent = l.taxPercent ?? 19;
      const unitTax = Number((unitPrice * (lineTaxPercent / 100)).toFixed(2));
      const lineTax = Number((unitTax * l.quantity).toFixed(2));
      
      sub2 += lineTotal;
      tax2 += lineTax;
      
      return { ...l, unitPrice, lineTotal, lineTaxPercent, lineTax };
    });

    const subtotalFinal = Number(sub2.toFixed(2));
    const taxTotalFinal = Number(tax2.toFixed(2));
    const totalFinal = Number((subtotalFinal + taxTotalFinal).toFixed(2));

    console.log("\n== dian-ubl.service.ts ==");
    console.log("TaxExclusiveAmount (subtotal):", subtotalFinal.toFixed(2));
    console.log("TaxAmount (taxTotal):", taxTotalFinal.toFixed(2));
    console.log("PayableAmount (total):", totalFinal.toFixed(2));
    
  } finally {
    await prisma.$disconnect();
  }
}
run();
