const { execSync } = require('child_process');
const { Client } = require('pg');
const path = require('path');

const MEDUSA_SERVER_PATH = path.join(process.cwd(), '.medusa/server');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const checkIfSeeded = async () => {
  try {
    await client.connect();
    const res = await client.query('SELECT 1 FROM "user" LIMIT 1;');
    return res.rowCount && res.rowCount > 0;
  } catch (error) {
    if (error.message.includes('relation "user" does not exist')) {
      return false;
    }
    console.error("Unexpected error checking if database is seeded:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

const start = async () => {
  console.log("Starting Railway initialization...");
  
  if (process.env.MEDUSA_WORKER_MODE === "worker") {
    console.log("Running in worker mode, skipping database seeding.");
    return;
  }

  try {
    console.log("Running migrations...");
    execSync("medusa db:migrate", { cwd: MEDUSA_SERVER_PATH, stdio: "inherit" });
  } catch (error) {
    console.error("Failed to run migrations:", error);
    process.exit(1);
  }

  const isSeeded = await checkIfSeeded();
  if (!isSeeded) {
    console.log("Database is not seeded. Seeding now...");
    try {
      if(process.env.DB_MODE === "dummy") {
        console.log("Running seed script...");
        execSync("npm run seed", { stdio: "inherit" });
      }
  
      const adminEmail = process.env.MEDUSA_ADMIN_EMAIL;
      const adminPassword = process.env.MEDUSA_ADMIN_PASSWORD;
      if (adminEmail && adminPassword) {
        console.log("Creating admin user...");
        execSync(`medusa user -e "${adminEmail}" -p "${adminPassword}"`, {
          cwd: MEDUSA_SERVER_PATH,
          stdio: "inherit",
        });
      }
  
      console.log("Database seeded and admin user created successfully.");
    } catch (error) {
      console.error("Failed to seed database or create admin user:", error);
      process.exit(1);
    }
  } else {
    console.log("Database is already seeded. Skipping seeding.");
  }
};

start();