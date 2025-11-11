import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, LogIn } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  password: string
  createdAt: string
}

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  // Initialization - test users qo'shish
  useEffect(() => {
    const users = localStorage.getItem('pharma_users')
    if (!users) {
      // Birinchi marta test data qo'shish
      const testUsers: User[] = [
        {
          id: '1',
          name: 'Test Foydalanuvchi',
          email: 'test@mail.com',
          password: '123456',
          createdAt: new Date().toISOString()
        }
      ]
      localStorage.setItem('pharma_users', JSON.stringify(testUsers))
    }
  }, [])

  // Ma'lumotlar bazasini olish
  const getUsers = (): User[] => {
    const users = localStorage.getItem('pharma_users')
    return users ? JSON.parse(users) : []
  }

  // Foydalanuvchini saqlash
  const saveUser = (user: User) => {
    const users = getUsers()
    users.push(user)
    localStorage.setItem('pharma_users', JSON.stringify(users))
  }

  // Foydalanuvchining alohida ma'lumotlar bazasini yaratish
  const createUserDatabase = (userId: string) => {
    const userDB = {
      medicines: [],
      pharmacies: [],
      distributions: [],
      settings: {
        currency: 'UZS',
        distributorName: 'Pharma Distributor'
      }
    }
    localStorage.setItem(`pharma_data_${userId}`, JSON.stringify(userDB))
  }

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const users = getUsers()
      const user = users.find(
        u => u.email === loginForm.email && u.password === loginForm.password
      )

      if (!user) {
        setError('Email yoki parol noto\'g\'ri!')
        setLoading(false)
        return
      }

      // Hozirgi foydalanuvchini session-da saqlash
      localStorage.setItem('pharma_currentUser', JSON.stringify(user))
      
      // Agar bu foydalanuvchining ma'lumotlar bazasi bo'lmasa, yaratish
      const userDB = localStorage.getItem(`pharma_data_${user.id}`)
      if (!userDB) {
        createUserDatabase(user.id)
      }

      setLoading(false)
      navigate('/')
    } catch (err) {
      setError('Xatolik yuz berdi')
      setLoading(false)
    }
  }

  // Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Tekshiruv
      if (!registerForm.name.trim()) {
        setError('Ismingizni kiriting!')
        setLoading(false)
        return
      }

      if (!registerForm.email.includes('@')) {
        setError('Emailingizni to\'g\'ri kiriting!')
        setLoading(false)
        return
      }

      if (registerForm.password.length < 6) {
        setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak!')
        setLoading(false)
        return
      }

      if (registerForm.password !== registerForm.confirmPassword) {
        setError('Parollar bir-biriga mos emas!')
        setLoading(false)
        return
      }

      // Email takrorlanmaganligi tekshirish
      const users = getUsers()
      if (users.find(u => u.email === registerForm.email)) {
        setError('Bu email allaqachon ro\'yxatdan o\'tgan!')
        setLoading(false)
        return
      }

      // Yangi foydalanuvchini yaratish
      const newUser: User = {
        id: Date.now().toString(),
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        createdAt: new Date().toISOString()
      }

      saveUser(newUser)

      // Yangi foydalanuvchi uchun ma'lumotlar bazasi yaratish
      createUserDatabase(newUser.id)

      // Avtomatik login
      localStorage.setItem('pharma_currentUser', JSON.stringify(newUser))
      setLoading(false)
      navigate('/')
    } catch (err) {
      setError('Xatolik yuz berdi')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-white rounded-full mb-4">
            <LogIn className="text-blue-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white">💊 Pharma</h1>
          <p className="text-blue-100 mt-2">Farmatsevtik Tarqatish Tizimi</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => {
                setMode('login')
                setError('')
              }}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                mode === 'login'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Kirish
            </button>
            <button
              onClick={() => {
                setMode('register')
                setError('')
              }}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                mode === 'register'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Ro'yxat
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input
                    type="email"
                    placeholder="example@mail.com"
                    value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Parol
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input
                    type="password"
                    placeholder="••••••"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Kuting...' : 'Kirish'}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  F.I.Sh
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Ismi Familyasi"
                    value={registerForm.name}
                    onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input
                    type="email"
                    placeholder="example@mail.com"
                    value={registerForm.email}
                    onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Parol
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input
                    type="password"
                    placeholder="••••••"
                    value={registerForm.password}
                    onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Parolni tasdiqlash
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                  <input
                    type="password"
                    placeholder="••••••"
                    value={registerForm.confirmPassword}
                    onChange={e => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Kuting...' : 'Ro\'yxatdan o\'tish'}
              </button>
            </form>
          )}

          {/* Test Accounts Info */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center mb-2">
              Test uchun:
            </p>
            <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2 rounded">
              <p>📧 Email: test@mail.com</p>
              <p>🔐 Parol: 123456</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
