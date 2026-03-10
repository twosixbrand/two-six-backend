import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { NewsletterService } from './src/api/newsletter/newsletter.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const service = app.get(NewsletterService);
    try {
        const result = await service.subscribe('test_error_console@gmail.com');
        console.log("SUCCESS", result);
    } catch (err) {
        console.error("ERROR CAUGHT IN SCRIPT:", err);
    }
    await app.close();
}
bootstrap();
