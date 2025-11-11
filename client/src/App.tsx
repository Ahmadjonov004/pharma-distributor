import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Distribute from './pages/Distribute'
import Pharmacies from './pages/Pharmacies'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import SupplierAnalytics from './pages/SupplierAnalytics'
import Auth from './pages/Auth'
import { Home, Package, Truck, Building2, BarChart3, Settings as Cog, Factory, LogOut } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
}

function Frame() {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Login qilingan foydalanuvchini olish
    const currentUser = localStorage.getItem('pharma_currentUser')
    if (currentUser) {
      setUser(JSON.parse(currentUser))
    } else {
      navigate('/auth')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('pharma_currentUser')
    setUser(null)
    navigate('/auth')
  }

  if (!user) {
    return <Auth />
  }
  const nav=[
    {to:'/',label:'Boshqaruv paneli',icon:Home},
    {to:'/inventory',label:'Ombor',icon:Package},
    {to:'/distribute',label:'Tarqatish',icon:Truck},
    {to:'/pharmacies',label:'Dorixonalar',icon:Building2},
    {to:'/suppliers',label:'Firmalar',icon:Factory},
    {to:'/reports',label:'Hisobotlar',icon:BarChart3},
    {to:'/settings',label:'Sozlamalar',icon:Cog}
  ]
  return (
    <div className='min-h-screen grid md:grid-cols-[240px_1fr] bg-slate-50'>
      <aside className='bg-white shadow-lg md:sticky md:top-0 h-full border-r flex flex-col'>
        <div className='p-5 border-b'>
          <div className='text-xl font-semibold text-slate-700'>💊 Narimon Pharma</div>
          <div className='text-xs text-slate-500'>Asilbek</div>
        </div>
        <nav className='p-3 space-y-1 flex-1'>
          {nav.map(n=>{ const Icon=n.icon as any; return (
            <NavLink key={n.to} to={n.to} end={n.to==='/' } className={({isActive})=>`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 hover:bg-slate-100 ${isActive?'bg-slate-200 text-slate-900 font-semibold':'text-slate-600'}`}>
              <Icon size={18}/> {n.label}
            </NavLink>
          )})}
        </nav>

        {/* Foydalanuvchi ma'lumoti va Logout */}
        <div className='p-4 border-t space-y-3'>
          <div className='bg-blue-50 rounded-lg p-3'>
            <p className='text-xs text-slate-500'>Tizimga kirgan:</p>
            <p className='text-sm font-semibold text-slate-800 truncate'>{user?.name}</p>
            <p className='text-xs text-slate-600 truncate'>{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className='w-full flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition font-semibold'
          >
            <LogOut size={18} />
            Chiqish
          </button>
        </div>
      </aside>
      <main className='p-4 md:p-8 w-full'>
        <Routes>
          <Route path='/auth' element={<Auth/>}/>
          <Route path='/' element={<Dashboard/>}/>
          <Route path='/inventory' element={<Inventory/>}/>
          <Route path='/distribute' element={<Distribute/>}/>
          <Route path='/pharmacies' element={<Pharmacies/>}/>
          <Route path='/suppliers' element={<SupplierAnalytics/>}/>
          <Route path='/reports' element={<Reports/>}/>
          <Route path='/settings' element={<Settings/>}/>
        </Routes>
      </main>
    </div>
  )
}
export default function App(){ return <Frame/> }
