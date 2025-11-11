import { useCallback, useEffect, useState } from 'react'
import type { Medicine, Pharmacy, Distribution } from '../types'

export const useUserData = () => {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = localStorage.getItem('pharma_currentUser')
    setCurrentUser(user ? JSON.parse(user) : null)
    setLoading(false)
  }, [])

  const getUserDB = useCallback(() => {
    if (!currentUser) return null
    const data = localStorage.getItem(`pharma_data_${currentUser.id}`)
    return data
      ? JSON.parse(data)
      : {
          medicines: [],
          pharmacies: [],
          distributions: [],
          settings: { currency: 'UZS', distributorName: 'Pharma Distributor' }
        }
  }, [currentUser])

  const saveUserDB = useCallback(
    (data: any) => {
      if (!currentUser) return
      localStorage.setItem(`pharma_data_${currentUser.id}`, JSON.stringify(data))
    },
    [currentUser]
  )

  const listMedicines = useCallback((): Medicine[] => {
    const db = getUserDB()
    return db?.medicines || []
  }, [getUserDB])

  const createMedicine = useCallback(
    (m: Omit<Medicine, 'id' | 'createdAt'>): Medicine => {
      const newMedicine: Medicine = {
        ...m,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      }
      const db = getUserDB()
      saveUserDB({
        ...db,
        medicines: [...(db?.medicines || []), newMedicine]
      })
      return newMedicine
    },
    [getUserDB, saveUserDB]
  )

  const updateMedicine = useCallback(
    (id: string, patch: Partial<Medicine>): Medicine => {
      const db = getUserDB()
      const medicines = db?.medicines || []
      const index = medicines.findIndex((m: Medicine) => m.id === id)
      if (index === -1) throw new Error('Medicine not found')
      medicines[index] = { ...medicines[index], ...patch }
      saveUserDB({ ...db, medicines })
      return medicines[index]
    },
    [getUserDB, saveUserDB]
  )

  const deleteMedicine = useCallback(
    (id: string) => {
      const db = getUserDB()
      const medicines = db?.medicines || []
      const filtered = medicines.filter((m: Medicine) => m.id !== id)
      saveUserDB({ ...db, medicines: filtered })
    },
    [getUserDB, saveUserDB]
  )

  const listPharmacies = useCallback((): Pharmacy[] => {
    const db = getUserDB()
    return db?.pharmacies || []
  }, [getUserDB])

  const createPharmacy = useCallback(
    (p: Omit<Pharmacy, 'id' | 'createdAt'>): Pharmacy => {
      const newPharmacy: Pharmacy = {
        ...p,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      }
      const db = getUserDB()
      saveUserDB({
        ...db,
        pharmacies: [...(db?.pharmacies || []), newPharmacy]
      })
      return newPharmacy
    },
    [getUserDB, saveUserDB]
  )

  const updatePharmacy = useCallback(
    (id: string, patch: Partial<Pharmacy>): Pharmacy => {
      const db = getUserDB()
      const pharmacies = db?.pharmacies || []
      const index = pharmacies.findIndex((p: Pharmacy) => p.id === id)
      if (index === -1) throw new Error('Pharmacy not found')
      pharmacies[index] = { ...pharmacies[index], ...patch }
      saveUserDB({ ...db, pharmacies })
      return pharmacies[index]
    },
    [getUserDB, saveUserDB]
  )

  const deletePharmacy = useCallback(
    (id: string) => {
      const db = getUserDB()
      const pharmacies = db?.pharmacies || []
      const filtered = pharmacies.filter((p: Pharmacy) => p.id !== id)
      saveUserDB({ ...db, pharmacies: filtered })
    },
    [getUserDB, saveUserDB]
  )

  const listDistributions = useCallback((): Distribution[] => {
    const db = getUserDB()
    return db?.distributions || []
  }, [getUserDB])

  const createDistribution = useCallback(
    (d: Omit<Distribution, 'id'>): Distribution => {
      const newDistribution: Distribution = {
        ...d,
        id: Date.now().toString()
      }
      const db = getUserDB()
      saveUserDB({
        ...db,
        distributions: [...(db?.distributions || []), newDistribution]
      })
      return newDistribution
    },
    [getUserDB, saveUserDB]
  )

  const deleteDistribution = useCallback(
    (id: string) => {
      const db = getUserDB()
      const distributions = db?.distributions || []
      const filtered = distributions.filter((d: Distribution) => d.id !== id)
      saveUserDB({ ...db, distributions: filtered })
    },
    [getUserDB, saveUserDB]
  )

  return {
    currentUser,
    loading,
    listMedicines,
    createMedicine,
    updateMedicine,
    deleteMedicine,
    listPharmacies,
    createPharmacy,
    updatePharmacy,
    deletePharmacy,
    listDistributions,
    createDistribution,
    deleteDistribution
  }
}
