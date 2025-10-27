import { useEffect, useState } from 'react'
import type { Medicine } from '../types'
import { api } from '../api'
import { money, shortDate } from '../utils/format'

export default function Inventory(){
  const [items, setItems] = useState<Medicine[]>([])
  const [form, setForm] = useState({ name:'', sku:'', unit:'tablet', purchasePrice:0, salePrice:0, expiry:'', stock:0 })
  async function refresh(){ setItems(await api.listMedicines()) }
  useEffect(()=>{ refresh() },[])
  const submit = async () => {
    if(!form.name) return
    await api.createMedicine(form as any)
    setForm({ name:'', sku:'', unit:'tablet', purchasePrice:0, salePrice:0, expiry:'', stock:0 })
    refresh()
  }
  return (
    <div className='space-y-6'>
      <div className='flex items-end justify-between gap-4 flex-wrap'>
        <div>
          <h1 className='text-2xl font-semibold'>Inventory</h1>
          <p className='text-slate-600'>Current medicines & stock</p>
        </div>
        <div className='bg-white rounded-2xl p-4 shadow-soft w-full md:w-auto'>
          <div className='grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-3'>
            <input className='input' placeholder='Name' value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
            <input className='input' placeholder='SKU' value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} />
            <select className='input' value={form.unit} onChange={e=>setForm({...form, unit: e.target.value as any})}>
              <option>tablet</option><option>capsule</option><option>ml</option><option>g</option><option>pack</option><option>bottle</option><option>other</option>
            </select>
            <input className='input' type='number' placeholder='Purchase price' value={form.purchasePrice} onChange={e=>setForm({...form, purchasePrice:Number(e.target.value)})} />
            <input className='input' type='number' placeholder='Sale price' value={form.salePrice} onChange={e=>setForm({...form, salePrice:Number(e.target.value)})} />
            <input className='input' type='date' value={form.expiry} onChange={e=>setForm({...form, expiry:e.target.value})} />
            <input className='input' type='number' placeholder='Stock' value={form.stock} onChange={e=>setForm({...form, stock:Number(e.target.value)})} />
            <button onClick={submit} className='btn-primary'>Add medicine</button>
          </div>
        </div>
      </div>
      <div className='bg-white rounded-2xl p-4 shadow-soft overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead className='text-left text-slate-500'>
            <tr>
              <th className='py-2'>Name</th>
              <th>SKU</th>
              <th>Unit</th>
              <th>Expiry</th>
              <th>Purchase</th>
              <th>Sale</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(m => (
              <tr key={m.id} className='border-t'>
                <td className='py-2 font-medium'>{m.name}</td>
                <td>{m.sku}</td>
                <td>{m.unit}</td>
                <td>{shortDate(m.expiry)}</td>
                <td>{money(m.purchasePrice)}</td>
                <td>{money(m.salePrice)}</td>
                <td>{m.stock}</td>
                <td className='text-right'>
                  <div className='flex gap-2 justify-end'>
                    <button className='btn' onClick={async()=>{ await api.updateMedicine(m.id, { stock: m.stock + 100 }); refresh() }}>+100</button>
                    <button className='btn' onClick={async()=>{ await api.deleteMedicine(m.id); refresh() }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
