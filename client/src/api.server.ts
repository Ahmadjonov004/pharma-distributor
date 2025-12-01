import type { Medicine, Pharmacy, Distribution } from './types'

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '' // set VITE_API_BASE to your API origin in deployment

function getToken(){
  return localStorage.getItem('pharma_token')
}

function headers(){
  const t = getToken()
  return {
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {})
  }
}

async function jsonRes(res: Response){
  const text = await res.text()
  try{ return JSON.parse(text) }catch(e){ return text }
}

export const apiServer = {
  auth: {
    register: async (email: string, password: string, name?: string) => {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST', body: JSON.stringify({ email, password, name }), headers: { 'Content-Type':'application/json' }
      })
      if(!res.ok) throw await jsonRes(res)
      return res.json()
    },
    login: async (email: string, password: string) => {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST', body: JSON.stringify({ email, password }), headers: { 'Content-Type':'application/json' }
      })
      if(!res.ok) throw await jsonRes(res)
      return res.json()
    }
  },

  // fetch all main lists
  fetchAll: async () => {
    const [medsRes, phRes, distRes] = await Promise.all([
      fetch(`${API_BASE}/api/medicines`, { headers: headers() }),
      fetch(`${API_BASE}/api/pharmacies`, { headers: headers() }),
      fetch(`${API_BASE}/api/distributions`, { headers: headers() })
    ])
    if(!medsRes.ok || !phRes.ok || !distRes.ok) throw new Error('Failed to fetch server data')
    const medicines = await medsRes.json()
    const pharmacies = await phRes.json()
    const distributions = await distRes.json()
    return { medicines, pharmacies, distributions }
  },

  // sync changes object: { medicines: [], pharmacies: [], distributions: [] }
  sync: async (changes: any) => {
    const res = await fetch(`${API_BASE}/api/sync`, {
      method: 'POST', headers: headers(), body: JSON.stringify({ changes })
    })
    if(!res.ok) throw await jsonRes(res)
    return res.json()
  },

  // settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/api/settings`, { headers: headers() })
    if(!res.ok) throw await jsonRes(res)
    return res.json()
  },

  saveSettings: async (payload: any) => {
    const res = await fetch(`${API_BASE}/api/settings`, { method: 'PUT', headers: headers(), body: JSON.stringify(payload) })
    if(!res.ok) throw await jsonRes(res)
    return res.json()
  },

  // convenience wrappers for delete when needed
  deleteItem: async (category: 'medicines'|'pharmacies'|'distributions', id: string) => {
    const url = `${API_BASE}/api/${category}/${id}`
    const res = await fetch(url, { method: 'DELETE', headers: headers() })
    if(!res.ok) throw await jsonRes(res)
    return res.json()
  }
}

export default apiServer
