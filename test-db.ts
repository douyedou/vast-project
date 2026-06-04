import { query } from "./lib/db"

async function main() {
  const result = await query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'cases'
  `)

  console.table(result.rows)
}

main()