
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  const sqlPath = path.join(__dirname, 'populate_data.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Starting data population...');
  
  // Splitting by semicolon and filtering out empty strings
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement);
      // console.log(`Executed: ${statement.substring(0, 50)}...`);
    } catch (error) {
      console.error(`Error executing statement: ${statement.substring(0, 100)}`);
      console.error(error.message);
    }
  }

  console.log('Data population completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
