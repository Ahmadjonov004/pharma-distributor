import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dbAdapter from './dbAdapter.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, 'db.json')

function migrate(){
  if(!fs.existsSync(dbPath)){
    console.error('db.json not found, aborting')
    process.exit(1)
  }
  const raw = fs.readFileSync(dbPath, 'utf-8')
  const data = JSON.parse(raw)
  dbAdapter.init()
  dbAdapter.writeDB(data)
  console.log('Migration complete: db.json -> db.sqlite')
}

migrate()
