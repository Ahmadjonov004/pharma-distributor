import { useEffect, useState } from 'react'
import { useUserData } from '../hooks/useUserData'
import { money } from '../utils/format'
import Toast from '../components/Toast'
import type { Distribution, Pharmacy, Medicine } from '../types'

export default function Dashboard() {
  const { listDistributions, listPharmacies, listMedicines, getPayments, savePayment } = useUserData()
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

  const [supplierPayments, setSupplierPayments] = useState<Record<string, number>>({})
  const [pharmacyPayments, setPharmacyPayments] = useState<Record<string, number>>({})
  const [paymentModal, setPaymentModal] = useState<{ type: 'supplier' | 'pharmacy'; name: string; total: number } | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Load payments from localStorage on mount
  useEffect(() => {
    const payments = getPayments()
    setSupplierPayments(payments.suppliers || {})
    setPharmacyPayments(payments.pharmacies || {})
  }, [getPayments])

  const updateSupplierPayment = (supplierName: string, amount: number) => {
    setSupplierPayments((prev) => ({
      ...prev,
      [supplierName]: (prev[supplierName] || 0) + amount,
    }))
    savePayment('supplier', supplierName, amount)
  }

  const updatePharmacyPayment = (pharmacyName: string, amount: number) => {
    setPharmacyPayments((prev) => ({
      ...prev,
      [pharmacyName]: (prev[pharmacyName] || 0) + amount,
    }))
    savePayment('pharmacy', pharmacyName, amount)
  }

  const handlePaymentSubmit = () => {
    if (!paymentModal || !paymentAmount) return
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      setToast({ message: 'Noto\'g\'ri miqdor!', type: 'error' })
      return
    }
    const debt = paymentModal.total - (paymentModal.type === 'supplier' 
      ? supplierPayments[paymentModal.name] || 0
      : pharmacyPayments[paymentModal.name] || 0)
    if (amount > debt) {
      setToast({ message: `Qarz ${money(debt, kpi.currency)} gacha bo'lishi mumkin!`, type: 'error' })
      return
    }
    if (paymentModal.type === 'supplier') {
      updateSupplierPayment(paymentModal.name, amount)
    } else {
      updatePharmacyPayment(paymentModal.name, amount)
    }
    setPaymentModal(null)
    setPaymentAmount('')
    setToast({ message: ' To\'lash saqlandi!', type: 'success' })
  }

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

  // Prepare turnover report (last 12 months + pharmacy breakdown)
  const getTurnoverReport = () => {
    const now = new Date()
    const months: { label: string; key: string }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ label: d.toLocaleDateString('uz-UZ', { month: 'short', year: 'numeric' }), key: `${d.getFullYear()}-${d.getMonth()}` })
    }

    const totals = months.map(() => 0)

    distributions.forEach((d) => {
      const date = new Date(d.date)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const idx = months.findIndex((m) => m.key === key)
      if (idx >= 0) {
        d.items.forEach((item) => {
          totals[idx] += (item.quantity * item.unitPrice) - (item.discount || 0)
        })
      }
    })

    // Pharmacy breakdown
    const pharmMap: Record<string, number> = {}
    distributions.forEach((d) => {
      const pharm = pharmacies.find((p) => p.id === d.pharmacyId)
      const name = pharm?.name || "Noma'lum"
      d.items.forEach((item) => {
        pharmMap[name] = (pharmMap[name] || 0) + (item.quantity * item.unitPrice) - (item.discount || 0)
      })
    })

    const pharmacyList = Object.entries(pharmMap).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total)

    return { months: months.map((m) => m.label), totals, pharmacyList }
  }

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
        selected === 'turnover' ? (
          (() => {
            const report = getTurnoverReport()
            const months = report.months
            const totals = report.totals
            const pharmacyList = report.pharmacyList
            const width = 780
            const height = 180
            const padding = 24
            const maxVal = Math.max(...totals, 1)

            const points = totals.map((t, i) => {
              const x = Math.round(padding + (i / (totals.length - 1)) * (width - padding * 2))
              const y = Math.round(height - padding - (t / maxVal) * (height - padding * 2))
              return `${x},${y}`
            }).join(' ')

            return (
              <div className="fixed inset-0 flex items-start justify-center bg-black bg-opacity-40 z-50 p-6">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">Oylik aylanma — Diagramma va hisobot</h2>
                      <p className="text-slate-600">Oxirgi 12 oy bo‘yicha oylik aylanma grafigi va dorixonalar bo‘yicha taqsimot.</p>
                    </div>
                    <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-2xl">✕</button>
                  </div>

                  {/* Line chart */}
                  <div className="mb-6">
                    <div className="text-sm text-slate-600 mb-2">Oylik aylanma (so'm)</div>
                    <div className="w-full overflow-x-auto">
                      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="rounded-lg bg-slate-50">
                        {/* grid lines */}
                        {[0,0.25,0.5,0.75,1].map((g,i)=>{
                          const y = padding + (height - padding*2) * g
                          return <line key={i} x1={padding} x2={width-padding} y1={y} y2={y} stroke="#eef2ff" strokeWidth={1} />
                        })}

                        {/* area under line */}
                        <polyline fill="rgba(59,130,246,0.08)" stroke="transparent" points={`${padding},${height-padding} ${points} ${width-padding},${height-padding}`} />

                        {/* line */}
                        <polyline fill="none" stroke="#2563eb" strokeWidth={2} points={points} />

                        {/* points */}
                        {totals.map((t,i)=>{
                          const coords = points.split(' ')[i]
                          const [x,y] = coords.split(',')
                          return <circle key={i} cx={Number(x)} cy={Number(y)} r={3.5} fill="#1d4ed8" />
                        })}
                      </svg>
                    </div>

                    {/* X labels */}
                    <div className="mt-3 text-xs text-slate-500 grid grid-cols-12 gap-1">
                      {months.map((m, i) => (
                        <div key={i} className="col-span-1 text-center truncate">{m}</div>
                      ))}
                    </div>
                  </div>

                  {/* Pharmacy breakdown */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-3">Dorixonalar bo'yicha taqsimot</h3>
                      {pharmacyList.length === 0 ? (
                        <p className="text-slate-500">Ma'lumot mavjud emas</p>
                      ) : (
                        <div className="space-y-3">
                          {pharmacyList.slice(0,6).map((p, idx) => {
                            const pct = Math.round((p.total / Math.max(...pharmacyList.map(x=>x.total))) * 100)
                            return (
                              <div key={idx} className="space-y-1">
                                <div className='flex justify-between'>
                                  <div className='text-sm text-slate-700'>{p.name}</div>
                                  <div className='text-sm font-semibold text-green-600'>{money(p.total, kpi.currency)}</div>
                                </div>
                                <div className='w-full bg-slate-100 rounded-full h-2'>
                                  <div className='bg-blue-600 h-2 rounded-full' style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-3">Oxirgi 12 oy summasi</h3>
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <div className="text-sm text-slate-600">Jami (12 oy)</div>
                        <div className="text-2xl font-bold text-blue-600 mt-1">{money(totals.reduce((s,a)=>s+a,0), kpi.currency)}</div>
                        <div className="mt-4 text-sm text-slate-600">Eng yuqori oy: {months[totals.indexOf(Math.max(...totals))] || '—'}</div>
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Top dorixonalar</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="text-left text-slate-500 border-b">
                              <tr><th className="py-2">Dorixona</th><th className="py-2 text-right">Jami</th></tr>
                            </thead>
                            <tbody>
                              {pharmacyList.slice(0,8).map((p, i) => (
                                <tr key={i} className="border-t hover:bg-slate-50">
                                  <td className="py-2">{p.name}</td>
                                  <td className="py-2 text-right font-semibold text-blue-600">{money(p.total, kpi.currency)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button onClick={closeModal} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">Yopish</button>
                  </div>
                </div>
              </div>
            )
          })()
        ) : (
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
        )
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
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">To'langan (so'm)</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Qarz (so'm)</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Tahrirlash</th>
                </tr>
              </thead>
              <tbody>
                {supplierStats.map((supplier, idx) => {
                  const paid = supplierPayments[supplier.name] || 0
                  const debt = supplier.total - paid
                  return (
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
                      <td className="text-right py-3 px-4 text-blue-600 font-semibold">{money(paid, kpi.currency)}</td>
                      <td className="text-right py-3 px-4 text-red-600 font-semibold">{money(debt, kpi.currency)}</td>
                      <td className="text-right py-3 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const debt = supplier.total - (supplierPayments[supplier.name] || 0)
                            setPaymentModal({ type: 'supplier', name: supplier.name, total: supplier.total })
                            setPaymentAmount('')
                          }}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          To'lash
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dorixonalar Statistikasi */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Dorixonalar xaridi</h2>
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
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">To'langan (so'm)</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Qarz (so'm)</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Tahrirlash</th>
                </tr>
              </thead>
              <tbody>
                {pharmacyStats.map((pharmacy, idx) => {
                  const paid = pharmacyPayments[pharmacy.name] || 0
                  const debt = pharmacy.total - paid
                  return (
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
                      <td className="text-right py-3 px-4 text-green-600 font-semibold">{money(paid, kpi.currency)}</td>
                      <td className="text-right py-3 px-4 text-red-600 font-semibold">{money(debt, kpi.currency)}</td>
                      <td className="text-right py-3 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const debt = pharmacy.total - (pharmacyPayments[pharmacy.name] || 0)
                            setPaymentModal({ type: 'pharmacy', name: pharmacy.name, total: pharmacy.total })
                            setPaymentAmount('')
                          }}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          To'lash
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-800">
                {paymentModal.type === 'supplier' ? '💳 Firmaga To\'lash' : '💳 Dorixonaga To\'lash'}
              </h2>
              <button
                onClick={() => {
                  setPaymentModal(null)
                  setPaymentAmount('')
                }}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-slate-600">Jami qarz</p>
                <p className="text-xl font-bold text-blue-600">{money(paymentModal.total, kpi.currency)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-slate-600">To'langan</p>
                <p className="text-xl font-bold text-green-600">
                  {money(
                    paymentModal.type === 'supplier'
                      ? supplierPayments[paymentModal.name] || 0
                      : pharmacyPayments[paymentModal.name] || 0,
                    kpi.currency
                  )}
                </p>
              </div>
            </div>

            {/* Remaining balance */}
            <div className="bg-red-50 rounded-lg p-4 mb-6 border-l-4 border-red-500">
              <p className="text-sm text-slate-600">Qolgan qarz</p>
              <p className="text-2xl font-bold text-red-600">
                {money(
                  paymentModal.total -
                    (paymentModal.type === 'supplier'
                      ? supplierPayments[paymentModal.name] || 0
                      : pharmacyPayments[paymentModal.name] || 0),
                  kpi.currency
                )}
              </p>
            </div>

            {/* Input field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                To'lanayotgan miqdor (so'm)
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Miqdorni kiriting..."
                className="w-full border-2 border-slate-200 rounded-lg p-3 focus:outline-none focus:border-blue-500 text-lg"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPaymentModal(null)
                  setPaymentAmount('')
                }}
                className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition"
              >
                Bekor qilish
              </button>
              <button
                onClick={handlePaymentSubmit}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition transform hover:scale-105"
              >
                To'lashni tasdiqlash ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

