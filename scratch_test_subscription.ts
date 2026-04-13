
import { PrismaClient } from '@prisma/client';

async function testSubscription() {
  const prisma = new PrismaClient();
  const testEmail = `test_${Date.now()}@example.com`;
  
  console.log(`Intentando suscribir a: ${testEmail}`);
  
  try {
    // Simulando la creación manual para no depender del MailerService en el script si no está configurado
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    const discountCode = `WELCOME-${randomString}`;
    
    const subscriber = await prisma.subscriber.create({
        data: {
            email: testEmail,
            status: true,
            unsubscribed: false,
            discount_code: discountCode,
        },
    });
    
    console.log('Suscripción exitosa en DB:', subscriber);
    
    // Verificar que el código sea válido en el sistema de cupones fallback
    const sub = await prisma.subscriber.findUnique({ where: { discount_code: discountCode } });
    if (sub) {
        console.log('Verificación: El código existe y está listo para usarse como fallback.');
    } else {
        console.error('Error: El código no se encontró en la base de datos.');
    }

  } catch (error) {
    console.error('Error en prueba de suscripción:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSubscription();
