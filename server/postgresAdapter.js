import pkg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { Client } = pkg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbJsonPath = path.join(__dirname, 'db.json')

let client = null

export async function init(){
  const conn = process.env.DATABASE_URL || process.env.PG_CONNECTION || 'postgres://postgres:postgres@localhost:5432/pharma'
  client = new Client({ connectionString: conn })
  await client.connect()
  // ensure tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS settings (id SERIAL PRIMARY KEY, key TEXT UNIQUE, value TEXT);
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, name TEXT, passwordHash TEXT);
    CREATE TABLE IF NOT EXISTS medicines (id TEXT PRIMARY KEY, createdAt TEXT, name TEXT, sku TEXT, unit TEXT, purchasePrice REAL, salePrice REAL, expiry TEXT, stock INTEGER, supplier TEXT, extra JSONB);
    CREATE TABLE IF NOT EXISTS pharmacies (id TEXT PRIMARY KEY, createdAt TEXT, name TEXT, phone TEXT, address TEXT, contact TEXT, totalDebt REAL, paidAmount REAL, extra JSONB);
    CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY, name TEXT, totalDebt REAL, paidAmount REAL, extra JSONB);
    CREATE TABLE IF NOT EXISTS distributions (id TEXT PRIMARY KEY, pharmacyId TEXT, date TEXT, items JSONB, notes TEXT, extra JSONB);
  `)
}

export async function readDB(){
  if(!client) await init()
  const settingsRes = await client.query('SELECT value FROM settings LIMIT 1')
  const settings = settingsRes.rows[0] ? JSON.parse(settingsRes.rows[0].value) : { currency: 'UZS', distributorName: 'Pharma Distributor' }

  const users = (await client.query('SELECT id,email,name,passwordhash FROM users')).rows
  const medicines = (await client.query('SELECT id,createdat,name,sku,unit,purchaseprice,saleprice,expiry,stock,supplier,extra FROM medicines')).rows
  const pharmacies = (await client.query('SELECT id,createdat,name,phone,address,contact,totaldebt,paidamount,extra FROM pharmacies')).rows
  const suppliers = (await client.query('SELECT id,name,totaldebt,paidamount,extra FROM suppliers')).rows
  const distributions = (await client.query('SELECT id,pharmacyid,date,items,notes,extra FROM distributions')).rows

  return {
    settings,
    users,
    medicines,
    pharmacies,
    suppliers,
    distributions
  }
}

export async function writeDB(data){
  if(!client) await init()
  // simple approach: replace tables contents inside a transaction
  const tx = async ()=>{
    await client.query('BEGIN')
    try{
      // settings: store as single row
      await client.query('DELETE FROM settings')
      await client.query('INSERT INTO settings(key,value) VALUES($1,$2)', ['root', JSON.stringify(data.settings || {})])

      await client.query('DELETE FROM users')
      for(const u of (data.users||[])){
        await client.query('INSERT INTO users(id,email,name,passwordhash) VALUES($1,$2,$3,$4)', [u.id, u.email, u.name, u.passwordHash])
      }

      await client.query('DELETE FROM medicines')
      for(const m of (data.medicines||[])){
        await client.query('INSERT INTO medicines(id,createdat,name,sku,unit,purchaseprice,saleprice,expiry,stock,supplier,extra) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)', [m.id, m.createdAt, m.name, m.sku, m.unit, m.purchasePrice||0, m.salePrice||0, m.expiry||'', m.stock||0, m.supplier||'', JSON.stringify(m.extra||{})])
      }

      await client.query('DELETE FROM pharmacies')
      for(const p of (data.pharmacies||[])){
        await client.query('INSERT INTO pharmacies(id,createdat,name,phone,address,contact,totaldebt,paidamount,extra) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)', [p.id, p.createdAt, p.name, p.phone||'', p.address||'', p.contact||'', p.totalDebt||0, p.paidAmount||0, JSON.stringify(p.extra||{})])
      }

      await client.query('DELETE FROM suppliers')
      for(const s of (data.suppliers||[])){
        await client.query('INSERT INTO suppliers(id,name,totaldebt,paidamount,extra) VALUES($1,$2,$3,$4,$5)', [s.id, s.name, s.totalDebt||0, s.paidAmount||0, JSON.stringify(s.extra||{})])
      }

      await client.query('DELETE FROM distributions')
      for(const d of (data.distributions||[])){
        await client.query('INSERT INTO distributions(id,pharmacyid,date,items,notes,extra) VALUES($1,$2,$3,$4,$5,$6)', [d.id, d.pharmacyId||'', d.date||'', JSON.stringify(d.items||[]), d.notes||'', JSON.stringify(d.extra||{})])
      }

      await client.query('COMMIT')
    }catch(e){
      await client.query('ROLLBACK')
      throw e
    }
  }
  await tx()
}

export default { init, readDB, writeDB }
