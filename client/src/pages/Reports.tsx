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
      const totalA = a.items.reduce(
        (s, i) => s + i.unitPrice * i.quantity - (i.discount || 0),
        0
      );
      const totalB = b.items.reduce(
        (s, i) => s + i.unitPrice * i.quantity - (i.discount || 0),
        0
      );

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
        return sortDir === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortDir === "asc" ? +valA - +valB : +valB - +valA;
      }
    });
  }, [dists, fro, to, sortKey, sortDir, phs]);

  const total = filtered.reduce(
    (s, d) =>
      s +
      d.items.reduce(
        (a, i) => a + i.unitPrice * i.quantity - (i.discount || 0),
        0
      ),
    0
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-8">
      {/* --- Sarlavha --- */}
      <h1 className="text-3xl font-bold text-gray-800">
        Hisobotlar bo‘limi 📊
      </h1>

      {/* --- Filtrlash bo‘limi --- */}
      <div className="bg-white rounded-2xl p-5 shadow-md grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-4 items-end">
        <div>
          <label className="block text-gray-600 text-sm mb-1">
            Boshlanish sanasi
          </label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={fro}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-gray-600 text-sm mb-1">
            Tugash sanasi
          </label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <button
          onClick={() => {
            setFrom("");
            setTo("");
          }}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium py-2 transition"
        >
          Filtrni tozalash
        </button>

        <button
          onClick={() => api.exportCSV(fro || undefined, to || undefined)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium py-2 transition"
        >
          CSV faylga eksport qilish
        </button>
      </div>

      {/* --- Jadval --- */}
      <div className="bg-white rounded-2xl p-5 shadow-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-500 border-b">
            <tr>
              <th
                className="py-2 text-left cursor-pointer hover:text-blue-600"
                onClick={() => toggleSort("date")}
              >
                Sana {sortKey === "date" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="text-left cursor-pointer hover:text-blue-600"
                onClick={() => toggleSort("pharmacy")}
              >
                Dorixona {sortKey === "pharmacy" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th>Mahsulotlar soni</th>
              <th
                className="text-left cursor-pointer hover:text-blue-600"
                onClick={() => toggleSort("total")}
              >
                Umumiy summa {sortKey === "total" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((d) => {
                const ph = phs.find((p) => p.id === d.pharmacyId)?.name || "—";
                const sum = d.items.reduce(
                  (a, it) =>
                    a + it.unitPrice * it.quantity - (it.discount || 0),
                  0
                );

                return (
                  <tr
                    key={d.id}
                    className="border-b hover:bg-blue-50 transition cursor-pointer"
                    onClick={() => setSelected(d)}
                  >
                    <td className="py-2">{shortDate(d.date)}</td>
                    <td>{ph}</td>
                    <td>{d.items.length} ta</td>
                    <td className="font-medium text-gray-800">{money(sum)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-4 text-gray-500 italic"
                >
                  Ma’lumot topilmadi 😕
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Umumiy summa --- */}
      <div className="text-right text-lg font-semibold text-gray-800">
        Umumiy summa: <span className="text-blue-600">{money(total)}</span>
      </div>

      {/* --- Modal tafsilot --- */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-lg relative">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Tarqatilgan dorilar ro‘yxati
            </h2>
            <div className="overflow-y-auto max-h-80">
              <table className="w-full text-sm">
                <thead className="border-b text-gray-600">
                  <tr>
                    <th className="text-left py-1">Dori nomi</th>
                    <th className="text-left py-1">Soni</th>
                    <th className="text-left py-1">Narxi</th>
                    <th className="text-left py-1">Chegirma</th>
                    <th className="text-left py-1">Jami</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((i, idx) => {
                    const med = meds.find((m) => m.id === i.medicineId)?.name || "Noma’lum";
                    const total = i.unitPrice * i.quantity - (i.discount || 0);
                    return (
                      <tr key={idx} className="border-b">
                        <td className="py-1">{med}</td>
                        <td>{i.quantity}</td>
                        <td>{money(i.unitPrice)}</td>
                        <td>{i.discount ? money(i.discount) : "—"}</td>
                        <td className="font-medium">{money(total)}</td>
                      </tr>
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
