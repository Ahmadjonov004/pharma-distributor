import { useEffect, useState } from "react";
import type { Medicine } from "../types";
import { api } from "../api";
import { money, shortDate } from "../utils/format";

export default function Inventory() {
  const [items, setItems] = useState<Medicine[]>([]);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    unit: "tablet",
    purchasePrice: 0,
    salePrice: 0,
    expiry: "",
    stock: 0,
  });
  const [editItem, setEditItem] = useState<Medicine | null>(null);
  const [deleteItem, setDeleteItem] = useState<Medicine | null>(null);
  const [selectedItem, setSelectedItem] = useState<Medicine | null>(null);
  const [addStockValue, setAddStockValue] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<string>("name");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  async function refresh() {
    const meds = await api.listMedicines();
    setItems(meds);
  }

  useEffect(() => {
    refresh();
  }, []);

  const handleSort = (field: keyof Medicine) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
    setItems((prev) =>
      [...prev].sort((a, b) => {
        const valA = a[field] ?? "";
        const valB = b[field] ?? "";
        if (typeof valA === "number" && typeof valB === "number")
          return sortAsc ? valA - valB : valB - valA;
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      })
    );
  };

  const submit = async () => {
    if (!form.name) return;
    await api.createMedicine(form as any);
    setForm({
      name: "",
      sku: "",
      unit: "tablet",
      purchasePrice: 0,
      salePrice: 0,
      expiry: "",
      stock: 0,
    });
    refresh();
  };

  const saveEdit = async () => {
    if (!editItem) return;
    await api.updateMedicine(editItem.id, editItem);
    setEditItem(null);
    refresh();
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    await api.deleteMedicine(deleteItem.id);
    setDeleteItem(null);
    refresh();
  };

  const addStock = async (id: string) => {
    if (addStockValue <= 0) return;
    setLoading(true);
    const med = items.find((m) => m.id === id);
    if (!med) return;
    await api.updateMedicine(id, { stock: med.stock + addStockValue });
    setAddStockValue(0);
    setLoading(false);
    refresh();
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* HEADER */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dori ombori</h1>
          <p className="text-slate-600">
            Hozirgi dorilar ro‘yxati va miqdori
          </p>
        </div>

        {/* ADD FORM */}
        <div className="bg-white rounded-2xl p-5 shadow-md w-full md:w-auto">
          <h2 className="text-lg font-semibold mb-3">Yangi dori qo‘shish</h2>
          <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
            {[
              { label: "Dori nomi", key: "name", placeholder: "Masalan: Paratsetamol" },
              { label: "SKU kodi", key: "sku", placeholder: "Masalan: PCT100" },
            ].map((f) => (
              <div key={f.key} className="flex flex-col">
                <label className="text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                <input
                  className="input"
                  placeholder={f.placeholder}
                  value={(form as any)[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              </div>
            ))}

            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-1">Birlik turi</label>
              <select
                className="input"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                <option>tablet</option>
                <option>capsula</option>
                <option>ml</option>
                <option>maz</option>
                <option>sirop</option>
                <option>bottle</option>
                <option>boshqa</option>
              </select>
            </div>

            {[
              { label: "Xarid narxi (so‘m)", key: "purchasePrice" },
              { label: "Sotuv narxi (so‘m)", key: "salePrice" },
              { label: "Miqdor", key: "stock" },
            ].map((f) => (
              <div key={f.key} className="flex flex-col">
                <label className="text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                <input
                  className="input"
                  type="number"
                  placeholder="0"
                  value={(form as any)[f.key] || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [f.key]: Number(e.target.value || 0),
                    })
                  }
                />
              </div>
            ))}

            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-1">
                Yaroqlilik muddati
              </label>
              <input
                className="input"
                type="date"
                value={form.expiry}
                onChange={(e) => setForm({ ...form, expiry: e.target.value })}
              />
            </div>

            <div className="flex items-end">
              <button onClick={submit} className="btn-primary w-full h-[42px]">
                Qo‘shish
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl p-4 shadow-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b">
            <tr>
              {[
                { key: "name", label: "Nomi" },
                { key: "sku", label: "SKU" },
                { key: "unit", label: "Birlik" },
                { key: "expiry", label: "Yaroqlilik" },
                { key: "purchasePrice", label: "Xarid" },
                { key: "salePrice", label: "Sotuv" },
                { key: "stock", label: "Miqdor" },
              ].map((c) => (
                <th
                  key={c.key}
                  onClick={() => handleSort(c.key as keyof Medicine)}
                  className="py-2 cursor-pointer select-none hover:text-blue-600"
                >
                  {c.label} {sortField === c.key ? (sortAsc ? "▲" : "▼") : ""}
                </th>
              ))}
              <th className="text-right">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr
                key={m.id}
                className="border-t hover:bg-slate-50 cursor-pointer"
                onClick={() => setSelectedItem(m)}
              >
                <td className="py-2 font-medium">{m.name}</td>
                <td>{m.sku}</td>
                <td>{m.unit}</td>
                <td>{shortDate(m.expiry)}</td>
                <td>{money(m.purchasePrice)}</td>
                <td>{money(m.salePrice)}</td>
                <td>{m.stock}</td>
                <td className="text-right">
                  <div className="flex gap-2 justify-end flex-wrap">
                    <input
                      type="number"
                      placeholder="+"
                      className="w-16 input text-center"
                      value={addStockValue || ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        setAddStockValue(Number(e.target.value))
                      }
                    />
                    <button
                      disabled={loading}
                      onClick={(e) => {
                        e.stopPropagation();
                        addStock(m.id);
                      }}
                      className="btn text-blue-600 border-blue-300"
                    >
                      Qo‘shish
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditItem(m);
                      }}
                      className="btn text-green-600 border-green-300"
                    >
                      Tahrirlash
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteItem(m);
                      }}
                      className="btn text-red-600 border-red-300"
                    >
                      O‘chirish
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL – Dorining batafsil ma’lumoti */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-lg p-6 w-[90%] max-w-md space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-2">{selectedItem.name}</h2>
            <p>SKU: {selectedItem.sku}</p>
            <p>Birlik: {selectedItem.unit}</p>
            <p>Yaroqlilik: {shortDate(selectedItem.expiry)}</p>
            <p>Xarid narxi: {money(selectedItem.purchasePrice)}</p>
            <p>Sotuv narxi: {money(selectedItem.salePrice)}</p>
            <p>Miqdor: {selectedItem.stock} dona</p>
            <div className="text-right">
              <button className="btn" onClick={() => setSelectedItem(null)}>
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tahrirlash modali */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-[90%] max-w-md space-y-3">
            <h2 className="text-lg font-semibold">Dorini tahrirlash</h2>
            <input
              className="input"
              value={editItem.name}
              onChange={(e) =>
                setEditItem({ ...editItem, name: e.target.value })
              }
            />
            <input
              className="input"
              type="number"
              value={editItem.salePrice}
              onChange={(e) =>
                setEditItem({
                  ...editItem,
                  salePrice: Number(e.target.value),
                })
              }
            />
            <input
              className="input"
              type="number"
              value={editItem.stock}
              onChange={(e) =>
                setEditItem({
                  ...editItem,
                  stock: Number(e.target.value),
                })
              }
            />
            <div className="flex justify-end gap-2 mt-3">
              <button className="btn" onClick={() => setEditItem(null)}>
                Bekor qilish
              </button>
              <button className="btn-primary" onClick={saveEdit}>
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* O‘chirish modali */}
      {deleteItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-[90%] max-w-md">
            <h2 className="text-lg font-semibold text-center mb-4">
              {deleteItem.name} dorisini o‘chirishni xohlaysizmi?
            </h2>
            <div className="flex justify-center gap-4">
              <button
                className="btn border-green-300 text-green-600"
                onClick={() => setDeleteItem(null)}
              >
                Yo‘q
              </button>
              <button
                className="btn border-red-300 text-red-600"
                onClick={confirmDelete}
              >
                Ha, o‘chirilsin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
