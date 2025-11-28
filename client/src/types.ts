export type UUID = string
export type Currency = 'UZS'|'USD'
export interface Medicine{ id:UUID; name:string; sku:string; unit:'tablet'|'capsule'|'ml'|'g'|'pack'|'bottle'|'other'; purchasePrice:number; salePrice:number; expiry?:string; stock:number; supplier?:string; createdAt:string }
export interface Pharmacy{ id:UUID; name:string; phone?:string; address?:string; contact?:string; createdAt:string; totalDebt?: number; paidAmount?: number }
export interface Supplier{ id:UUID; name:string; totalDebt?:number; paidAmount?:number }
export interface DistributionItem{ medicineId:UUID; quantity:number; unitPrice:number; discount?:number }
export interface Distribution{ id:UUID; pharmacyId:UUID; date:string; items:DistributionItem[]; notes?:string }
