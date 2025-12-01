import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = path.join(__dirname, 'db.sqlite')

let db = null

function init(){
  const needInit = !fs.existsSync(DB_PATH)
  db = new Database(DB_PATH)
  // create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id=1), value TEXT);
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, name TEXT, passwordHash TEXT);
    CREATE TABLE IF NOT EXISTS medicines (id TEXT PRIMARY KEY, createdAt TEXT, name TEXT, sku TEXT, unit TEXT, purchasePrice REAL, salePrice REAL, expiry TEXT, stock INTEGER, supplier TEXT, extra TEXT);
    CREATE TABLE IF NOT EXISTS pharmacies (id TEXT PRIMARY KEY, createdAt TEXT, name TEXT, phone TEXT, address TEXT, contact TEXT, totalDebt REAL, paidAmount REAL, extra TEXT);
    CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY, name TEXT, totalDebt REAL, paidAmount REAL, extra TEXT);
    CREATE TABLE IF NOT EXISTS distributions (id TEXT PRIMARY KEY, pharmacyId TEXT, date TEXT, items TEXT, notes TEXT, extra TEXT);
  `)
  if(needInit){
    const insert = db.prepare('INSERT OR REPLACE INTO settings(id,value) VALUES(1,?)')
    insert.run(JSON.stringify({ currency: 'UZS', distributorName: 'Pharma Distributor' }))
  }
}

function rowToObj(row){ return row }

export function readDB(){
  if(!db) init()
  const settingsRow = db.prepare('SELECT value FROM settings WHERE id=1').get()
  const settings = settingsRow ? JSON.parse(settingsRow.value || '{}') : { currency: 'UZS', distributorName: 'Pharma Distributor' }

  const users = db.prepare('SELECT id,email,name,passwordHash FROM users').all()

  const medicines = db.prepare('SELECT id,createdAt,name,sku,unit,purchasePrice,salePrice,expiry,stock,supplier,extra FROM medicines').all().map(r=>({ ...r, purchasePrice: r.purchasePrice||0, salePrice: r.salePrice||0, stock: r.stock||0 }))

  const pharmacies = db.prepare('SELECT id,createdAt,name,phone,address,contact,totalDebt,paidAmount,extra FROM pharmacies').all().map(r=>({ ...r, totalDebt: r.totalDebt||0, paidAmount: r.paidAmount||0 }))

  const suppliers = db.prepare('SELECT id,name,totalDebt,paidAmount,extra FROM suppliers').all().map(r=>({ ...r, totalDebt: r.totalDebt||0, paidAmount: r.paidAmount||0 }))

  const distributions = db.prepare('SELECT id,pharmacyId,date,items,notes,extra FROM distributions').all().map(r=>({ ...r, items: r.items ? JSON.parse(r.items) : [], notes: r.notes||'' }))

  return { settings, users, medicines, pharmacies, suppliers, distributions }
}

export function writeDB(data){
  if(!db) init()
  const tx = db.transaction((d)=>{
    // settings
    const putSettings = db.prepare('INSERT OR REPLACE INTO settings(id,value) VALUES(1,?)')
    putSettings.run(JSON.stringify(d.settings || {}))

    // clear tables
    db.prepare('DELETE FROM users').run()
    db.prepare('DELETE FROM medicines').run()
    db.prepare('DELETE FROM pharmacies').run()
    db.prepare('DELETE FROM suppliers').run()
    db.prepare('DELETE FROM distributions').run()

    const insUser = db.prepare('INSERT INTO users(id,email,name,passwordHash) VALUES(?,?,?,?)')
    for(const u of (d.users||[])) insUser.run(u.id, u.email, u.name, u.passwordHash)

    const insMed = db.prepare('INSERT INTO medicines(id,createdAt,name,sku,unit,purchasePrice,salePrice,expiry,stock,supplier,extra) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    for(const m of (d.medicines||[])) insMed.run(m.id, m.createdAt, m.name, m.sku, m.unit, m.purchasePrice, m.salePrice, m.expiry, m.stock, m.supplier, JSON.stringify(m.extra||{}))

    const insPh = db.prepare('INSERT INTO pharmacies(id,createdAt,name,phone,address,contact,totalDebt,paidAmount,extra) VALUES(?,?,?,?,?,?,?,?,?)')
    for(const p of (d.pharmacies||[])) insPh.run(p.id, p.createdAt, p.name, p.phone, p.address, p.contact, p.totalDebt||0, p.paidAmount||0, JSON.stringify(p.extra||{}))

    const insSup = db.prepare('INSERT INTO suppliers(id,name,totalDebt,paidAmount,extra) VALUES(?,?,?,?,?)')
    for(const s of (d.suppliers||[])) insSup.run(s.id, s.name, s.totalDebt||0, s.paidAmount||0, JSON.stringify(s.extra||{}))

    const insDist = db.prepare('INSERT INTO distributions(id,pharmacyId,date,items,notes,extra) VALUES(?,?,?,?,?,?)')
    for(const dist of (d.distributions||[])) insDist.run(dist.id, dist.pharmacyId, dist.date, JSON.stringify(dist.items||[]), dist.notes||'', JSON.stringify(dist.extra||{}))
  })
  tx(data)
}

export default { init, readDB, writeDB }
