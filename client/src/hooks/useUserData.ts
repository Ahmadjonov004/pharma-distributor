import { useCallback, useEffect, useState } from 'react'
import type { Medicine, Pharmacy, Distribution } from '../types'
import apiServer from '../api.server'

export const useUserData = () => {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = localStorage.getItem('pharma_currentUser')
    setCurrentUser(user ? JSON.parse(user) : null)
    setLoading(false)
  }, [])

  // attempt background sync when possible with retries
  useEffect(() => {
    let mounted = true

    const flushQueue = async (attempt = 1) => {
      if(!mounted) return
      const token = localStorage.getItem('pharma_token')
      if(!token || !currentUser) return
      const key = `pharma_sync_queue_${currentUser.id}`
      const q = localStorage.getItem(key)
      const queue = q ? JSON.parse(q) : []
      if(queue.length === 0) return

      try{
        const changes: any = { medicines: [], pharmacies: [], distributions: [] }
        for(const it of queue){
          if(it.op === 'delete'){
            try{ await apiServer.deleteItem(it.category, it.id) }catch(e){ /* ignore individual delete errors */ }
          } else {
            changes[it.category] = changes[it.category] || []
            changes[it.category].push(it.item)
          }
        }

        const hasAny = Object.values(changes).some((a:any)=>Array.isArray(a) && a.length>0)
        if(hasAny){
          const serverDb = await apiServer.sync(changes)
          localStorage.setItem(`pharma_data_${currentUser.id}`, JSON.stringify({
            medicines: serverDb.medicines || [],
            pharmacies: serverDb.pharmacies || [],
            distributions: serverDb.distributions || [],
            settings: serverDb.settings || { currency: 'UZS', distributorName: 'Pharma Distributor' }
          }))
        }

        // clear queue only on success
        localStorage.removeItem(key)
      }catch(err){
        console.warn(`Sync attempt ${attempt} failed`, err)
        if(attempt < 3){
          // exponential backoff: 2^attempt * 1000 ms
          const delay = Math.pow(2, attempt) * 1000
          setTimeout(() => flushQueue(attempt + 1), delay)
        }
      }
    }

    if(currentUser){
      // try immediately and again when back online
      flushQueue(1)
      const onOnline = () => flushQueue(1)
      window.addEventListener('online', onOnline)
      return () => { mounted = false; window.removeEventListener('online', onOnline) }
    }
  }, [currentUser])

  const getUserDB = useCallback(() => {
    if (!currentUser) return null
    const data = localStorage.getItem(`pharma_data_${currentUser.id}`)
    if(data) return JSON.parse(data)
    // if token and no local data, try to fetch from server
    const token = localStorage.getItem('pharma_token')
    if(token){
      // fire-and-forget fetch server state
      apiServer.fetchAll().then(srv => {
        localStorage.setItem(`pharma_data_${currentUser.id}`, JSON.stringify({
          medicines: srv.medicines || [],
          pharmacies: srv.pharmacies || [],
          distributions: srv.distributions || [],
          settings: { currency: 'UZS', distributorName: 'Pharma Distributor' }
        }))
      }).catch(()=>{
        // ignore fetch error, will fallback to empty
      })
    }
    return {
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
      // also try background push: add to sync queue if token present
      const token = localStorage.getItem('pharma_token')
      if(!token) return
      // we rely on the specific create/update/delete functions to enqueue the right change
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
      // enqueue for sync
      try{
        const token = localStorage.getItem('pharma_token')
        if(token && currentUser){
          const key = `pharma_sync_queue_${currentUser.id}`
          const q = localStorage.getItem(key)
          const queue = q ? JSON.parse(q) : []
          queue.push({ category: 'medicines', op: 'create', item: newMedicine })
          localStorage.setItem(key, JSON.stringify(queue))
        }
      }catch(e){ console.warn(e) }
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
      try{
        const token = localStorage.getItem('pharma_token')
        if(token && currentUser){
          const key = `pharma_sync_queue_${currentUser.id}`
          const q = localStorage.getItem(key)
          const queue = q ? JSON.parse(q) : []
          queue.push({ category: 'medicines', op: 'update', item: medicines[index] })
          localStorage.setItem(key, JSON.stringify(queue))
        }
      }catch(e){ console.warn(e) }
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
      try{
        const token = localStorage.getItem('pharma_token')
        if(token && currentUser){
          const key = `pharma_sync_queue_${currentUser.id}`
          const q = localStorage.getItem(key)
          const queue = q ? JSON.parse(q) : []
          queue.push({ category: 'medicines', op: 'delete', id })
          localStorage.setItem(key, JSON.stringify(queue))
        }
      }catch(e){ console.warn(e) }
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
      try{
        const token = localStorage.getItem('pharma_token')
        if(token && currentUser){
          const key = `pharma_sync_queue_${currentUser.id}`
          const q = localStorage.getItem(key)
          const queue = q ? JSON.parse(q) : []
          queue.push({ category: 'pharmacies', op: 'create', item: newPharmacy })
          localStorage.setItem(key, JSON.stringify(queue))
        }
      }catch(e){ console.warn(e) }
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
      try{
        const token = localStorage.getItem('pharma_token')
        if(token && currentUser){
          const key = `pharma_sync_queue_${currentUser.id}`
          const q = localStorage.getItem(key)
          const queue = q ? JSON.parse(q) : []
          queue.push({ category: 'pharmacies', op: 'update', item: pharmacies[index] })
          localStorage.setItem(key, JSON.stringify(queue))
        }
      }catch(e){ console.warn(e) }
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
      try{
        const token = localStorage.getItem('pharma_token')
        if(token && currentUser){
          const key = `pharma_sync_queue_${currentUser.id}`
          const q = localStorage.getItem(key)
          const queue = q ? JSON.parse(q) : []
          queue.push({ category: 'pharmacies', op: 'delete', id })
          localStorage.setItem(key, JSON.stringify(queue))
        }
      }catch(e){ console.warn(e) }
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
      try{
        const token = localStorage.getItem('pharma_token')
        if(token && currentUser){
          const key = `pharma_sync_queue_${currentUser.id}`
          const q = localStorage.getItem(key)
          const queue = q ? JSON.parse(q) : []
          queue.push({ category: 'distributions', op: 'create', item: newDistribution })
          localStorage.setItem(key, JSON.stringify(queue))
        }
      }catch(e){ console.warn(e) }
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
      try{
        const token = localStorage.getItem('pharma_token')
        if(token && currentUser){
          const key = `pharma_sync_queue_${currentUser.id}`
          const q = localStorage.getItem(key)
          const queue = q ? JSON.parse(q) : []
          queue.push({ category: 'distributions', op: 'delete', id })
          localStorage.setItem(key, JSON.stringify(queue))
        }
      }catch(e){ console.warn(e) }
    },
    [getUserDB, saveUserDB]
  )

  // Payment tracking functions
  const getPayments = useCallback(() => {
    if (!currentUser) return { suppliers: {}, pharmacies: {} }
    const key = `pharma_payments_${currentUser.id}`
    const data = localStorage.getItem(key)
    if(data) return JSON.parse(data)
    return { suppliers: {}, pharmacies: {} }
  }, [currentUser])

  const savePayment = useCallback(
    (type: 'supplier' | 'pharmacy', name: string, amount: number) => {
      if (!currentUser) return
      const payments = getPayments()
      const category = type === 'supplier' ? 'suppliers' : 'pharmacies'
      payments[category] = payments[category] || {}
      payments[category][name] = (payments[category][name] || 0) + amount
      const key = `pharma_payments_${currentUser.id}`
      localStorage.setItem(key, JSON.stringify(payments))
      
      // Also enqueue for sync if logged in
      const token = localStorage.getItem('pharma_token')
      if(token){
        const queueKey = `pharma_sync_queue_${currentUser.id}`
        const q = localStorage.getItem(queueKey)
        const queue = q ? JSON.parse(q) : []
        queue.push({ 
          category: 'payments', 
          op: 'create', 
          item: { type, name, amount, timestamp: new Date().toISOString() } 
        })
        localStorage.setItem(queueKey, JSON.stringify(queue))
      }
    },
    [currentUser, getPayments]
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
    deleteDistribution,
    getPayments,
    savePayment
  }
}
