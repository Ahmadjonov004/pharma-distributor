export const money=(n:number,c:'UZS'|'USD'='UZS')=>new Intl.NumberFormat('uz-UZ',{style:'currency',currency:c,maximumFractionDigits:0}).format(n||0)
export const shortDate=(iso?:string)=>iso?new Date(iso).toLocaleDateString('uz-UZ'):''
