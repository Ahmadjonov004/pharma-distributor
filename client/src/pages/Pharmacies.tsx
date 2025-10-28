import { useEffect, useState } from "react";
import type { Pharmacy } from "../types";
import { api } from "../api";

export default function Pharmacies() {
  const [list, setList] = useState<Pharmacy[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", address: "", contact: "" });
  const [editModal, setEditModal] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔄 Ma’lumotlarni olish
  async function refresh() {
    setLoading(true);
    const data = await api.listPharmacies();
    setList(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  // ➕ Yangi dorixona qo‘shish
  const submit = async () => {
    if (!form.name.trim()) return alert("Dorixona nomini kiriting!");
    await api.createPharmacy(form as any);
    setForm({ name: "", phone: "", address: "", contact: "" });
    refresh();
  };

  // 🗑 O‘chirish
  const remove = async (id: string) => {
    if (!confirm("Bu dorixonani o‘chirishni xohlaysizmi?")) return;
    await api.deletePharmacy(id);
    refresh();
  };

  // ✏️ Tahrirlashni saqlash
const saveEdit = async () => {
  if (!editModal) return;
  const { id, ...updatedFields } = editModal; // ✅ id ni ajratib oldik
  await api.updatePharmacy(id, updatedFields); // ✅ idsiz yuboramiz
  setEditModal(null);
  refresh();
};


  return (
    <div className="space-y-8">
      {/* --- Sarlavha --- */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 text-center md:text-left">
        Dorixonalar boshqaruvi 🏥
      </h1>

      {/* --- Forma bo‘limi --- */}
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-700 text-center md:text-left">
          Yangi dorixona qo‘shish
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {["name", "phone", "address", "contact"].map((key) => (
            <input
              key={key}
              className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base"
              placeholder={
                key === "name"
                  ? "Dorixona nomi"
                  : key === "phone"
                  ? "Telefon raqami"
                  : key === "address"
                  ? "Manzil"
                  : "Mas’ul shaxs"
              }
              value={(form as any)[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          ))}
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition p-2 text-sm sm:text-base"
            onClick={submit}
          >
            Qo‘shish
          </button>
        </div>
      </div>

      {/* --- Jadval --- */}
      <div className="bg-white rounded-2xl p-5 shadow-md overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-700">Dorixonalar ro‘yxati</h2>
          {loading && <span className="text-sm text-gray-500 animate-pulse">Yuklanmoqda...</span>}
        </div>

        <table className="w-full text-sm min-w-[650px]">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="py-2 text-left">Nomi</th>
              <th className="text-left">Telefon</th>
              <th className="text-left">Manzil</th>
              <th className="text-left">Mas’ul shaxs</th>
              <th className="text-right">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {list.length > 0 ? (
              list.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50 transition">
                  <td className="py-2 font-medium text-gray-800">{p.name}</td>
                  <td>{p.phone || "—"}</td>
                  <td>{p.address || "—"}</td>
                  <td>{p.contact || "—"}</td>
                  <td className="text-right space-x-2">
                    <button
                      onClick={() => setEditModal(p)}
                      className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg px-3 py-1 text-sm font-medium transition"
                    >
                      Tahrirlash
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="bg-red-100 text-red-600 hover:bg-red-200 rounded-lg px-3 py-1 text-sm font-medium transition"
                    >
                      O‘chirish
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500 italic">
                  Hozircha dorixona mavjud emas 😕
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- ✏️ Edit Modal --- */}
      {editModal && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
          onClick={() => setEditModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 w-[90%] sm:w-[400px] transform transition-all duration-300 scale-95 animate-[fadeIn_0.3s_ease-out_forwards]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              Dorixona ma’lumotlarini tahrirlash
            </h2>

            <div className="space-y-3">
              {["name", "phone", "address", "contact"].map((key) => (
                <input
                  key={key}
                  className="border border-gray-300 rounded-lg w-full p-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder={
                    key === "name"
                      ? "Dorixona nomi"
                      : key === "phone"
                      ? "Telefon raqami"
                      : key === "address"
                      ? "Manzil"
                      : "Mas’ul shaxs"
                  }
                  value={(editModal as any)[key]}
                  onChange={(e) =>
                    setEditModal({ ...editModal, [key]: e.target.value } as Pharmacy)
                  }
                />
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setEditModal(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition text-sm"
              >
                Bekor qilish
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition text-sm"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
