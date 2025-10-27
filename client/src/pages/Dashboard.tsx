import { useEffect, useState } from 'react'
import { api } from '../api'
import { money } from '../utils/format'

export default function Dashboard(){
  const [kpi, setKpi] = useState({monthTurnover:0, monthProfit:0, totalPharmacies:0, totalSKUs:0, currency:'UZS' as 'UZS'|'USD'})
  useEffect(()=>{ api.getKPI().then(setKpi) },[])
  const Card=({title,value}:{title:string,value:string})=> (
    <div className='bg-white rounded-2xl p-5 shadow-soft'>
      <div className='text-sm text-slate-500'>{title}</div>
      <div className='text-2xl font-semibold mt-1'>{value}</div>
    </div>
  )
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold'>Dashboard</h1>
        <p className='text-slate-600'>This month overview</p>
      </div>
      <div className='grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-4'>
        <Card title='Monthly Turnover' value={money(kpi.monthTurnover, kpi.currency)} />
        <Card title='Monthly Profit' value={money(kpi.monthProfit, kpi.currency)} />
        <Card title='Total Pharmacies' value={String(kpi.totalPharmacies)} />
        <Card title='Total SKUs' value={String(kpi.totalSKUs)} />
      </div>
    </div>
  )
}
