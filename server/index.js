import express from 'express'
import fs from 'fs'
import path from 'path'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { fileURLToPath } from 'url'
import dbAdapter from './dbAdapter.js'
import pgAdapter from './postgresAdapter.js'
import os from 'os'
let helmet, rateLimit, morgan, Joi
try{ helmet = (await import('helmet')).default }catch(e){ helmet = null }
try{ rateLimit = (await import('express-rate-limit')).default }catch(e){ rateLimit = null }
try{ morgan = (await import('morgan')).default }catch(e){ morgan = null }
try{ Joi = (await import('joi')).default }catch(e){ Joi = null }

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
const PORT = process.env.PORT || 8080

// Security headers when available
if(helmet){ app.use(helmet()) }

// Basic rate limiting
if(rateLimit){
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))
}

// Logging
if(morgan){ app.use(morgan('tiny')) }

app.use(cors())
app.use(express.json({ limit: '1mb' }))

const dbPath = path.join(__dirname, 'db.json')
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me'
let readDB = async function(){
  try{ return JSON.parse(fs.readFileSync(dbPath, 'utf-8')) }catch(e){ return { settings:{}, users:[], medicines:[], pharmacies:[], suppliers:[], distributions:[] } }
}

// atomic write with backup
let writeDB = async function(data){
  const tmp = dbPath + '.tmp'
  try{
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
    fs.renameSync(tmp, dbPath)
  }catch(e){
    console.error('Failed to write DB file', e)
    try{ fs.writeFileSync(dbPath + '.bak.' + Date.now(), JSON.stringify(data, null, 2), 'utf-8') }catch(e2){ console.error('Backup write also failed', e2) }
    throw e
  }
}

// If requested, use SQLite adapter for persistence
if(process.env.USE_SQLITE === '1'){
  try{
    dbAdapter.init()
    readDB = async ()=> dbAdapter.readDB()
    writeDB = async (d)=> dbAdapter.writeDB(d)
    console.log('Using SQLite adapter for persistence')
  }catch(e){
    console.error('Failed to initialize SQLite adapter, falling back to JSON file', e)
  }
}

// If requested, use Postgres adapter
if(process.env.USE_POSTGRES === '1'){
  (async ()=>{
    try{
      await pgAdapter.init()
      readDB = pgAdapter.readDB
      writeDB = pgAdapter.writeDB
      console.log('Using Postgres adapter for persistence')
    }catch(e){
      console.error('Failed to initialize Postgres adapter', e)
    }
  })()
}
function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36) }

function generateToken(user){
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
}

