import { NestFactory } from '@nestjs/core';
import { SeederService } from './seeder.service';
import { SeederModule } from './seeder.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule, {
    logger: ['log', 'error', 'warn'],
  });

  const seeder = app.get(SeederService);

  // Example:
  // npm run seed -- --only roles,plans
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const only = onlyArg ? onlyArg.replace('--only=', '').split(',').map(s => s.trim()) : undefined;

  await seeder.run({ only });

  await app.close();
}

bootstrap().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', e);
  process.exit(1);
});