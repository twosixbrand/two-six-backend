const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function run() {
  try {
    const order = await prisma.order.findUnique({
      where: { order_reference: 'TS-260320-2125' }
    });
    console.log("Order found:", order?.id);
    if (!order) return;

    const res = await axios.post(`http://localhost:3050/api/v1/dian/invoices/retry/${order.id}`, {}, {
      headers: { 'x-api-key': 'TwoSixAdminKey123!' }
    });
    console.log("Response:", res.data);
  } catch (err) {
    console.log("Error:", err.response ? err.response.data : err.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
