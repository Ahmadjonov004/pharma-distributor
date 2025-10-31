import { useEffect, useState } from 'react'
import { api } from '../api'
import { money } from '../utils/format'

export default function Dashboard() {
  const [kpi, setKpi] = useState({
    monthTurnover: 0,
    monthProfit: 0,
    totalPharmacies: 0,
    totalSKUs: 0,
    currency: 'UZS' as 'UZS' | 'USD'
  })

  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    api.getKPI().then(setKpi)
  }, [])

  const Card = ({ title, value, id }: { title: string; value: string; id: string }) => (
    <div
      onClick={() => setSelected(id)}
      className="bg-white rounded-2xl p-5 shadow-soft cursor-pointer hover:shadow-xl transition-transform transform hover:-translate-y-1 active:scale-95"
    >
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-2xl font-semibold mt-1 text-slate-800">{value}</div>
    </div>
  )

  const closeModal = () => setSelected(null)

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
      {selected && modal && (
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
    </div>
  )
}
