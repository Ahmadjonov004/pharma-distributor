import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Distribute from './pages/Distribute'
import Pharmacies from './pages/Pharmacies'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import { Home, Package, Truck, Building2, BarChart3, Settings as Cog } from 'lucide-react'

function Frame(){
  const nav=[{to:'/',label:'Dashboard',icon:Home},{to:'/inventory',label:'Inventory',icon:Package},{to:'/distribute',label:'Distribute',icon:Truck},{to:'/pharmacies',label:'Pharmacies',icon:Building2},{to:'/reports',label:'Reports',icon:BarChart3},{to:'/settings',label:'Settings',icon:Cog}]
  return (
    <div className='min-h-screen grid md:grid-cols-[260px_1fr]'>
      <aside className='bg-white shadow-soft md:sticky md:top-0 h-full'>
        <div className='p-5 border-b'>
          <div className='text-lg font-semibold'>💊Narimon Pharma</div>
          <div className='text-xs text-slate-500'>Asilbek</div>
        </div>
        <nav className='p-3 space-y-1'>
          {nav.map(n=>{ const Icon=n.icon as any; return (
            <NavLink key={n.to} to={n.to} end={n.to==='/' } className={({isActive})=>`flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 ${isActive?'bg-slate-200 font-medium':''}`}>
              <Icon size={18}/> {n.label}
            </NavLink>
          )})}
        </nav>
      </aside>
      <main className='p-4 md:p-8'>
        <Routes>
          <Route path='/' element={<Dashboard/>}/>
          <Route path='/inventory' element={<Inventory/>}/>
          <Route path='/distribute' element={<Distribute/>}/>
          <Route path='/pharmacies' element={<Pharmacies/>}/>
          <Route path='/reports' element={<Reports/>}/>
          <Route path='/settings' element={<Settings/>}/>
        </Routes>
      </main>
    </div>
  )
}
export default function App(){ return <Frame/> }
