export default function Settings(){
  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-semibold'>Settings</h1>
      <div className='bg-white rounded-2xl p-4 shadow-soft'>
        <div className='text-slate-600'>Currency: <b>UZS</b> (server db.json - settings)</div>
        <div className='text-slate-600'>Distributor: <b>Pharma Distributor</b></div>
        <p className='text-sm text-slate-500 mt-2'>Later: auth, VAT, roles, print invoices, debtors, returns, batch/expiry alerts.</p>
      </div>
    </div>
  )
}
