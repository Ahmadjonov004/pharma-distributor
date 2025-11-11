import type { Medicine, Pharmacy, Distribution } from './types';import type { Medicine, Pharmacy, Distribution } from './types';

const API = '/api';

// Hozirgi foydalanuvchini olish

const getCurrentUser = () => {export const api = {

  const user = localStorage.getItem('pharma_currentUser')  listMedicines: async (): Promise<Medicine[]> =>

  return user ? JSON.parse(user) : null    (await fetch(`${API}/medicines`)).json(),

}

  createMedicine: async (

// Foydalanuvchi ma'lumotlar bazasini olish    m: Omit<Medicine, 'id' | 'createdAt'>

const getUserData = () => {  ): Promise<Medicine> =>

  const user = getCurrentUser()    (

  if (!user) return null      await fetch(`${API}/medicines`, {

  const data = localStorage.getItem(`pharma_data_${user.id}`)        method: 'POST',

  return data ? JSON.parse(data) : {        headers: { 'Content-Type': 'application/json' },

    medicines: [],        body: JSON.stringify(m),

    pharmacies: [],      })

    distributions: [],    ).json(),

    settings: { currency: 'UZS', distributorName: 'Pharma Distributor' }

  }  updateMedicine: async (

}    id: string,

    patch: Partial<Medicine>

// Foydalanuvchi ma'lumotlar bazasini saqlash  ): Promise<Medicine> =>

const saveUserData = (data: any) => {    (

  const user = getCurrentUser()      await fetch(`${API}/medicines/${id}`, {

  if (!user) return        method: 'PUT',

  localStorage.setItem(`pharma_data_${user.id}`, JSON.stringify(data))        headers: { 'Content-Type': 'application/json' },

}        body: JSON.stringify(patch),

      })

export const api = {    ).json(),

  listMedicines: async (): Promise<Medicine[]> => {

    const userDB = getUserData()  // 🛠 To‘g‘rilangan updatePharmacy

    return userDB?.medicines || []  updatePharmacy: async (id: string, patch: Partial<Pharmacy>): Promise<Pharmacy> =>

  },  (await fetch(`${API}/pharmacies/${id}`, {

    method: 'PUT',

  createMedicine: async (    headers: { 'Content-Type': 'application/json' },

    m: Omit<Medicine, 'id' | 'createdAt'>    body: JSON.stringify(patch), // ✅ Faqat tahrirlangan maydonlarni yuboramiz

  ): Promise<Medicine> => {  })).json(),

    const newMedicine: Medicine = {

      ...m,

      id: Date.now().toString(),  deleteMedicine: async (id: string): Promise<void> => {

      createdAt: new Date().toISOString()    await fetch(`${API}/medicines/${id}`, { method: 'DELETE' });

    }  },

    const userDB = getUserData()

    if (!userDB) throw new Error('Not authenticated')  listPharmacies: async (): Promise<Pharmacy[]> =>

    const updated = {    (await fetch(`${API}/pharmacies`)).json(),

      ...userDB,

      medicines: [...(userDB?.medicines || []), newMedicine]  createPharmacy: async (

    }    p: Omit<Pharmacy, 'id' | 'createdAt'>

    saveUserData(updated)  ): Promise<Pharmacy> =>

    return newMedicine    (

  },      await fetch(`${API}/pharmacies`, {

        method: 'POST',

  updateMedicine: async (        headers: { 'Content-Type': 'application/json' },

    id: string,        body: JSON.stringify(p),

    patch: Partial<Medicine>      })

  ): Promise<Medicine> => {    ).json(),

    const userDB = getUserData()

    if (!userDB) throw new Error('Not authenticated')  deletePharmacy: async (id: string): Promise<void> => {

    const medicines = userDB?.medicines || []    await fetch(`${API}/pharmacies/${id}`, { method: 'DELETE' });

    const index = medicines.findIndex((m: Medicine) => m.id === id)  },

    if (index === -1) throw new Error('Medicine not found')

    medicines[index] = { ...medicines[index], ...patch }  listDistributions: async (): Promise<Distribution[]> =>

    saveUserData({ ...userDB, medicines })    (await fetch(`${API}/distributions`)).json(),

    return medicines[index]

  },  createDistribution: async (

    d: Omit<Distribution, 'id'>

  deleteMedicine: async (id: string): Promise<void> => {  ): Promise<Distribution> =>

    const userDB = getUserData()    (

    if (!userDB) throw new Error('Not authenticated')      await fetch(`${API}/distributions`, {

    const medicines = userDB?.medicines || []        method: 'POST',

    const filtered = medicines.filter((m: Medicine) => m.id !== id)        headers: { 'Content-Type': 'application/json' },

    saveUserData({ ...userDB, medicines: filtered })        body: JSON.stringify(d),

  },      })

    ).json(),

  listPharmacies: async (): Promise<Pharmacy[]> => {

    const userDB = getUserData()  deleteDistribution: async (id: string): Promise<void> => {

    return userDB?.pharmacies || []    await fetch(`${API}/distributions/${id}`, { method: 'DELETE' });

  },  },



  createPharmacy: async (  getKPI: async (

    p: Omit<Pharmacy, 'id' | 'createdAt'>    month?: string

  ): Promise<Pharmacy> => {  ): Promise<{

    const newPharmacy: Pharmacy = {    monthTurnover: number;

      ...p,    monthProfit: number;

      id: Date.now().toString(),    totalPharmacies: number;

      createdAt: new Date().toISOString()    totalSKUs: number;

    }    currency: 'UZS' | 'USD';

    const userDB = getUserData()  }> => (await fetch(`${API}/kpi${month ? `?month=${month}` : ''}`)).json(),

    if (!userDB) throw new Error('Not authenticated')

    const updated = {  exportCSV: (fro?: string, to?: string) => {

      ...userDB,    const url = `${API}/export${

      pharmacies: [...(userDB?.pharmacies || []), newPharmacy]      fro || to

    }        ? `?${new URLSearchParams({ fro: fro || '', to: to || '' }).toString()}`

    saveUserData(updated)        : ''

    return newPharmacy    }`;

  },    window.location.href = url;

  },

  updatePharmacy: async (id: string, patch: Partial<Pharmacy>): Promise<Pharmacy> => {};

    const userDB = getUserData()
    if (!userDB) throw new Error('Not authenticated')
    const pharmacies = userDB?.pharmacies || []
    const index = pharmacies.findIndex((p: Pharmacy) => p.id === id)
    if (index === -1) throw new Error('Pharmacy not found')
    pharmacies[index] = { ...pharmacies[index], ...patch }
    saveUserData({ ...userDB, pharmacies })
    return pharmacies[index]
  },

  deletePharmacy: async (id: string): Promise<void> => {
    const userDB = getUserData()
    if (!userDB) throw new Error('Not authenticated')
    const pharmacies = userDB?.pharmacies || []
    const filtered = pharmacies.filter((p: Pharmacy) => p.id !== id)
    saveUserData({ ...userDB, pharmacies: filtered })
  },

  listDistributions: async (): Promise<Distribution[]> => {
    const userDB = getUserData()
    return userDB?.distributions || []
  },

  createDistribution: async (
    d: Omit<Distribution, 'id'>
  ): Promise<Distribution> => {
    const newDistribution: Distribution = {
      ...d,
      id: Date.now().toString()
    }
    const userDB = getUserData()
    if (!userDB) throw new Error('Not authenticated')
    const updated = {
      ...userDB,
      distributions: [...(userDB?.distributions || []), newDistribution]
    }
    saveUserData(updated)
    return newDistribution
  },

  deleteDistribution: async (id: string): Promise<void> => {
    const userDB = getUserData()
    if (!userDB) throw new Error('Not authenticated')
    const distributions = userDB?.distributions || []
    const filtered = distributions.filter((d: Distribution) => d.id !== id)
    saveUserData({ ...userDB, distributions: filtered })
  },

  getKPI: async (
    month?: string
  ): Promise<{
    monthTurnover: number;
    monthProfit: number;
    totalPharmacies: number;
    totalSKUs: number;
    currency: 'UZS' | 'USD';
  }> => {
    const userDB = getUserData()
    if (!userDB) throw new Error('Not authenticated')
    const medicines = userDB?.medicines || []
    const pharmacies = userDB?.pharmacies || []
    const distributions = userDB?.distributions || []

    let monthTurnover = 0
    let monthProfit = 0

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    distributions.forEach((d: Distribution) => {
      const distDate = new Date(d.date)
      if (distDate.getMonth() === currentMonth && distDate.getFullYear() === currentYear) {
        d.items.forEach(item => {
          const med = medicines.find((m: Medicine) => m.id === item.medicineId)
          if (med) {
            monthTurnover += item.quantity * item.unitPrice
            const profit = item.quantity * (item.unitPrice - med.purchasePrice)
            monthProfit += profit
          }
        })
      }
    })

    return {
      monthTurnover,
      monthProfit,
      totalPharmacies: pharmacies.length,
      totalSKUs: medicines.length,
      currency: 'UZS'
    }
  },

  exportCSV: (fro?: string, to?: string) => {
    // CSV export logic
  },
};
