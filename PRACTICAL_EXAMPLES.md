# 🎓 ПРАКТИK MISOLLAR VA CODE EXPLANATION

## 1. LOGIN JARAYONI TUSHUNTIRISH

### User butonni bosadi:
```
├─ "Kirish" button → handleLogin() function chaqiriladi
├─ handleLogin() → useAuth() context'dan login() oladi
├─ login(username, password) → API call:
│   └─ POST http://localhost:4000/auth/login
│      {username: "test", password: "123456"}
│
├─ Server tomonda:
│   ├─ User'ni database'da topish (User.findOne())
│   ├─ Parolni bcrypt bilan solishtirish
│   ├─ JWT token yaratish (15 min)
│   ├─ Refresh token yaratish (7 day)
│   └─ Qaytarish: {token: "eyJ...", refreshToken: "eyJ..."}
│
├─ Frontend'ga qaytgandan so'ng:
│   ├─ localStorage'ga token saqlash
│   ├─ localStorage'ga refreshToken saqlash
│   ├─ AuthContext state update qilish
│   ├─ localStorage'dagi products/orders'ni serverga yuborish
│   └─ Dashboard'ga navigate qilish
│
└─ Dashboard yuklanadi (✓ Successfully logged in!)
```

### Code Example:
```typescript
// client/src/pages/Auth.tsx
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setIsLoading(true)
  try {
    // API call
    const res = await login(loginForm.username, loginForm.password)
    // ✓ Success - redirect to dashboard
    navigate('/')
  } catch (err: any) {
    // ❌ Error - show message
    setError(err.response?.data?.error || 'Xatolik yuz berdi')
  } finally {
    setIsLoading(false)
  }
}
```

---

## 2. PRODUCT YARATISH (CREATE)

### Scenario: User login'dan so'ng product qo'shadi

```
┌─────────────────────────────────────────────────────────┐
│ User "Mahsulot qo'shish" button'ni bosdi                │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ DataContext.addProduct() chaqiriladi                    │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    USER LOGGED IN           USER NOT LOGGED IN
         │                       │
┌────────▼────────────┐  ┌───────▼──────────────┐
│ POST /products      │  │ localStorage'ga      │
│ (server'ga)         │  │ qo'shish             │
└────────┬────────────┘  └───────┬──────────────┘
         │                       │
┌────────▼────────────┐  ┌───────▼──────────────┐
│ MongoDB'ga saqlash  │  │ Offline mode:        │
│ Qaytarish: {_id:..} │  │ _id = Date.now()    │
└────────┬────────────┘  └───────┬──────────────┘
         │                       │
┌────────▼────────────────────────▼──────────────┐
│ setProducts([...products, newProduct])         │
│ → UI update qilish (display newProduct)        │
└───────────────────────────────────────────────┘
```

### Code Example:
```typescript
// client/src/context/DataContext.tsx
const addProduct = async (product: Omit<Product, '_id'>) => {
  if (token) {
    // Server'ga yuborish
    try {
      const response = await productsAPI.create(product)
      // response.data = {_id: "...", name: "...", price: 5000, ...}
      setProducts([...products, response.data])
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  } else {
    // localStorage'ga yuborish (offline)
    const newProduct = { _id: Date.now().toString(), ...product }
    const updatedProducts = [...products, newProduct]
    setProducts(updatedProducts)
    localStorage.setItem('products', JSON.stringify(updatedProducts))
  }
}
```

### Backend Controller:
```javascript
// server/controllers/productController.js
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, quantity } = req.body
    // req.user.id JWT token'dan olingan
    const product = await Product.create({
      name,
      description,
      price,
      quantity,
      owner: req.user.id,  // ← Har bir product user ga bog'langan!
    })
    res.status(201).json(product)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
}
```

---

## 3. AXIOS API SERVICE

### Configuring axios with interceptors:

```typescript
// client/src/services/api.ts

// 1. axios instance yaratish
const api = axios.create({
  baseURL: 'http://localhost:4000',
})

// 2. Request interceptor (har bir request'ga token qo'shish)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 3. Response interceptor (token muddati tugsa refresh qilish)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Agar 403 (Forbidden) va retry bo'lmagan bo'lsa
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          // Yangi token olish
          const { data } = await axios.post(
            'http://localhost:4000/auth/refresh',
            { refreshToken }
          )
          
          // Yangi token saqlash
          localStorage.setItem('auth_token', data.token)
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          
          // Orifinal request qayta yuborish
          return api(originalRequest)
        } catch (err) {
          // Refresh failed → logout
          localStorage.removeItem('auth_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    
    return Promise.reject(error)
  }
)
```

### API Functions:
```typescript
export const productsAPI = {
  // GET /products
  getAll: () => api.get('/products'),
  
  // POST /products
  create: (product: any) => api.post('/products', product),
  
  // PUT /products/:id
  update: (id: string, product: any) => api.put(`/products/${id}`, product),
  
  // DELETE /products/:id
  delete: (id: string) => api.delete(`/products/${id}`),
}
```

### Usage in React Component:
```typescript
const handleAddProduct = async () => {
  try {
    // API call (token automatik qo'shiladi)
    const response = await productsAPI.create({
      name: 'Aspirin',
      price: 5000,
      quantity: 100,
      description: 'Pain reliever',
    })
    
    // response.data = {_id: "...", name: "Aspirin", ...}
    console.log('Product created:', response.data)
  } catch (error) {
    console.error('Error:', error)
  }
}
```

