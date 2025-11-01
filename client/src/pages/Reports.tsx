
// Reports.tsx with delete button & confirmation modal
// (existing logic untouched, only delete button added)
import { useEffect, useMemo, useState } from "react";
import type { Distribution, Medicine, Pharmacy } from "../types";
import { api } from "../api";
import { money, shortDate } from "../utils/format";
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
  const [toDelete, setToDelete] = useState<Distribution | null>(null); // ✅ delete state

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

  // ✅ delete function
  const confirmDelete = async () => {
    if (!toDelete) return;
    await api.deleteDistribution(toDelete.id);
    setDists((prev) => prev.filter((d) => d.id !== toDelete.id));
    setToDelete(null);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Hisobotlar bo‘limi 📊</h1>

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
        <button onClick={() => { setFrom(""); setTo(""); }} className="bg-gray-200 rounded-lg py-2">Filtrni tozalash</button>
        <button onClick={() => api.exportCSV(fro || undefined, to || undefined)} className="bg-blue-600 text-white rounded-lg py-2">CSV eksport</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl p-5 shadow-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-500 border-b">
            <tr>
              <th onClick={() => toggleSort("date")}>Sana</th>
              <th onClick={() => toggleSort("pharmacy")}>Dorixona</th>
              <th>Mahsulotlar</th>
              <th onClick={() => toggleSort("total")}>Summa</th>
              <th>Amal</th> {/* ✅ */}
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => {
              const ph = phs.find((p) => p.id === d.pharmacyId)?.name || "—";
              const sum = d.items.reduce((a, it) => a + it.unitPrice * it.quantity - (it.discount || 0), 0);
              return (
                <tr key={d.id} className="border-b hover:bg-blue-50">
                  <td onClick={() => setSelected(d)}>{shortDate(d.date)}</td>
                  <td onClick={() => setSelected(d)}>{ph}</td>
                  <td onClick={() => setSelected(d)}>{d.items.length} ta</td>
                  <td onClick={() => setSelected(d)}>{money(sum)}</td>
                  <td>
                    <button onClick={() => setToDelete(d)} className="text-red-600 hover:text-red-800">
                      🗑 O‘chirish
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ✅ Delete confirm modal */}
      {toDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-80 text-center space-y-4">
            <p className="text-lg font-medium">Haqiqatan ham o‘chirasizmi?</p>
            <div className="flex justify-between gap-2">
              <button className="bg-gray-200 px-3 py-2 rounded" onClick={() => setToDelete(null)}>Bekor qilish</button>
              <button className="bg-red-600 text-white px-3 py-2 rounded" onClick={confirmDelete}>Ha, o‘chirish</button>
            </div>
          </div>
        </div>
      )}

      {/* existing detail modal stays same */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <button onClick={() => setSelected(null)} className="absolute top-3 right-3">✕</button>
            <h2 className="text-xl font-semibold mb-4">Tarqatilgan dorilar</h2>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead><tr><th>Dori</th><th>Soni</th><th>Narx</th><th>Chegirma</th><th>Jami</th></tr></thead>
                <tbody>
                  {selected.items.map((i, idx) => {
                    const med = meds.find((m) => m.id === i.medicineId)?.name || "?";
                    const total = i.unitPrice * i.quantity - (i.discount || 0);
                    return (
                      <tr key={idx}><td>{med}</td><td>{i.quantity}</td><td>{money(i.unitPrice)}</td><td>{i.discount || "—"}</td><td>{money(total)}</td></tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
