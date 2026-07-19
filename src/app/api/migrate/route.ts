import { NextResponse } from "next/server";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json({ error: "DATABASE_URL is missing" }, { status: 500 });
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const client = await pool.connect();
  try {
    const sqlPath = path.join(process.cwd(), "drizzle", "0000_far_pixie.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    await client.query("BEGIN");
    for (let statement of statements) {
      const cleanedStatement = statement.replace(/--.*$/gm, "").trim();
      if (cleanedStatement) {
        await client.query(cleanedStatement);
      }
    }
    await client.query("COMMIT");

    return NextResponse.json({ success: true, message: "Migration executed successfully on Supabase!" });
  } catch (error) {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: String(error) }, { status: 500 });
  } finally {
    client.release();
    await pool.end();
  }
}
