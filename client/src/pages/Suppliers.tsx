import { useEffect, useState } from "react";
import type { Medicine } from "../types";
import { useUserData } from "../hooks/useUserData";
import { money } from "../utils/format";

export default function Suppliers() {
  const { listMedicines } = useUserData()
  const [items, setItems] = useState<Medicine[]>([]);
  const [supplierStats, setSupplierStats] = useState<
    { name: string; count: number }[]
  >([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);

  function refresh() {
    const meds = listMedicines();
    setItems(meds);
    
    // Group by supplier and count
    const stats: Record<string, number> = {};
    meds.forEach((m) => {
      const supplier = m.supplier || "Belgilanmagan";
      stats[supplier] = (stats[supplier] || 0) + 1;
    });

    const sorted = Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    setSupplierStats(sorted);
  }

  useEffect(() => {
    refresh();
  }, [listMedicines]);

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Firmalar analitikasi</h1>
        <p className="text-slate-600">
          Qaysi firmadan qancha dori kiritilganligi
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 grid-cols-1 gap-4">
        {supplierStats.length === 0 ? (
          <div className="col-span-full text-center py-8 text-slate-500">
            Hali firma ma'lumoti yo'q
          </div>
        ) : (
          supplierStats.map((supplier, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedSupplier(supplier.name)}
              className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition cursor-pointer transform hover:scale-105"
            >
              <h3 className="text-lg font-semibold text-slate-800">
                {supplier.name}
              </h3>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Dorilar soni</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {supplier.count}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-lg">
                    {supplier.count > 0 ? supplier.count : "0"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DETAILED TABLE */}
      <div className="bg-white rounded-2xl p-4 shadow-md overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4">Barcha firmalar</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b">
            <tr>
              <th className="py-2">Firma nomi</th>
              <th className="py-2">Dorilar soni</th>
              <th className="py-2">Foiz</th>
            </tr>
          </thead>
          <tbody>
            {supplierStats.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 text-center text-slate-500">
                  Ma'lumot yo'q
                </td>
              </tr>
            ) : (
              supplierStats.map((supplier, idx) => {
                const total = items.length;
                const percentage =
                  total > 0 ? ((supplier.count / total) * 100).toFixed(1) : "0";
                return (
                  <tr key={idx} className="border-t hover:bg-slate-50">
                    <td className="py-3 font-medium">{supplier.name}</td>
                    <td className="py-3">{supplier.count} ta</td>
                    <td className="py-3">{percentage}%</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* SUMMARY */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-md">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Umumiy statistika</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600">Jami firmalar</p>
            <p className="text-3xl font-bold text-blue-600">
              {supplierStats.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Jami dorilar</p>
            <p className="text-3xl font-bold text-indigo-600">
              {items.length}
            </p>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">📦 {selectedSupplier}</h2>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="text-slate-400 hover:text-slate-600 text-3xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Filter medicines by supplier */}
            {(() => {
              const supplierMeds = items.filter(m => (m.supplier || "Belgilanmagan") === selectedSupplier)
              const totalStock = supplierMeds.reduce((sum, m) => sum + m.stock, 0)
              const totalValue = supplierMeds.reduce((sum, m) => sum + m.stock * m.salePrice, 0)

              return (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                      <p className="text-sm text-slate-600">Dorilar soni</p>
                      <p className="text-2xl font-bold text-purple-600">{supplierMeds.length}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                      <p className="text-sm text-slate-600">Jami soni</p>
                      <p className="text-2xl font-bold text-blue-600">{totalStock} ta</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                      <p className="text-sm text-slate-600">Qiymati</p>
                      <p className="text-2xl font-bold text-green-600">{money(totalValue)}</p>
                    </div>
                  </div>

                  {/* Medicines table */}
                  {supplierMeds.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <p className="text-lg">Bu firmadan dori yo'q</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b-2">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold">Dori nomi</th>
                            <th className="text-center py-3 px-4 font-semibold">Stock</th>
                            <th className="text-right py-3 px-4 font-semibold">Haridi</th>
                            <th className="text-right py-3 px-4 font-semibold">Sotiluvi</th>
                            <th className="text-right py-3 px-4 font-semibold">Qiymati</th>
                          </tr>
                        </thead>
                        <tbody>
                          {supplierMeds.map((med, idx) => (
                            <tr key={idx} className="border-b hover:bg-slate-50">
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-semibold text-slate-800">{med.name}</p>
                                  <p className="text-xs text-slate-500">SKU: {med.sku}</p>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                                  {med.stock}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-slate-600">{money(med.purchasePrice)}</td>
                              <td className="py-3 px-4 text-right text-slate-600">{money(med.salePrice)}</td>
                              <td className="py-3 px-4 text-right font-semibold text-green-600">
                                {money(med.stock * med.salePrice)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
