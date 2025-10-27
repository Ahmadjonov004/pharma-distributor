import express from 'express'
import fs from 'fs'
import path from 'path'
import cors from 'cors'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
const PORT = process.env.PORT || 8080

app.use(cors())
app.use(express.json())

const dbPath = path.join(__dirname, 'db.json')

function readDB(){
  return JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
}
function writeDB(data){
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8')
}
function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36) }

// ------- Medicines
app.get('/api/medicines', (req,res)=>{
  const db = readDB(); res.json(db.medicines)
})
app.post('/api/medicines', (req,res)=>{
  const db = readDB(); const now = new Date().toISOString()
  const m = { id: uid(), createdAt: now, ...req.body }
  db.medicines.push(m); writeDB(db); res.json(m)
})
app.put('/api/medicines/:id', (req,res)=>{
  const db = readDB()
  const idx = db.medicines.findIndex(x=>x.id===req.params.id)
  if(idx<0) return res.status(404).end()
  db.medicines[idx] = { ...db.medicines[idx], ...req.body }
  writeDB(db); res.json(db.medicines[idx])
})
app.delete('/api/medicines/:id', (req,res)=>{
  const db = readDB()
  db.medicines = db.medicines.filter(x=>x.id!==req.params.id)
  writeDB(db); res.json({ok:true})
})

// ------- Pharmacies
app.get('/api/pharmacies', (req,res)=>{
  const db = readDB(); res.json(db.pharmacies)
})
app.post('/api/pharmacies', (req,res)=>{
  const db = readDB(); const now = new Date().toISOString()
  const p = { id: uid(), createdAt: now, ...req.body }
  db.pharmacies.push(p); writeDB(db); res.json(p)
})
app.delete('/api/pharmacies/:id', (req,res)=>{
  const db = readDB()
  db.pharmacies = db.pharmacies.filter(x=>x.id!==req.params.id)
  writeDB(db); res.json({ok:true})
})

// ------- Distributions
app.get('/api/distributions', (req,res)=>{
  const db = readDB(); res.json(db.distributions)
})
app.post('/api/distributions', (req,res)=>{
  const db = readDB()
  const d = { id: uid(), ...req.body }
  // decrement stocks
  d.items.forEach(it=>{
    const m = db.medicines.find(x=>x.id===it.medicineId)
    if(m){ m.stock = Math.max(0, (m.stock||0) - Number(it.quantity||0)) }
  })
  db.distributions.push(d)
  writeDB(db); res.json(d)
})
app.delete('/api/distributions/:id', (req,res)=>{
  const db = readDB()
  db.distributions = db.distributions.filter(x=>x.id!==req.params.id)
  writeDB(db); res.json({ok:true})
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