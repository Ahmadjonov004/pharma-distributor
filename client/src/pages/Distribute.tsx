import { useEffect, useMemo, useState } from 'react'
import type { Pharmacy, Medicine } from '../types'
import { useUserData } from '../hooks/useUserData'
import { money } from '../utils/format'

export default function Tarqatish(){
  const { listPharmacies, listMedicines, createDistribution } = useUserData()
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [pharmacyId, setPharmacyId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [lines, setLines] = useState<{medicineId:string, quantity:number, unitPrice:number, discount:number}[]>([])
  const [notes, setNotes] = useState('')

  useEffect(()=>{
    const pharms = listPharmacies()
    const meds = listMedicines()
    setPharmacies(pharms)
    setMedicines(meds)
    setPharmacyId(pharms[0]?.id||'')
  }, [listPharmacies, listMedicines])

  const addLine = () => {
    if(!medicines[0]) return
    setLines([...lines, { medicineId: medicines[0].id, quantity: 1, unitPrice: medicines[0].salePrice, discount: 0 }])
  }

  const total = useMemo(()=> lines.reduce((s,l)=> s + (l.unitPrice*l.quantity) - (l.discount||0), 0), [lines])

  const submit = async () => {
    if(!pharmacyId || lines.length===0) return
    createDistribution({ pharmacyId, date: new Date(date).toISOString(), items: lines.map(l=>({ medicineId: l.medicineId, quantity: l.quantity, unitPrice: l.unitPrice, discount: l.discount||0 })), notes })
    setLines([]); setNotes(''); alert('Tarqatish saqlandi!')
  }

  return (
    <div className='space-y-6 p-4 md:p-6'>
      <h1 className='text-3xl font-bold text-slate-800'>Dori tarqatish</h1>

      <div className='bg-white rounded-2xl p-5 shadow-xl space-y-5 border border-slate-100'>
        <div className='grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-3'>
          <select className='input rounded-xl border p-2' value={pharmacyId} onChange={e=>setPharmacyId(e.target.value)}>
            {pharmacies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <input className='input rounded-xl border p-2' type='date' value={date} onChange={e=>setDate(e.target.value)} />

          <button className='bg-blue-600 hover:bg-blue-700 transition text-white rounded-xl py-2 font-medium' onClick={addLine}>+ Qator qo'shish</button>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='text-left text-slate-500 bg-slate-50'>
              <tr className='border-b'>
                <th className='p-2'>Dori nomi</th>
                <th className='p-2'>Soni</th>
                <th className='p-2'>Narxi</th>
                <th className='p-2'>Jami</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {lines.map((l,idx)=>{
                const lineTotal = (l.quantity*l.unitPrice) - (l.discount||0)
                return (
                  <tr key={idx} className='border-b'>
                    <td className='p-2'>
                      <select className='border rounded-lg p-2' value={l.medicineId} onChange={e=>{ const id=e.target.value; const m=medicines.find(x=>x.id===id)!; const clone=[...lines]; clone[idx]={...clone[idx], medicineId:id, unitPrice:m.salePrice}; setLines(clone) }}>
                        {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </td>

                    <td className='p-2'><input className='border rounded-lg w-24 p-2' type='number' value={l.quantity} onChange={e=>{ const clone=[...lines]; clone[idx].quantity=Number(e.target.value); setLines(clone)}}/></td>

                    <td className='p-2'><input className='border rounded-lg w-28 p-2' type='number' value={l.unitPrice} onChange={e=>{ const clone=[...lines]; clone[idx].unitPrice=Number(e.target.value); setLines(clone)}}/></td>

                    {/* <td className='p-2'><input className='border rounded-lg w-20 p-2' type='number' value={l.discount} onChange={e=>{ const clone=[...lines]; clone[idx].discount=Number(e.target.value); setLines(clone)}}/></td> */}

                    <td className='p-2 font-semibold text-slate-700'>{money(lineTotal)}</td>

                    <td className='p-2'>
                      <button className='text-red-600 hover:text-red-800 font-medium' onClick={()=>{ const clone=[...lines]; clone.splice(idx,1); setLines(clone)}}>O'chirish</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <textarea className='w-full border rounded-xl p-3' placeholder='Izohlar...' value={notes} onChange={e=>setNotes(e.target.value)} />

        <div className='flex items-center justify-between flex-wrap gap-2'>
          <div className='text-xl font-semibold text-slate-800'>Umumiy: {money(total)}</div>
          <button className='bg-green-600 hover:bg-green-700 transition text-white rounded-xl px-6 py-2 font-semibold' onClick={submit}>Saqlash</button>
        </div>
      </div>
    </div>
  )
}