function requireAuth(req,res,next){
  const auth = req.headers.authorization
  if(!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  const token = auth.split(' ')[1]
  try{
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    return next()
  }catch(e){
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Health endpoint
app.get('/health', (req,res)=>{
  try{
    const stat = fs.existsSync(dbPath) ? fs.statSync(dbPath) : null
    res.json({ ok: true, pid: process.pid, uptime: process.uptime(), db: !!stat, platform: os.platform() })
  }catch(e){ res.status(500).json({ ok:false, error: String(e) }) }
})

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error', err)
  if(!res.headersSent) res.status(500).json({ error: 'Server error' })
})

// graceful shutdown
const shutdown = (signal) => {
  console.log('Shutting down due to', signal)
  try{ /* flush DB or other cleanup here */ }catch(e){}
  process.exit(0)
}
process.on('SIGINT', ()=>shutdown('SIGINT'))
process.on('SIGTERM', ()=>shutdown('SIGTERM'))
process.on('unhandledRejection', (r)=>{ console.error('unhandledRejection', r) })
process.on('uncaughtException', (e)=>{ console.error('uncaughtException', e) })

// ------- Medicines
app.get('/api/medicines', async (req,res)=>{
  const db = await readDB(); res.json(db.medicines)
})
app.post('/api/medicines', requireAuth, async (req,res)=>{
  try{
    const db = await readDB(); const now = new Date().toISOString()
    const body = req.body || {}
    if(Joi){
      const schema = Joi.object({ name: Joi.string().required(), sku: Joi.string().allow('',null), unit: Joi.string().allow('',null), purchasePrice: Joi.number().default(0), salePrice: Joi.number().default(0), expiry: Joi.string().allow('',null), stock: Joi.number().integer().default(0), supplier: Joi.string().allow('',null) })
      const { error, value } = schema.validate(body)
      if(error) return res.status(400).json({ error: error.message })
      Object.assign(body, value)
    }
    const m = { id: uid(), createdAt: now, ...body }
    db.medicines.push(m); await writeDB(db); res.json(m)
  }catch(e){ console.error(e); res.status(500).json({ error: 'Failed to create medicine' }) }
})
app.put('/api/medicines/:id', requireAuth, async (req,res)=>{
  const db = await readDB()
  const idx = db.medicines.findIndex(x=>x.id===req.params.id)
  if(idx<0) return res.status(404).end()
  db.medicines[idx] = { ...db.medicines[idx], ...req.body }
  await writeDB(db); res.json(db.medicines[idx])
})
app.delete('/api/medicines/:id', requireAuth, async (req,res)=>{
  const db = await readDB()
  db.medicines = db.medicines.filter(x=>x.id!==req.params.id)
  await writeDB(db); res.json({ok:true})
})

// ------- Pharmacies
app.get('/api/pharmacies', async (req,res)=>{
  const db = await readDB(); res.json(db.pharmacies)
})
app.post('/api/pharmacies', requireAuth, async (req,res)=>{
  try{
    const db = await readDB(); const now = new Date().toISOString()
    const body = req.body || {}
    if(Joi){
      const schema = Joi.object({ name: Joi.string().required(), phone: Joi.string().allow('',null), address: Joi.string().allow('',null), contact: Joi.string().allow('',null) })
      const { error, value } = schema.validate(body)
      if(error) return res.status(400).json({ error: error.message })
      Object.assign(body, value)
    }
    const p = { id: uid(), createdAt: now, ...body }
    db.pharmacies.push(p); await writeDB(db); res.json(p)
  }catch(e){ console.error(e); res.status(500).json({ error: 'Failed to create pharmacy' }) }
})
app.put('/api/pharmacies/:id', requireAuth, async (req,res)=>{
  const db = await readDB()
  const idx = db.pharmacies.findIndex(x=>x.id===req.params.id)
  if(idx<0) return res.status(404).end()
  db.pharmacies[idx] = { ...db.pharmacies[idx], ...req.body }
  await writeDB(db); res.json(db.pharmacies[idx])
})
app.delete('/api/pharmacies/:id', requireAuth, async (req,res)=>{
  const db = await readDB()
  db.pharmacies = db.pharmacies.filter(x=>x.id!==req.params.id)
  await writeDB(db); res.json({ok:true})
})

// ------- Distributions
app.get('/api/distributions', async (req,res)=>{
  const db = await readDB(); res.json(db.distributions)
})
app.post('/api/distributions', requireAuth, async (req,res)=>{
  try{
    const db = await readDB()
    const body = req.body || {}
    if(Joi){
      const schema = Joi.object({ pharmacyId: Joi.string().required(), date: Joi.string().isoDate().required(), items: Joi.array().items(Joi.object({ medicineId: Joi.string().required(), quantity: Joi.number().integer().min(1).required(), unitPrice: Joi.number().required(), discount: Joi.number().min(0).default(0) })).required(), notes: Joi.string().allow('',null).default('') })
      const { error, value } = schema.validate(body)
      if(error) return res.status(400).json({ error: error.message })
      Object.assign(body, value)
    }
    const d = { id: uid(), ...body }
    // decrement stocks
    d.items.forEach(it=>{
      const m = db.medicines.find(x=>x.id===it.medicineId)
      if(m){ m.stock = Math.max(0, (m.stock||0) - Number(it.quantity||0)) }
    })
    db.distributions.push(d)
    await writeDB(db); res.json(d)
  }catch(e){ console.error(e); res.status(500).json({ error: 'Failed to create distribution' }) }
})
app.put('/api/distributions/:id', requireAuth, async (req,res)=>{
  const db = await readDB()
  const idx = db.distributions.findIndex(x=>x.id===req.params.id)
  if(idx<0) return res.status(404).end()
  db.distributions[idx] = { ...db.distributions[idx], ...req.body }
  await writeDB(db); res.json(db.distributions[idx])
})
app.delete('/api/distributions/:id', requireAuth, async (req,res)=>{
  const db = await readDB()
  db.distributions = db.distributions.filter(x=>x.id!==req.params.id)
  await writeDB(db); res.json({ok:true})
})

// ------- Users & Auth
app.post('/api/auth/register', async (req,res)=>{
  const { email, password, name } = req.body
  if(!email || !password) return res.status(400).json({ error: 'Email and password required' })
  const db = await readDB()
  db.users = db.users || []
  if(db.users.find(u=>u.email===email)) return res.status(400).json({ error: 'User exists' })
  const hash = await bcrypt.hash(password, 10)
  const user = { id: uid(), email, name: name||'', passwordHash: hash }
  db.users.push(user); await writeDB(db)
  const token = generateToken(user)
  res.json({ user: { id: user.id, email: user.email, name: user.name }, token })
})

app.post('/api/auth/login', async (req,res)=>{
  const { email, password } = req.body
  if(!email || !password) return res.status(400).json({ error: 'Email and password required' })
  const db = await readDB(); db.users = db.users || []
  const user = db.users.find(u=>u.email===email)
  if(!user) return res.status(400).json({ error: 'Invalid credentials' })
  const ok = await bcrypt.compare(password, user.passwordHash || '')
  if(!ok) return res.status(400).json({ error: 'Invalid credentials' })
  const token = generateToken(user)
  res.json({ user: { id: user.id, email: user.email, name: user.name }, token })
})

app.get('/api/users', requireAuth, async (req,res)=>{
  const db = await readDB(); db.users = db.users || []
  const out = db.users.map(u=>({ id: u.id, email: u.email, name: u.name }))
  res.json(out)
})

// Simple sync endpoint - accepts partial changes and merges (last-write-wins)
app.post('/api/sync', requireAuth, (req,res)=>{
  const db = readDB()
  const { changes } = req.body || {}
  if(changes){
    // medicines
    if(Array.isArray(changes.medicines)){
      changes.medicines.forEach(m => {
        if(!m.id){ m.id = uid(); m.createdAt = new Date().toISOString(); db.medicines.push(m); return }
        const idx = db.medicines.findIndex(x=>x.id===m.id)
        if(idx>=0) db.medicines[idx] = { ...db.medicines[idx], ...m }
        else db.medicines.push(m)
      })
    }
    // pharmacies
    if(Array.isArray(changes.pharmacies)){
      changes.pharmacies.forEach(p => {
        if(!p.id){ p.id = uid(); p.createdAt = new Date().toISOString(); db.pharmacies.push(p); return }
        const idx = db.pharmacies.findIndex(x=>x.id===p.id)
        if(idx>=0) db.pharmacies[idx] = { ...db.pharmacies[idx], ...p }
        else db.pharmacies.push(p)
      })
    }
    // distributions
    if(Array.isArray(changes.distributions)){
      changes.distributions.forEach(d => {
        if(!d.id){ d.id = uid(); db.distributions.push(d)
          // decrement stock for new distributions
          d.items.forEach(it=>{
            const m = db.medicines.find(x=>x.id===it.medicineId)
            if(m){ m.stock = Math.max(0, (m.stock||0) - Number(it.quantity||0)) }
          })
          return
        }
        const idx = db.distributions.findIndex(x=>x.id===d.id)
        if(idx>=0) db.distributions[idx] = { ...db.distributions[idx], ...d }
        else db.distributions.push(d)
      })
    }
    writeDB(db)
  }
  // return current server state
  res.json(db)
})

// ------- KPI & CSV
app.get('/api/kpi', (req,res)=>{
  const { month } = req.query // YYYY-MM
  const db = readDB()
  const dist = db.distributions.filter(d => {
    const iso = d.date || ''
    return month ? iso.startsWith(month) : true
  })
  const turnover = dist.reduce((sum, d)=> sum + d.items.reduce((a, it)=> a + (it.unitPrice*it.quantity) - (it.discount||0), 0), 0)
  const cost = dist.reduce((sum, d)=> sum + d.items.reduce((a, it)=>{
    const med = db.medicines.find(m=>m.id===it.medicineId)
    return a + (med ? med.purchasePrice*it.quantity : 0)
  },0), 0)
  const profit = turnover - cost
  res.json({
    monthTurnover: turnover,
    monthProfit: profit,
    totalPharmacies: db.pharmacies.length,
    totalSKUs: db.medicines.length,
    currency: db.settings.currency
  })
})

// Settings endpoints
app.get('/api/settings', (req,res)=>{
  const db = readDB()
  res.json(db.settings || {})
})

app.put('/api/settings', requireAuth, (req,res)=>{
  const db = readDB()
  db.settings = { ...(db.settings||{}), ...req.body }
  writeDB(db)
  res.json(db.settings)
})

app.get('/api/export', (req,res)=>{
  const { fro, to } = req.query
  const db = readDB()
  const rows = [['Date','Pharmacy','Medicine','Qty','Unit Price','Discount','Line Total']]
  const fromT = fro ? new Date(fro).getTime() : null
  const toT   = to  ? new Date(to).getTime()  : null
  db.distributions.forEach(d=>{
    const t = new Date(d.date).getTime()
    if((fromT && t < fromT) || (toT && t > toT)) return
    const ph = db.pharmacies.find(p=>p.id===d.pharmacyId)?.name || ''
    d.items.forEach(it=>{
      const med = db.medicines.find(m=>m.id===it.medicineId)?.name || ''
      const line = (it.unitPrice*it.quantity) - (it.discount||0)
      rows.push([d.date, ph, med, it.quantity, it.unitPrice, it.discount||0, line])
    })
  })
  const csv = rows.map(r=>r.join(',')).join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="report.csv"')
  res.send("\ufeff" + csv)
})

// Serve production client build
import { createRequire } from 'module'
const clientDir = path.join(__dirname, '..', 'client', 'dist')
app.use(express.static(clientDir))
app.get('*', (req,res)=>{
  if(fs.existsSync(path.join(clientDir, 'index.html'))){
    res.sendFile(path.join(clientDir, 'index.html'))
  } else {
    res.send('Server running. Build client first.')
  }
})

app.listen(PORT, ()=> console.log(`API running on http://localhost:${PORT}`))