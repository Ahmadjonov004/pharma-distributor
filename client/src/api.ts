import type { Medicine, Pharmacy, Distribution } from './types'
const API='/api'
export const api={
  listMedicines: async():Promise<Medicine[]>=> (await fetch(`${API}/medicines`)).json(),
  createMedicine: async(m:Omit<Medicine,'id'|'createdAt'>):Promise<Medicine>=> (await fetch(`${API}/medicines`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(m)})).json(),
  updateMedicine: async(id:string,patch:Partial<Medicine>):Promise<Medicine>=> (await fetch(`${API}/medicines/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)})).json(),
  deleteMedicine: async(id:string):Promise<void>=>{ await fetch(`${API}/medicines/${id}`,{method:'DELETE'}) },
  listPharmacies: async():Promise<Pharmacy[]>=> (await fetch(`${API}/pharmacies`)).json(),
  createPharmacy: async(p:Omit<Pharmacy,'id'|'createdAt'>):Promise<Pharmacy>=> (await fetch(`${API}/pharmacies`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)})).json(),
  deletePharmacy: async(id:string):Promise<void>=>{ await fetch(`${API}/pharmacies/${id}`,{method:'DELETE'}) },
  listDistributions: async():Promise<Distribution[]>=> (await fetch(`${API}/distributions`)).json(),
  createDistribution: async(d:Omit<Distribution,'id'>):Promise<Distribution>=> (await fetch(`${API}/distributions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})).json(),
  deleteDistribution: async(id:string):Promise<void>=>{ await fetch(`${API}/distributions/${id}`,{method:'DELETE'}) },
  getKPI: async(month?:string): Promise<{monthTurnover:number;monthProfit:number;totalPharmacies:number;totalSKUs:number;currency:'UZS'|'USD'}>=> (await fetch(`${API}/kpi${month?`?month=${month}`:''}`)).json(),
  exportCSV:(fro?:string,to?:string)=>{ const url=`${API}/export${(fro||to)?`?${new URLSearchParams({fro:fro||'',to:to||''}).toString()}`:''}`; window.location.href=url }
}
