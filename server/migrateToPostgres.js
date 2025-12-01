import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import postgresAdapter from './postgresAdapter.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, 'db.json')

async function migrate(){
  if(!fs.existsSync(dbPath)){
    console.error('db.json not found')
    process.exit(1)
  }
  const raw = fs.readFileSync(dbPath, 'utf-8')
  const data = JSON.parse(raw)
  await postgresAdapter.init()
  await postgresAdapter.writeDB(data)
  console.log('Migration to Postgres complete')
  process.exit(0)
}

migrate().catch(e=>{ console.error(e); process.exit(1) })
