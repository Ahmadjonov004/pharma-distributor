
import { useEffect, useState } from 'react'
import { api } from '../api'
import { money } from '../utils/format'

type Supplier = { id:string; name:string; contact?:string }
type Medicine = { id:string; name:string }
type PurchaseItem = { medicineId:string; quantity:number; unitCost:number }

export default function Suppliers(){
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [form, setForm] = useState<{name:string, contact?:string}>({name:''})
  const [po, setPO] = useState<{supplierId:string, items:PurchaseItem[]}>({supplierId:'', items:[]})

  useEffect(()=>{ 
    api.listSuppliers().then(setSuppliers)
    api.listMedicines().then(setMedicines)
  }, [])

  const addSupplier = async ()=>{
    if(!form.name.trim()) return
    const s = await api.createSupplier(form)
    setSuppliers([s, ...suppliers])
    setForm({name:''})
  }

  const addItem = ()=> setPO({...po, items:[...po.items, {medicineId: medicines[0]?.id||'', quantity:1, unitCost:0}]})
  const submitPO = async ()=>{
    if(!po.supplierId || po.items.length===0) return
    await api.createPurchase({supplierId: po.supplierId, items: po.items})
    setPO({supplierId:'', items:[]})
    alert('Xarid qo\'shildi (sklad yangilandi)')
  }

  return (
    <div className="space-y-8">
      <section className="bg-white/60 rounded-2xl p-4 shadow">
        <h2 className="text-xl font-semibold mb-4">Yangi parmaset firma qo'shish</h2>
        <div className="flex gap-2 items-end flex-wrap">
          <div>
            <label className="block text-sm">Nomi</label>
            <input className="border rounded-lg p-2" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
          </div>
          <div>
            <label className="block text-sm">Aloqa</label>
            <input className="border rounded-lg p-2" value={form.contact||''} onChange={e=>setForm({...form, contact:e.target.value})}/>
          </div>
          <button onClick={addSupplier} className="px-4 py-2 bg-blue-600 text-white rounded-xl">Qo'shish</button>
        </div>
        <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {suppliers.map(s=>(
            <div key={s.id} className="border rounded-xl p-3 bg-white">
              <div className="font-medium">{s.name}</div>
              <div className="text-sm text-gray-600">{s.contact||'-'}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/60 rounded-2xl p-4 shadow">
        <h2 className="text-xl font-semibold mb-4">Taminotchidan xarid (stock +)</h2>
        <div className="flex flex-col gap-3">
          <select className="border rounded-lg p-2 w-full md:w-80" value={po.supplierId} onChange={e=>setPO({...po, supplierId:e.target.value})}>
            <option value="">Taminotchini tanlang</option>
            {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <div className="space-y-2">
            {po.items.map((it,idx)=>(
              <div key={idx} className="flex gap-2 flex-wrap items-center">
                <select className="border rounded-lg p-2" value={it.medicineId} onChange={e=>{
                  const items=[...po.items]; items[idx]={...it, medicineId:e.target.value}; setPO({...po, items})
                }}>
                  {medicines.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <input type="number" className="border rounded-lg p-2 w-24" value={it.quantity} onChange={e=>{
                  const items=[...po.items]; items[idx]={...it, quantity:Number(e.target.value)}; setPO({...po, items})
                }}/>
                <input type="number" className="border rounded-lg p-2 w-28" value={it.unitCost} onChange={e=>{
                  const items=[...po.items]; items[idx]={...it, unitCost:Number(e.target.value)}; setPO({...po, items})
                }}/>
              </div>
            ))}
            <button onClick={addItem} className="px-3 py-1.5 border rounded-lg">+ Qator</button>
          </div>
          <button onClick={submitPO} className="self-start px-4 py-2 bg-emerald-600 text-white rounded-xl">Xaridni saqlash</button>
        </div>
      </section>
    </div>
  )
}
