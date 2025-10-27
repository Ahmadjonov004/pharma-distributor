import { useEffect, useMemo, useState } from 'react'
import type { Pharmacy, Medicine } from '../types'
import { api } from '../api'
import { money } from '../utils/format'

export default function Distribute(){
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [pharmacyId, setPharmacyId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [lines, setLines] = useState<{medicineId:string, quantity:number, unitPrice:number, discount:number}[]>([])
  const [notes, setNotes] = useState('')

  useEffect(()=>{ api.listPharmacies().then(list=>{ setPharmacies(list); setPharmacyId(list[0]?.id||'') }); api.listMedicines().then(setMedicines) },[])

  const addLine = () => { if(!medicines[0]) return; setLines([...lines, { medicineId: medicines[0].id, quantity: 1, unitPrice: medicines[0].salePrice, discount: 0 }]) }
  const total = useMemo(()=> lines.reduce((s,l)=> s + (l.unitPrice*l.quantity) - (l.discount||0), 0), [lines])

  const submit = async () => {
    if(!pharmacyId || lines.length===0) return
    await api.createDistribution({ pharmacyId, date: new Date(date).toISOString(), items: lines.map(l=>({ medicineId: l.medicineId, quantity: l.quantity, unitPrice: l.unitPrice, discount: l.discount||0 })), notes })
    setLines([]); setNotes(''); alert('Distribution saved!')
  }

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-semibold'>Distribute</h1>
      <div className='bg-white rounded-2xl p-4 shadow-soft space-y-4'>
        <div className='grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-3'>
          <select className='input' value={pharmacyId} onChange={e=>setPharmacyId(e.target.value)}>
            {pharmacies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input className='input' type='date' value={date} onChange={e=>setDate(e.target.value)} />
          <button className='btn-primary' onClick={addLine}>+ Add line</button>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='text-left text-slate-500'><tr><th>Medicine</th><th>Qty</th><th>Unit price</th><th>Discount</th><th>Line total</th><th></th></tr></thead>
            <tbody>
              {lines.map((l,idx)=>{
                const lineTotal = (l.quantity*l.unitPrice) - (l.discount||0)
                return (
                  <tr key={idx} className='border-t'>
                    <td>
                      <select className='input' value={l.medicineId} onChange={e=>{ const id=e.target.value; const m=medicines.find(x=>x.id===id)!; const clone=[...lines]; clone[idx]={...clone[idx], medicineId:id, unitPrice:m.salePrice}; setLines(clone) }}>
                        {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </td>
                    <td><input className='input w-28' type='number' value={l.quantity} onChange={e=>{ const clone=[...lines]; clone[idx].quantity=Number(e.target.value); setLines(clone)}}/></td>
                    <td><input className='input w-32' type='number' value={l.unitPrice} onChange={e=>{ const clone=[...lines]; clone[idx].unitPrice=Number(e.target.value); setLines(clone)}}/></td>
                    <td><input className='input w-28' type='number' value={l.discount} onChange={e=>{ const clone=[...lines]; clone[idx].discount=Number(e.target.value); setLines(clone)}}/></td>
                    <td className='font-medium'>{money(lineTotal)}</td>
                    <td><button className='btn' onClick={()=>{ const clone=[...lines]; clone.splice(idx,1); setLines(clone)}}>Remove</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <textarea className='input w-full' placeholder='Notes' value={notes} onChange={e=>setNotes(e.target.value)} />
        <div className='flex items-center justify-between flex-wrap gap-2'>
          <div className='text-lg font-semibold'>Total: {money(total)}</div>
          <button className='btn-primary' onClick={submit}>Save distribution</button>
        </div>
      </div>
    </div>
  )
}
