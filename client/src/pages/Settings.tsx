import { useCallback, useEffect, useState } from 'react'
import { useUserData } from '../hooks/useUserData'
import { useTheme } from '../hooks/useTheme'

export default function Settings(){
  const { currentUser } = useUserData()
  const { theme, setTheme } = useTheme()

  const [currency, setCurrency] = useState('UZS')
  const [distributorName, setDistributorName] = useState('Pharma Distributor')
  const [vat, setVat] = useState<number>(0)
  const [expiryAlerts, setExpiryAlerts] = useState(true)
  const [authEnabled, setAuthEnabled] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const storageKey = currentUser ? `pharma_data_${currentUser.id}` : null

  useEffect(()=>{
    if (!storageKey) return
    try{
      const raw = localStorage.getItem(storageKey)
      const db = raw ? JSON.parse(raw) : null
      const settings = db?.settings || { currency: 'UZS', distributorName: 'Pharma Distributor', vat: 0, expiryAlerts: true }
      setCurrency(settings.currency || 'UZS')
      setDistributorName(settings.distributorName || 'Pharma Distributor')
      setVat(typeof settings.vat === 'number' ? settings.vat : 0)
      setExpiryAlerts(Boolean(settings.expiryAlerts))
      setAuthEnabled(Boolean(settings.authEnabled))
      // theme handled separately by useTheme
    }catch(e){
      console.error('Failed to read settings', e)
    }
  }, [storageKey])

  const saveSettings = useCallback(()=>{
    if (!storageKey) return alert('Foydalanuvchi topilmadi')
    try{
      const raw = localStorage.getItem(storageKey)
      const db = raw ? JSON.parse(raw) : { medicines:[], pharmacies:[], distributions:[], settings: {} }
      const newDb = { ...db, settings: { ...db.settings, currency, distributorName, vat, expiryAlerts, authEnabled, theme } }
      localStorage.setItem(storageKey, JSON.stringify(newDb))
      setMessage('Sozlamalar saqlandi')
      setTimeout(()=>setMessage(null), 2500)
    }catch(e){
      console.error('Failed to save settings', e)
      alert('Saqlash vaqtida xatolik')
    }
  }, [storageKey, currency, distributorName, vat, expiryAlerts, authEnabled, theme])

  const resetDefaults = useCallback(()=>{
    setCurrency('UZS')
    setDistributorName('Pharma Distributor')
    setVat(0)
    setExpiryAlerts(true)
    setAuthEnabled(false)
    setTheme('light')
    setMessage('Sozlamalar tiklandi')
    setTimeout(()=>setMessage(null),2000)
  }, [setTheme])

  return (
    <div className='space-y-6 p-4 md:p-8'>
      <div>
        <h1 className='text-3xl font-bold text-slate-800 dark:text-slate-100'>⚙️ Sozlamalar</h1>
        <p className='text-slate-600 dark:text-slate-300 mt-2'>Tizim sozlamalari va konfiguratsiyasi</p>
      </div>

      <div className='card rounded-2xl p-6 shadow-md border-l-4 border-blue-500'>
        <h2 className='text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4'>💱 Umumiy sozlamalar</h2>
        <div className='grid md:grid-cols-3 gap-4'>
          <div>
            <label className='block text-sm text-slate-600 dark:text-slate-300 mb-1'>Pul birligi</label>
            <select value={currency} onChange={e=>setCurrency(e.target.value)} className='input w-full'>
              <option value='UZS'>UZS (So'm)</option>
              <option value='USD'>USD</option>
              <option value='EUR'>EUR</option>
            </select>
          </div>

          <div>
            <label className='block text-sm text-slate-600 dark:text-slate-300 mb-1'>Distributor nomi</label>
            <input className='input w-full' value={distributorName} onChange={e=>setDistributorName(e.target.value)} />
          </div>

          <div>
            <label className='block text-sm text-slate-600 dark:text-slate-300 mb-1'>QQS (%)</label>
            <input type='number' className='input w-full' value={vat} onChange={e=>setVat(Number(e.target.value))} />
          </div>
        </div>
        <div className='mt-4 flex items-center gap-3'>
          <button onClick={saveSettings} className='btn-primary'>Saqla</button>
          <button onClick={resetDefaults} className='btn'>Standartga qaytarish</button>
          {message && <div className='text-sm text-green-600 ml-3'>{message}</div>}
        </div>
      </div>

      <div className='card rounded-2xl p-6 shadow-md border-l-4 border-green-500'>
        <h2 className='text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4'>🏢 Distributor ma'lumoti</h2>
        <div className='grid md:grid-cols-2 gap-4'>
          <div>
            <p className='text-sm text-slate-600 dark:text-slate-300'>Nomi</p>
            <p className='text-lg font-semibold text-green-700 dark:text-green-300'>{distributorName}</p>
          </div>
          <div>
            <p className='text-sm text-slate-600 dark:text-slate-300'>Tizim versiyasi</p>
            <p className='text-lg font-semibold text-green-700 dark:text-green-300'>v1.0.0</p>
          </div>
        </div>
      </div>

      <div className='card rounded-2xl p-6 shadow-md border-l-4 border-purple-500'>
        <h2 className='text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4'>✨ Xususiyatlar</h2>
        <div className='grid md:grid-cols-2 gap-4'>
          <div className='bg-purple-50 dark:bg-slate-700/40 rounded-lg p-4 flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-700 dark:text-slate-200 mb-1'>🔐 Autentifikatsiya</p>
              <p className='text-slate-500 dark:text-slate-300 text-sm'>Ko'p foydalanuvchili kirish (tajriba)</p>
            </div>
            <label className='inline-flex items-center'>
              <input type='checkbox' className='mr-2' checked={authEnabled} onChange={e=>setAuthEnabled(e.target.checked)} />
              <span className='text-sm'>ON</span>
            </label>
          </div>

          <div className='bg-purple-50 dark:bg-slate-700/40 rounded-lg p-4 flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-700 dark:text-slate-200 mb-1'>🔔 Amal muddat ogohlantirish</p>
              <p className='text-slate-500 dark:text-slate-300 text-sm'>Muddat tugashidan oldin ogohlantirishlarni yoqish</p>
            </div>
            <label className='inline-flex items-center'>
              <input type='checkbox' className='mr-2' checked={expiryAlerts} onChange={e=>setExpiryAlerts(e.target.checked)} />
              <span className='text-sm'>ON</span>
            </label>
          </div>

          <div className='bg-purple-50 dark:bg-slate-700/40 rounded-lg p-4'>
            <p className='text-sm text-slate-700 dark:text-slate-200 mb-1'>📊 Hisobotlar</p>
            <p className='text-slate-500 dark:text-slate-300 text-sm'>CSV eksport, filtrlar va rejimlar mavjud</p>
          </div>

          <div className='bg-purple-50 dark:bg-slate-700/40 rounded-lg p-4'>
            <p className='text-sm text-slate-700 dark:text-slate-200 mb-1'>👥 Rollar</p>
            <p className='text-slate-500 dark:text-slate-300 text-sm'>Foydalanuvchi rollari va ruxsatlarni sozlash</p>
          </div>
        </div>
      </div>

      <div className='bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 shadow-md'>
        <h2 className='text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4'>📦 Dorilarni boshqarish</h2>
        <div className='space-y-3'>
          <div className='flex items-center justify-between p-4 card rounded-lg'>
            <span className='text-slate-700 dark:text-slate-200'>Batch / Expiry alerts</span>
            <span className='bg-yellow-100 text-yellow-700 dark:bg-yellow-800/20 dark:text-yellow-300 px-3 py-1 rounded-full text-sm font-semibold'>Status</span>
          </div>
          <div className='flex items-center justify-between p-4 card rounded-lg'>
            <span className='text-slate-700 dark:text-slate-200'>Qaytarilgan dorilar</span>
            <span className='bg-blue-100 text-blue-700 dark:bg-blue-800/20 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-semibold'>Status</span>
          </div>
          <div className='flex items-center justify-between p-4 card rounded-lg'>
            <span className='text-slate-700 dark:text-slate-200'>Zararlanmagan dorilar</span>
            <span className='bg-green-100 text-green-700 dark:bg-green-800/20 dark:text-green-300 px-3 py-1 rounded-full text-sm font-semibold'>Status</span>
          </div>
        </div>
      </div>

      <div className='card-muted rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700'>
        <p className='text-sm text-slate-600 dark:text-slate-300 leading-relaxed'>
          💡 <b>Maslahat:</b> Barcha sozlamalar saqlanganda lokal saqlovga yoziladi. Agar foydalanuvchi o'chirilsa, ma'lumotlar ham o'chadi.
        </p>
      </div>
    </div>
  )
}
