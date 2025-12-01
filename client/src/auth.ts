import apiServer from './api.server'

export async function register(email: string, password: string, name?: string){
  const res = await apiServer.auth.register(email, password, name)
  // res: { user, token }
  if(res && res.token){
    localStorage.setItem('pharma_token', res.token)
    localStorage.setItem('pharma_currentUser', JSON.stringify(res.user))
    // option: seed local data from server
    try{
      const srv = await apiServer.fetchAll()
      localStorage.setItem(`pharma_data_${res.user.id}`, JSON.stringify({
        medicines: srv.medicines || [],
        pharmacies: srv.pharmacies || [],
        distributions: srv.distributions || [],
        settings: srv.settings || { currency: 'UZS', distributorName: 'Pharma Distributor' }
      }))
    }catch(e){ /* ignore */ }
  }
  return res
}

export async function login(email: string, password: string){
  const res = await apiServer.auth.login(email, password)
  if(res && res.token){
    localStorage.setItem('pharma_token', res.token)
    localStorage.setItem('pharma_currentUser', JSON.stringify(res.user))
    try{
      const srv = await apiServer.fetchAll()
      localStorage.setItem(`pharma_data_${res.user.id}`, JSON.stringify({
        medicines: srv.medicines || [],
        pharmacies: srv.pharmacies || [],
        distributions: srv.distributions || [],
        settings: srv.settings || { currency: 'UZS', distributorName: 'Pharma Distributor' }
      }))
    }catch(e){ /* ignore */ }
  }
  return res
}

export function logout(){
  localStorage.removeItem('pharma_token')
  localStorage.removeItem('pharma_currentUser')
}

export default { register, login, logout }
