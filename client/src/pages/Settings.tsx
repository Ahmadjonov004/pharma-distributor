export default function Settings(){
  return (
    <div className='space-y-6 p-4 md:p-8'>
      <div>
        <h1 className='text-3xl font-bold text-slate-800'>⚙️ Sozlamalar</h1>
        <p className='text-slate-600 mt-2'>Tizim sozlamalari va konfiguratsiyasi</p>
      </div>

      {/* Asosiy sozlamalar */}
      <div className='bg-white rounded-2xl p-6 shadow-md border-l-4 border-blue-500'>
        <h2 className='text-xl font-semibold text-slate-800 mb-4'>💱 Pul birligi</h2>
        <div className='bg-blue-50 rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-600'>Joriy valyuta</p>
              <p className='text-2xl font-bold text-blue-600'>UZS (So\'m)</p>
            </div>
            <div className='text-4xl'>💰</div>
          </div>
        </div>
      </div>

      {/* Distributori ma'lumoti */}
      <div className='bg-white rounded-2xl p-6 shadow-md border-l-4 border-green-500'>
        <h2 className='text-xl font-semibold text-slate-800 mb-4'>🏢 Distributorning ma\'lumoti</h2>
        <div className='bg-green-50 rounded-lg p-4 space-y-3'>
          <div>
            <p className='text-sm text-slate-600'>Nomi</p>
            <p className='text-lg font-semibold text-green-700'>Pharma Distributor</p>
          </div>
          <div>
            <p className='text-sm text-slate-600'>Tizim versiyasi</p>
            <p className='text-lg font-semibold text-green-700'>v1.0.0</p>
          </div>
        </div>
      </div>

      {/* Qo'shimcha xususiyatlar */}
      <div className='bg-white rounded-2xl p-6 shadow-md border-l-4 border-purple-500'>
        <h2 className='text-xl font-semibold text-slate-800 mb-4'>✨ Qo\'shimcha xususiyatlar</h2>
        <div className='grid md:grid-cols-2 gap-4'>
          <div className='bg-purple-50 rounded-lg p-4'>
            <p className='text-sm text-slate-600 mb-2'>🔐 Autentifikatsiya</p>
            <p className='text-slate-500'>Ko\'p foydalanuvchili kirish tizimi</p>
          </div>
          <div className='bg-purple-50 rounded-lg p-4'>
            <p className='text-sm text-slate-600 mb-2'>📊 Hisobotlar</p>
            <p className='text-slate-500'>Batafsil analitika va statistika</p>
          </div>
          <div className='bg-purple-50 rounded-lg p-4'>
            <p className='text-sm text-slate-600 mb-2'>💵 QQS</p>
            <p className='text-slate-500'>Soliq hisob-kitob avtomatizatsiyasi</p>
          </div>
          <div className='bg-purple-50 rounded-lg p-4'>
            <p className='text-sm text-slate-600 mb-2'>👥 Rollar</p>
            <p className='text-slate-500'>Foydalanuvchi roli va ruxsatlari</p>
          </div>
          <div className='bg-purple-50 rounded-lg p-4'>
            <p className='text-sm text-slate-600 mb-2'>🖨️ Chop etish</p>
            <p className='text-slate-500'>Cheklar va shartnomalarni chop etish</p>
          </div>
          <div className='bg-purple-50 rounded-lg p-4'>
            <p className='text-sm text-slate-600 mb-2'>🔔 Ogohlantirish</p>
            <p className='text-slate-500'>Amal qilish muddati tugayotgan dorilar</p>
          </div>
        </div>
      </div>

      {/* Dorilar bilan ishlash */}
      <div className='bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 shadow-md'>
        <h2 className='text-xl font-semibold text-slate-800 mb-4'>📦 Dorilarni boshqarish</h2>
        <div className='space-y-3'>
          <div className='flex items-center justify-between p-4 bg-white rounded-lg'>
            <span className='text-slate-700'>Batch/Expiry alerts</span>
            <span className='bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold'>Tezroq</span>
          </div>
          <div className='flex items-center justify-between p-4 bg-white rounded-lg'>
            <span className='text-slate-700'>Qaytarilishi qayd etilgan dorilar</span>
            <span className='bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold'>Tezroq</span>
          </div>
          <div className='flex items-center justify-between p-4 bg-white rounded-lg'>
            <span className='text-slate-700'>Zararlanmagan dorilar</span>
            <span className='bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold'>Tezroq</span>
          </div>
        </div>
      </div>

      {/* Ma'lumot */}
      <div className='bg-slate-50 rounded-2xl p-6 border-2 border-slate-200'>
        <p className='text-sm text-slate-600 leading-relaxed'>
          💡 <b>Maslahat:</b> Barcha sozlamalar avtomatik saqlaladi. Yangi xususiyatlar haqida bilib olish uchun qayta-qayta tekshiring.
        </p>
      </div>
    </div>
  )
}
