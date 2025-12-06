import { useEffect, useMemo, useState } from "react";
import type { Distribution, Medicine, Pharmacy } from "../types";
import { api } from "../api";
import { money, shortDate } from "../utils/format";
import Toast from "../components/Toast";

type SortKey = "date" | "pharmacy" | "total";

export default function Reports() {
  const [dists, setDists] = useState<Distribution[]>([]);
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [phs, setPhs] = useState<Pharmacy[]>([]);
  const [fro, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Distribution | null>(null);
  const [toDelete, setToDelete] = useState<Distribution | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    api.listDistributions().then(setDists);
    api.listMedicines().then(setMeds);
    api.listPharmacies().then(setPhs);
  }, []);

  const filtered = useMemo(() => {
    const filteredData = dists.filter((d) => {
      const t = new Date(d.date).getTime();
      const okF = fro ? t >= new Date(fro).getTime() : true;
      const okT = to ? t <= new Date(to).getTime() : true;
      return okF && okT;
    });
    return [...filteredData].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";
      const totalA = a.items.reduce((s, i) => s + i.unitPrice * i.quantity - (i.discount || 0), 0);
      const totalB = b.items.reduce((s, i) => s + i.unitPrice * i.quantity - (i.discount || 0), 0);
      if (sortKey === "date") {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
      } else if (sortKey === "pharmacy") {
        valA = phs.find((p) => p.id === a.pharmacyId)?.name || "";
        valB = phs.find((p) => p.id === b.pharmacyId)?.name || "";
      } else if (sortKey === "total") {
        valA = totalA;
        valB = totalB;
      }
      if (typeof valA === "string" && typeof valB === "string") {
        return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortDir === "asc" ? +valA - +valB : +valB - +valA;
      }
    });
  }, [dists, fro, to, sortKey, sortDir, phs]);

  const total = filtered.reduce((s, d) => s + d.items.reduce((a, i) => a + i.unitPrice * i.quantity - (i.discount || 0), 0), 0);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  // Delete function
  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await api.deleteDistribution(toDelete.id);
      setDists((prev) => prev.filter((d) => d.id !== toDelete.id));
      setToDelete(null);
      setToast({ message: '✓ Tarqatish o\'chirildi!', type: 'success' });
    } catch(err) {
      setToast({ message: 'Xatolik: ' + (err instanceof Error ? err.message : 'O\'chirib bo\'lmadi'), type: 'error' });
    }
  };

  // Group medicines by date
  const medicinesByDate = useMemo(() => {
    const grouped: Record<string, Array<{ medicine: Medicine; totalQty: number; avgPrice: number; items: Array<{date: string; qty: number; price: number}> }>> = {};
    
    filtered.forEach((d) => {
      d.items.forEach((item) => {
        const med = meds.find((m) => m.id === item.medicineId);
        if (!med) return;
        
        const dateKey = new Date(d.date).toLocaleDateString('uz-UZ');
        if (!grouped[med.id]) {
          grouped[med.id] = [];
        }
        
        let dayEntry = grouped[med.id].find((e) => e.items.some((it) => it.date === dateKey));
        if (!dayEntry) {
          dayEntry = { medicine: med, totalQty: 0, avgPrice: 0, items: [] };
          grouped[med.id].push(dayEntry);
        }
        
        dayEntry.items.push({ date: dateKey, qty: item.quantity, price: item.unitPrice });
        dayEntry.totalQty += item.quantity;
      });
    });

    // Calculate totals
    Object.keys(grouped).forEach((medId) => {
      grouped[medId].forEach((entry) => {
        const totalPrice = entry.items.reduce((s, it) => s + it.qty * it.price, 0);
        entry.avgPrice = totalPrice / entry.totalQty;
      });
    });

    return grouped;
  }, [filtered, meds]);

  // Group pharmacies by date
  const pharmaciesByDate = useMemo(() => {
    const grouped: Record<string, Array<{ pharmacy: Pharmacy; totalQty: number; items: Array<{date: string; medicineName: string; qty: number; price: number; total: number}> }>> = {};
    
    filtered.forEach((d) => {
      const pharm = phs.find((p) => p.id === d.pharmacyId);
      if (!pharm) return;
      
      if (!grouped[pharm.id]) {
        grouped[pharm.id] = [];
      }
      
      d.items.forEach((item) => {
        const med = meds.find((m) => m.id === item.medicineId);
        const dateKey = new Date(d.date).toLocaleDateString('uz-UZ');
        
        let dayEntry = grouped[pharm.id].find((e) => e.items.some((it) => it.date === dateKey));
        if (!dayEntry) {
          dayEntry = { pharmacy: pharm, totalQty: 0, items: [] };
          grouped[pharm.id].push(dayEntry);
        }
        
        const itemTotal = item.quantity * item.unitPrice - (item.discount || 0);
        dayEntry.items.push({ 
          date: dateKey, 
          medicineName: med?.name || 'Noma\'lum',
          qty: item.quantity, 
          price: item.unitPrice,
          total: itemTotal
        });
        dayEntry.totalQty += item.quantity;
      });
    });

    return grouped;
  }, [filtered, meds, phs]);

  return (
    <div className="space-y-8 pb-8">
      <h1 className="text-3xl font-bold text-gray-800">Hisobotlar bo'limi 📊</h1>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-5 shadow-md grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-4 items-end">
        <div>
          <label className="block text-gray-600 text-sm mb-1">Boshlanish sanasi</label>
          <input type="date" className="w-full border border-gray-300 rounded-lg p-2" value={fro} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-gray-600 text-sm mb-1">Tugash sanasi</label>
          <input type="date" className="w-full border border-gray-300 rounded-lg p-2" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button onClick={() => { setFrom(""); setTo(""); }} className="bg-gray-200 rounded-lg py-2 hover:bg-gray-300 transition">Filtrni tozalash</button>
        <button 
          onClick={() => {
            const headers = ['Sana', 'Dorixona', 'Dori nomi', 'Soni', 'Narxi', 'Chegirma', 'Jami']
            const rows: string[] = []

            filtered.forEach((d) => {
              const pharmacy = phs.find((p) => p.id === d.pharmacyId)?.name || 'Noma\'lum'
              d.items.forEach((item) => {
                const medicine = meds.find((m) => m.id === item.medicineId)?.name || 'Noma\'lum'
                const date = new Date(d.date).toLocaleDateString('uz-UZ')
                const total = item.quantity * item.unitPrice - (item.discount || 0)
                rows.push(
                  `"${date}","${pharmacy}","${medicine}",${item.quantity},${item.unitPrice},${item.discount || 0},${total}`
                )
              })
            })

            const csvContent = [headers.join(','), ...rows].join('\n')
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', `tarqatishlar_${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
          }}
          className="bg-green-600 text-white rounded-lg py-2 hover:bg-green-700 transition font-medium"
        >
          📥 CSV eksport
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl p-5 shadow-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-500 border-b">
            <tr>
              <th onClick={() => toggleSort("date")} className="cursor-pointer hover:text-gray-700">Sana</th>
              <th onClick={() => toggleSort("pharmacy")} className="cursor-pointer hover:text-gray-700">Dorixona</th>
              <th>Mahsulotlar</th>
              <th onClick={() => toggleSort("total")} className="cursor-pointer hover:text-gray-700">Summa</th>
              <th>Amal</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => {
              const ph = phs.find((p) => p.id === d.pharmacyId)?.name || "—";
              const sum = d.items.reduce((a, it) => a + it.unitPrice * it.quantity - (it.discount || 0), 0);
              return (
                <tr key={d.id} className="border-b hover:bg-blue-50 cursor-pointer">
                  <td onClick={() => setSelected(d)} className="py-3 px-4">{shortDate(d.date)}</td>
                  <td onClick={() => setSelected(d)} className="py-3 px-4">{ph}</td>
                  <td onClick={() => setSelected(d)} className="py-3 px-4">{d.items.length} ta</td>
                  <td onClick={() => setSelected(d)} className="py-3 px-4 font-semibold">{money(sum)}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => setToDelete(d)} className="text-red-600 hover:text-red-800 font-medium">
                      🗑 O'chirish
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PHARMACIES SECTION - Grouped by pharmacy and date */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">🏥 Dorixonalar statistikasi</h2>
        {Object.keys(pharmaciesByDate).length === 0 ? (
          <p className="text-gray-500 text-center py-8">Ma'lumot mavjud emas</p>
        ) : (
          <div className="space-y-6">
            {Object.keys(pharmaciesByDate).map((pharmId) => {
              const pharmEntries = pharmaciesByDate[pharmId];
              const totalQty = pharmEntries.reduce((s, e) => s + e.totalQty, 0);
              const totalValue = pharmEntries.reduce((s, e) => s + e.items.reduce((ss, it) => ss + it.total, 0), 0);
              
              return (
                <div key={pharmId} className="border border-green-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 flex justify-between items-center border-b">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">🏥 {pharmEntries[0]?.pharmacy.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">ID: {pharmEntries[0]?.pharmacy.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-600">{totalQty}</p>
                      <p className="text-sm text-gray-600">ta | {money(totalValue)}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="text-left py-2 px-3 font-semibold text-gray-700">📅 Sana</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-700">Dori nomi</th>
                          <th className="text-right py-2 px-3 font-semibold text-gray-700">Miqdor (ta)</th>
                          <th className="text-right py-2 px-3 font-semibold text-gray-700">Narxi (so'm)</th>
                          <th className="text-right py-2 px-3 font-semibold text-gray-700">Jami (so'm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pharmEntries.map((entry, idx) => (
                          entry.items.map((dayItem, didx) => {
                            return (
                              <tr key={`${idx}-${didx}`} className="border-t hover:bg-gray-50">
                                <td className="py-3 px-3 text-gray-700">{dayItem.date}</td>
                                <td className="py-3 px-3 text-gray-800">{dayItem.medicineName}</td>
                                <td className="text-right py-3 px-3 font-medium text-gray-800">{dayItem.qty}</td>
                                <td className="text-right py-3 px-3 text-gray-700">{money(dayItem.price)}</td>
                                <td className="text-right py-3 px-3 font-bold text-green-600">{money(dayItem.total)}</td>
                              </tr>
                            );
                          })
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PRODUCTS SECTION - Grouped by medicine and date */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">📦 Dorilar statistikasi</h2>
        {Object.keys(medicinesByDate).length === 0 ? (
          <p className="text-gray-500 text-center py-8">Ma'lumot mavjud emas</p>
        ) : (
          <div className="space-y-6">
            {Object.keys(medicinesByDate).map((medId) => {
              const medEntries = medicinesByDate[medId];
              const totalQty = medEntries.reduce((s, e) => s + e.totalQty, 0);
              const totalValue = medEntries.reduce((s, e) => s + e.items.reduce((ss, it) => ss + it.qty * it.price, 0), 0);
              
              return (
                <div key={medId} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 flex justify-between items-center border-b">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">{medEntries[0]?.medicine.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">SKU: {medEntries[0]?.medicine.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600">{totalQty}</p>
                      <p className="text-sm text-gray-600">ta | {money(totalValue)}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="text-left py-2 px-3 font-semibold text-gray-700">📅 Sana</th>
                          <th className="text-right py-2 px-3 font-semibold text-gray-700">Miqdor (ta)</th>
                          <th className="text-right py-2 px-3 font-semibold text-gray-700">Narxi (so'm)</th>
                          <th className="text-right py-2 px-3 font-semibold text-gray-700">Jami (so'm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medEntries.map((entry, idx) => (
                          entry.items.map((dayItem, didx) => {
                            const dayTotal = dayItem.qty * dayItem.price;
                            return (
                              <tr key={`${idx}-${didx}`} className="border-t hover:bg-gray-50">
                                <td className="py-3 px-3 text-gray-700">{dayItem.date}</td>
                                <td className="text-right py-3 px-3 font-medium text-gray-800">{dayItem.qty}</td>
                                <td className="text-right py-3 px-3 text-gray-700">{money(dayItem.price)}</td>
                                <td className="text-right py-3 px-3 font-bold text-green-600">{money(dayTotal)}</td>
                              </tr>
                            );
                          })
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {toDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-80 text-center space-y-4">
            <p className="text-lg font-medium">Haqiqatan ham o'chirasizmi?</p>
            <div className="flex justify-between gap-2">
              <button className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition" onClick={() => setToDelete(null)}>Bekor qilish</button>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition" onClick={confirmDelete}>Ha, o'chirish</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <button onClick={() => setSelected(null)} className="float-right text-2xl text-gray-400 hover:text-gray-600">✕</button>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Tarqatilgan dorilar</h2>
            <div>
              <table className="w-full text-sm">
                <thead className="bg-gray-100"><tr><th className="text-left py-2 px-2">Dori</th><th className="text-right py-2 px-2">Soni</th><th className="text-right py-2 px-2">Narx</th><th className="text-right py-2 px-2">Chegirma</th><th className="text-right py-2 px-2">Jami</th></tr></thead>
                <tbody>
                  {selected.items.map((i, idx) => {
                    const med = meds.find((m) => m.id === i.medicineId)?.name || "?";
                    const total = i.unitPrice * i.quantity - (i.discount || 0);
                    return (
                      <tr key={idx} className="border-t hover:bg-gray-50"><td className="py-2 px-2">{med}</td><td className="text-right py-2 px-2">{i.quantity}</td><td className="text-right py-2 px-2">{money(i.unitPrice)}</td><td className="text-right py-2 px-2">{i.discount || "—"}</td><td className="text-right py-2 px-2 font-semibold">{money(total)}</td></tr>
                    );
                  })}
                </tbody>
              </table>
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
  );
}
