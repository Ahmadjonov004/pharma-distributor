import { useEffect, useState } from 'react'
import type { Pharmacy } from '../types'
import { api } from '../api'

export default function Pharmacies(){
  const [list, setList] = useState<Pharmacy[]>([])
  const [form, setForm] = useState({ name:'', phone:'', address:'', contact:'' })
  async function refresh(){ setList(await api.listPharmacies()) }
  useEffect(()=>{ refresh() },[])
  const submit = async () => { if(!form.name) return; await api.createPharmacy(form as any); setForm({ name:'', phone:'', address:'', contact:'' }); refresh() }
  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-semibold'>Pharmacies</h1>
      <div className='bg-white rounded-2xl p-4 shadow-soft'>
        <div className='grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-3'>
          <input className='input' placeholder='Name' value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
          <input className='input' placeholder='Phone' value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})}/>
          <input className='input' placeholder='Address' value={form.address} onChange={e=>setForm({...form, address:e.target.value})}/>
          <input className='input' placeholder='Contact person' value={form.contact} onChange={e=>setForm({...form, contact:e.target.value})}/>
          <button className='btn-primary' onClick={submit}>Add pharmacy</button>
        </div>
      </div>
      <div className='bg-white rounded-2xl p-4 shadow-soft overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead className='text-left text-slate-500'><tr><th>Name</th><th>Phone</th><th>Address</th><th>Contact</th><th></th></tr></thead>
          <tbody>
            {list.map(p=> (
              <tr key={p.id} className='border-t'>
                <td className='py-2 font-medium'>{p.name}</td>
                <td>{p.phone}</td>
                <td>{p.address}</td>
                <td>{p.contact}</td>
                <td className='text-right'><button className='btn' onClick={async()=>{ await api.deletePharmacy(p.id); refresh() }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
