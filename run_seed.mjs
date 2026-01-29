import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("ERROR: DATABASE_URL not found in .env.local");
    process.exit(1);
}

const sql = postgres(dbUrl);

async function seed() {
    console.log("Starting seed process...");
    try {
        const seedSql = fs.readFileSync('supabase/seed.sql', 'utf8');
        // The seed.sql has multiple statements. Some environments might not like a single big string if it has psql specific commands.
        // But our seed.sql is standard SQL + DO block.

        console.log("Executing seed.sql...");
        await sql.unsafe(seedSql);
        console.log("Seed completed successfully!");
    } catch (error) {
        console.error("Error during seed:", error);
    } finally {
        await sql.end();
    }
}

seed();