---

## 4. OFFLINE ↔ ONLINE SYNC JARAYONI

### Scenario: User offline bo'lib product qo'shdi, keyin online bo'ldi

```
STEP 1: Offline mode - Product qo'shish
├─ user login qilgan emas (token yo'q)
├─ localStorage'da 'products': [
│   {_id: '1234567890', name: 'Aspirin', price: 5000, ...}
│ ]
└─ ✓ localStorage'ga saqlandi

STEP 2: User login qildi
├─ POST /auth/login
├─ Backend qaytaradi: {token: "eyJ...", refreshToken: "eyJ..."}
├─ localStorage'ga token saqlandi
└─ syncLocalStorageToServer() chaqiriladi:
    ├─ localStorage'dan products olish
    ├─ Har bir product uchun POST /products
    │  ├─ Backend: MongoDB'ga saqlash
    │  ├─ Qaytarish: {_id: "507f1f77bcf86cd799439011", ...} (MongoDB _id)
    │  └─ Frontend: New _id saqlash
    └─ localStorage'ni tozalash (products & orders)

STEP 3: Fresh data yuklash
├─ GET /products
├─ Backend: MongoDB'dan user's products'ni olish
└─ Frontend: setProducts(serverData)

RESULT:
├─ localStorage offline mode data → MongoDB
├─ User data availability: Online va Offline both
└─ ✓ Sync complete!
```

### Code in AuthContext:
```typescript
const syncLocalStorageToServer = async () => {
  const localProducts = JSON.parse(localStorage.getItem('products') || '[]')
  const localOrders = JSON.parse(localStorage.getItem('orders') || '[]')

  // Produksiyalarni serverga yuborish
  for (const product of localProducts) {
    try {
      await productsAPI.create(product)
    } catch (error) {
      console.error('Sync error:', error)
    }
  }

  // Buyurtmalarni serverga yuborish
  for (const order of localOrders) {
    try {
      await ordersAPI.create(order)
    } catch (error) {
      console.error('Sync error:', error)
    }
  }

  // localStorage'ni tozalash
  localStorage.removeItem('products')
  localStorage.removeItem('orders')
}
```

---

## 5. TOKEN REFRESH FLOW

### Automatic Token Refresh Example:

```
USER ACTION (1 soatdan so'ng)
        │
        ▼
API REQUEST (old token bilan)
        │
        ▼
401 UNAUTHORIZED (token expired)
        │
        ▼
Axios Response Interceptor
        │
        ├─ status === 403?
        │  └─ YES → continue
        ├─ originalRequest._retry === false?
        │  └─ YES → continue
        │
        ▼
REFRESH REQUEST
├─ POST /auth/refresh
├─ Body: {refreshToken: "eyJ..."}
        │
        ▼
BACKEND
├─ Refresh token tekshirish
├─ Yangi JWT token yaratish
└─ Qaytarish: {token: "eyJ..."}
        │
        ▼
FRONTEND
├─ Yangi token saqlash
├─ API headers update qilish
├─ Orifinal request qayta yuborish
        │
        ▼
✓ Request SUCCESS!
```

### Interceptor Code:
```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403) {
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        })
        
        // Update token
        localStorage.setItem('auth_token', data.token)
        
        // Qayta try qilish
        return api(error.config)
      } catch (err) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
```

---

## 6. DEPLOY QILGANDAN SO'NG URL O'ZGARISHI

### Before Deploy:
```
Frontend: http://localhost:5173
Backend: http://localhost:4000
.env:
  VITE_API_BASE_URL=http://localhost:4000
```

### After Deploy (Render + Netlify):
```
Frontend: https://pharma-distributor.netlify.app
Backend: https://pharma-distributor-api.onrender.com
.env:
  VITE_API_BASE_URL=https://pharma-distributor-api.onrender.com

Backend .env (CORS):
  ALLOWED_ORIGIN=https://pharma-distributor.netlify.app
```

### Backend'da CORS Update:
```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
```

---

## 🎯 STEP-BY-STEP TEST QILISH

### Test 1: Register User
```bash
# Terminal:
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"secure123"}'

# Response:
# {"message":"User registered"}
```

### Test 2: Login
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"secure123"}'

# Response:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# }

# Token'ni save qiling (TOKEN_HERE'ga kopilashtiring)
```

### Test 3: Create Product
```bash
curl -X POST http://localhost:4000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{
    "name": "Aspirin 500mg",
    "description": "Pain reliever",
    "price": 5000,
    "quantity": 100
  }'

# Response:
# {
#   "_id": "507f1f77bcf86cd799439011",
#   "name": "Aspirin 500mg",
#   "owner": "507f1f77bcf86cd799439010",
#   "price": 5000,
#   "quantity": 100
# }
```

### Test 4: Get All Products
```bash
curl http://localhost:4000/products \
  -H "Authorization: Bearer TOKEN_HERE"

# Response: [{ Product objects }]
```

---

## 📚 LEARNING RESOURCES

- **JWT Tokens**: https://jwt.io/introduction
- **MongoDB Basics**: https://docs.mongodb.com/manual/
- **Express Middleware**: https://expressjs.com/en/guide/using-middleware.html
- **React Context API**: https://react.dev/reference/react/useContext
- **Axios Documentation**: https://axios-http.com/docs/intro

---

**Barcha misollar amaliyotda ishlatiladi! 🚀**

