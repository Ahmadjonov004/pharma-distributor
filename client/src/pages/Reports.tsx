import { useEffect, useMemo, useState } from 'react'
import type { Distribution, Medicine, Pharmacy } from '../types'
import { api } from '../api'
import { money, shortDate } from '../utils/format'

export default function Reports(){
  const [dists, setDists] = useState<Distribution[]>([])
  const [meds, setMeds] = useState<Medicine[]>([])
  const [phs, setPhs] = useState<Pharmacy[]>([])
  const [fro, setFrom] = useState('')
  const [to, setTo] = useState('')
  useEffect(()=>{ api.listDistributions().then(setDists); api.listMedicines().then(setMeds); api.listPharmacies().then(setPhs) },[])
  const filtered = useMemo(()=> dists.filter(d=>{ const t=new Date(d.date).getTime(); const okF=fro? t>=new Date(fro).getTime():true; const okT=to? t<=new Date(to).getTime():true; return okF && okT }), [dists,fro,to])
  const total = filtered.reduce((s,d)=> s + d.items.reduce((a,i)=> a + (i.unitPrice*i.quantity) - (i.discount||0), 0), 0)
  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-semibold'>Reports</h1>
      <div className='bg-white rounded-2xl p-4 shadow-soft grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-3'>
        <input type='date' className='input' value={fro} onChange={e=>setFrom(e.target.value)} />
        <input type='date' className='input' value={to} onChange={e=>setTo(e.target.value)} />
        <button className='btn' onClick={()=>{ setFrom(''); setTo('') }}>Reset</button>
        <button className='btn-primary' onClick={()=>api.exportCSV(fro||undefined, to||undefined)}>Export CSV</button>
      </div>
      <div className='bg-white rounded-2xl p-4 shadow-soft overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead className='text-left text-slate-500'>
            <tr><th>Date</th><th>Pharmacy</th><th>Items</th><th>Total</th></tr>
          </thead>
          <tbody>
            {filtered.map(d => { const ph=phs.find(p=>p.id===d.pharmacyId)?.name||''; const sum=d.items.reduce((a,it)=> a + (it.unitPrice*it.quantity) - (it.discount||0), 0); return (
              <tr key={d.id} className='border-t'>
                <td className='py-2'>{shortDate(d.date)}</td>
                <td>{ph}</td>
                <td>{d.items.length}</td>
                <td className='font-medium'>{money(sum)}</td>
              </tr>
            ) })}
          </tbody>
        </table>
      </div>
      <div className='text-right text-lg font-semibold'>Total: {money(total)}</div>
    </div>
  )
}
