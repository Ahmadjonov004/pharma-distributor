import type { Medicine, Pharmacy, Distribution } from './types';

// Hozirgi foydalanuvchini olish
const getCurrentUser = () => {
  const user = localStorage.getItem('pharma_currentUser')
  return user ? JSON.parse(user) : null
}

// Foydalanuvchi ma'lumotlar bazasini olish
const getUserData = () => {
  const user = getCurrentUser()
  if (!user) return null
  const data = localStorage.getItem(`pharma_data_${user.id}`)
  return data ? JSON.parse(data) : {
    medicines: [],
    pharmacies: [],
    distributions: [],
    settings: { currency: 'UZS', distributorName: 'Pharma Distributor' }
  }
}

// Foydalanuvchi ma'lumotlar bazasini saqlash
const saveUserData = (data: any) => {
  const user = getCurrentUser()
  if (!user) return
  localStorage.setItem(`pharma_data_${user.id}`, JSON.stringify(data))
}

export const api = {
  listMedicines: async (): Promise<Medicine[]> => {
    const userDB = getUserData()
    return userDB?.medicines || []
  },

  createMedicine: async (
    m: Omit<Medicine, 'id' | 'createdAt'>
  ): Promise<Medicine> => {
    const newMedicine: Medicine = {
      ...m,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    const userDB = getUserData()
    if (!userDB) throw new Error('Not authenticated')
    const updated = {
      ...userDB,
      medicines: [...(userDB?.medicines || []), newMedicine]
    }
    saveUserData(updated)
    return newMedicine
  },

  updateMedicine: async (
    id: string,
    patch: Partial<Medicine>
  ): Promise<Medicine> => {
    const userDB = getUserData()
    if (!userDB) throw new Error('Not authenticated')
    const medicines = userDB?.medicines || []
    const index = medicines.findIndex((m: Medicine) => m.id === id)
    if (index === -1) throw new Error('Medicine not found')
    medicines[index] = { ...medicines[index], ...patch }
    saveUserData({ ...userDB, medicines })
    return medicines[index]
  },

  deleteMedicine: async (id: string): Promise<void> => {
    const userDB = getUserData()
    if (!userDB) throw new Error('Not authenticated')
    const medicines = userDB?.medicines || []
    const filtered = medicines.filter((m: Medicine) => m.id !== id)
    saveUserData({ ...userDB, medicines: filtered })
  },

  listPharmacies: async (): Promise<Pharmacy[]> => {
    const userDB = getUserData()
    return userDB?.pharmacies || []
  },

  createPharmacy: async (
    p: Omit<Pharmacy, 'id' | 'createdAt'>
  ): Promise<Pharmacy> => {
    const newPharmacy: Pharmacy = {
      ...p,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    const userDB = getUserData()
    if (!userDB) throw new Error('Not authenticated')
    const updated = {
      ...userDB,
      pharmacies: [...(userDB?.pharmacies || []), newPharmacy]
    }
    saveUserData(updated)
    return newPharmacy
  },

  updatePharmacy: async (id: string, patch: Partial<Pharmacy>): Promise<Pharmacy> => {
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

  getKPI: async (): Promise<{
    monthTurnover: number;
    monthProfit: number;
    totalPharmacies: number;
    totalSKUs: number;
    currency: 'UZS' | 'USD';
  }> => {
    const userDB = getUserData()
    if (!userDB) return { monthTurnover: 0, monthProfit: 0, totalPharmacies: 0, totalSKUs: 0, currency: 'UZS' }
    
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

  exportCSV: () => {
    // CSV export logic
  },
};
