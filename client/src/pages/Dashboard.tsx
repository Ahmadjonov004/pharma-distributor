import { useEffect, useState } from 'react'
import { useUserData } from '../hooks/useUserData'
import { money } from '../utils/format'
import type { Distribution, Pharmacy, Medicine } from '../types'

export default function Dashboard() {
  const { listDistributions, listPharmacies, listMedicines } = useUserData()
  const [kpi, setKpi] = useState({
    monthTurnover: 0,
    monthProfit: 0,
    totalPharmacies: 0,
    totalSKUs: 0,
    currency: 'UZS' as 'UZS' | 'USD'
  })

  const [selected, setSelected] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<'supplier' | 'pharmacy' | 'kpi' | null>(null)
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [supplierStats, setSupplierStats] = useState<{ name: string; quantity: number; total: number }[]>([])
  const [pharmacyStats, setPharmacyStats] = useState<{ name: string; quantity: number; total: number }[]>([])

  useEffect(() => {
    // Calculate statistics from current data
    const calculateStats = () => {
      const dists = listDistributions()
      const pharms = listPharmacies()
      const meds = listMedicines()
      
      setDistributions(dists)
      setPharmacies(pharms)
      setMedicines(meds)
      
      // KPI calculation
      let monthTurnover = 0
      let monthProfit = 0
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      dists.forEach((d: Distribution) => {
        const distDate = new Date(d.date)
        if (distDate.getMonth() === currentMonth && distDate.getFullYear() === currentYear) {
          d.items.forEach((item) => {
            const med = meds.find(m => m.id === item.medicineId)
            if (med) {
              monthTurnover += item.quantity * item.unitPrice
              const profit = item.quantity * (item.unitPrice - med.purchasePrice)
              monthProfit += profit
            }
          })
        }
      })

      setKpi({
        monthTurnover,
        monthProfit,
        totalPharmacies: pharms.length,
        totalSKUs: meds.length,
        currency: 'UZS'
      })
      
      // Supplier statistics - BARCHASI: medicines + distributions
      const supplierMap: Record<string, { quantity: number; total: number }> = {}
      
      // Ombordagi medicines-dan supplier statistika
      meds.forEach((med: Medicine) => {
        const supplier = med.supplier || 'Belgilanmagan'
        if (!supplierMap[supplier]) {
          supplierMap[supplier] = { quantity: 0, total: 0 }
        }
        supplierMap[supplier].quantity += med.stock
        supplierMap[supplier].total += med.stock * med.salePrice
      })
      
      // Distributions-dan supplier statistika (sotuv)
      dists.forEach((d: Distribution) => {
        d.items.forEach((item) => {
          const med = meds.find(m => m.id === item.medicineId)
          const supplier = med?.supplier || 'Belgilanmagan'
          if (!supplierMap[supplier]) {
            supplierMap[supplier] = { quantity: 0, total: 0 }
          }
          supplierMap[supplier].quantity += item.quantity
          supplierMap[supplier].total += item.quantity * item.unitPrice
        })
      })
      
      setSupplierStats(
        Object.entries(supplierMap)
          .map(([name, stats]) => ({ name, ...stats }))
          .sort((a, b) => b.total - a.total)
      )
      
      // Pharmacy statistics
      const pharmacyMap: Record<string, { quantity: number; total: number }> = {}
      dists.forEach((d: Distribution) => {
        const pharm = pharms.find(p => p.id === d.pharmacyId)
        const pharmName = pharm?.name || 'Noma\'lum'
        if (!pharmacyMap[pharmName]) {
          pharmacyMap[pharmName] = { quantity: 0, total: 0 }
        }
        d.items.forEach((item) => {
          pharmacyMap[pharmName].quantity += item.quantity
          pharmacyMap[pharmName].total += item.quantity * item.unitPrice
        })
      })
      setPharmacyStats(
        Object.entries(pharmacyMap)
          .map(([name, stats]) => ({ name, ...stats }))
          .sort((a, b) => b.total - a.total)
      )
    }

    // Initial calculation
    calculateStats()

    // Refresh every 2 seconds for real-time updates
    const interval = setInterval(calculateStats, 2000)

    return () => clearInterval(interval)
  }, [listDistributions, listPharmacies, listMedicines])

  const Card = ({ title, value, id }: { title: string; value: string; id: string }) => (
    <div
      onClick={() => {
        setSelected(id)
        setSelectedType('kpi')
      }}
      className="bg-white rounded-2xl p-5 shadow-soft cursor-pointer hover:shadow-xl transition-transform transform hover:-translate-y-1 active:scale-95"
    >
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-2xl font-semibold mt-1 text-slate-800">{value}</div>
    </div>
  )

  const closeModal = () => {
    setSelected(null)
    setSelectedType(null)
  }

  const getModalContent = () => {
    switch (selected) {
      case 'turnover':
        return {
          title: 'Oylik aylanma',
          desc: `Ushbu oyda dorixonalar tomonidan amalga oshirilgan umumiy savdo miqdori: ${money(kpi.monthTurnover, kpi.currency)}.`,
        }
      case 'profit':
        return {
          title: 'Oylik foyda',
          desc: `Ushbu oyda jami sof foyda: ${money(kpi.monthProfit, kpi.currency)}.`,
        }
      case 'pharmacies':
        return {
          title: 'Jami dorixonalar',
          desc: `Tizimda ro‘yxatdan o‘tgan dorixonalar soni: ${kpi.totalPharmacies} ta.`,
        }
      case 'skus':
        return {
          title: 'Jami dorilar (SKU)',
          desc: `Dorixonalarda mavjud bo‘lgan turli dorilar soni: ${kpi.totalSKUs} ta.`,
        }
      default:
        return null
    }
  }

  const modal = getModalContent()

  const getDetailedModal = () => {
    if (selectedType === 'supplier') {
      const supplier = supplierStats.find(s => s.name === selected)
      if (!supplier) return null
      
      const items: { date: string; medicineName: string; quantity: number; unitPrice: number; total: number }[] = []
      distributions.forEach(d => {
        d.items.forEach(item => {
          const med = medicines.find(m => m.id === item.medicineId)
          if (med?.supplier === supplier.name || (supplier.name === 'Belgilanmagan' && !med?.supplier)) {
            items.push({
              date: new Date(d.date).toLocaleDateString('uz-UZ'),
              medicineName: med?.name || 'Noma\'lum',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice
            })
          }
        })
      })
      
      return {
        type: 'supplier' as const,
        title: supplier.name,
        items,
        total: supplier.total,
        totalQuantity: supplier.quantity
      }
    } else if (selectedType === 'pharmacy') {
      const pharmacy = pharmacyStats.find(p => p.name === selected)
      if (!pharmacy) return null
      
      const items: { date: string; medicineName: string; quantity: number; unitPrice: number; total: number }[] = []
      distributions.forEach(d => {
        const pharm = pharmacies.find(p => p.id === d.pharmacyId)
        if (pharm?.name === pharmacy.name) {
          d.items.forEach(item => {
            const med = medicines.find(m => m.id === item.medicineId)
            items.push({
              date: new Date(d.date).toLocaleDateString('uz-UZ'),
              medicineName: med?.name || 'Noma\'lum',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice
            })
          })
        }
      })
      
      return {
        type: 'pharmacy' as const,
        title: pharmacy.name,
        items,
        total: pharmacy.total,
        totalQuantity: pharmacy.quantity
      }
    }
    
    return null
  }

  const detailedModal = getDetailedModal()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Boshqaruv paneli</h1>
        <p className="text-slate-600">Ushbu oy uchun umumiy ko‘rsatkichlar</p>
      </div>

      {/* Responsive grid */}
      <div className="grid xl:grid-cols-4 md:grid-cols-2 sm:grid-cols-2 grid-cols-1 gap-4">
        <Card id="turnover" title="Oylik aylanma" value={money(kpi.monthTurnover, kpi.currency)} />
        <Card id="profit" title="Oylik foyda" value={money(kpi.monthProfit, kpi.currency)} />
        <Card id="pharmacies" title="Dorixonalar soni" value={String(kpi.totalPharmacies)} />
        <Card id="skus" title="Dorilar soni (SKU)" value={String(kpi.totalSKUs)} />
      </div>

      {/* Modal */}
      {selected && modal && selectedType === 'kpi' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-2xl shadow-lg w-[90%] max-w-md p-6 animate-fade-in">
            <h2 className="text-xl font-semibold mb-2 text-slate-800">{modal.title}</h2>
            <p className="text-slate-600 leading-relaxed">{modal.desc}</p>
            <div className="mt-5 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Modal - Firmalar */}
      {detailedModal && detailedModal.type === 'supplier' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-slate-800">{detailedModal.title}</h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Umumiy ma'lumot */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600">Jami dona</p>
                <p className="text-2xl font-bold text-blue-600">{detailedModal.totalQuantity}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Jami xarid</p>
                <p className="text-2xl font-bold text-green-600">{money(detailedModal.total, kpi.currency)}</p>
              </div>
            </div>

            {/* Jadvali */}
            {detailedModal.items.length === 0 ? (
              <p className="text-center text-slate-500 py-4">Ma'lumot yo'q</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-3">Sana</th>
                      <th className="text-left py-3 px-3">Dori nomi</th>
                      <th className="text-right py-3 px-3">Dona</th>
                      <th className="text-right py-3 px-3">Narxi</th>
                      <th className="text-right py-3 px-3">Jami</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedModal.items.map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-3 text-slate-600">{item.date}</td>
                        <td className="py-3 px-3 font-medium">{item.medicineName}</td>
                        <td className="text-right py-3 px-3">{item.quantity}</td>
                        <td className="text-right py-3 px-3">{money(item.unitPrice, kpi.currency)}</td>
                        <td className="text-right py-3 px-3 font-semibold text-green-600">{money(item.total, kpi.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Modal - Dorixonalar */}
      {detailedModal && detailedModal.type === 'pharmacy' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-slate-800">{detailedModal.title}</h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Umumiy ma'lumot */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-indigo-50 rounded-lg">
              <div>
                <p className="text-sm text-slate-600">Jami dona</p>
                <p className="text-2xl font-bold text-indigo-600">{detailedModal.totalQuantity}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Jami xarid</p>
                <p className="text-2xl font-bold text-blue-600">{money(detailedModal.total, kpi.currency)}</p>
              </div>
            </div>

            {/* Jadvali */}
            {detailedModal.items.length === 0 ? (
              <p className="text-center text-slate-500 py-4">Ma'lumot yo'q</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="text-left py-3 px-3">Sana</th>
                      <th className="text-left py-3 px-3">Dori nomi</th>
                      <th className="text-right py-3 px-3">Dona</th>
                      <th className="text-right py-3 px-3">Narxi</th>
                      <th className="text-right py-3 px-3">Jami</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedModal.items.map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-3 text-slate-600">{item.date}</td>
                        <td className="py-3 px-3 font-medium">{item.medicineName}</td>
                        <td className="text-right py-3 px-3">{item.quantity}</td>
                        <td className="text-right py-3 px-3">{money(item.unitPrice, kpi.currency)}</td>
                        <td className="text-right py-3 px-3 font-semibold text-blue-600">{money(item.total, kpi.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Firmalar Statistikasi */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Firmalardan xarid</h2>
        {supplierStats.length === 0 ? (
          <p className="text-slate-500 text-center py-4">Ma'lumot yo'q</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Firma nomi</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Miqdori (ta)</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Jami xarid (so'm)</th>
                </tr>
              </thead>
              <tbody>
                {supplierStats.map((supplier, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => {
                      setSelected(supplier.name)
                      setSelectedType('supplier')
                    }}
                    className="border-b hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="py-3 px-4">{supplier.name}</td>
                    <td className="text-right py-3 px-4 font-medium">{supplier.quantity}</td>
                    <td className="text-right py-3 px-4 text-green-600 font-semibold">{money(supplier.total, kpi.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dorixonalar Statistikasi */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Dorixonalarga xarid</h2>
        {pharmacyStats.length === 0 ? (
          <p className="text-slate-500 text-center py-4">Ma'lumot yo'q</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Dorixona nomi</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Miqdori (ta)</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Jami xarid (so'm)</th>
                </tr>
              </thead>
              <tbody>
                {pharmacyStats.map((pharmacy, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => {
                      setSelected(pharmacy.name)
                      setSelectedType('pharmacy')
                    }}
                    className="border-b hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="py-3 px-4">{pharmacy.name}</td>
                    <td className="text-right py-3 px-4 font-medium">{pharmacy.quantity}</td>
                    <td className="text-right py-3 px-4 text-blue-600 font-semibold">{money(pharmacy.total, kpi.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

