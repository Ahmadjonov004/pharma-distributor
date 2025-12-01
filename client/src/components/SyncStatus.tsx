import React, { useEffect, useState } from 'react'

export default function SyncStatus(){
  const [online, setOnline] = useState<boolean>(navigator.onLine)
  const [queueLen, setQueueLen] = useState<number>(0)

  useEffect(()=>{
    const onOnline = ()=> setOnline(true)
    const onOffline = ()=> setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return ()=>{ window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  },[])

  useEffect(()=>{
    const up = ()=>{
      const user = localStorage.getItem('pharma_currentUser')
      if(!user) { setQueueLen(0); return }
      const u = JSON.parse(user)
      const key = `pharma_sync_queue_${u.id}`
      const q = localStorage.getItem(key)
      const queue = q ? JSON.parse(q) : []
      setQueueLen(queue.length)
    }
    up()
    const iv = setInterval(up, 2000)
    return ()=> clearInterval(iv)
  },[])

  if(!online) return <div className='text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded'>Offline</div>
  if(queueLen>0) return <div className='text-xs text-slate-700 bg-blue-50 px-2 py-1 rounded'>Syncing ({queueLen})</div>
  return <div className='text-xs text-green-700 bg-green-50 px-2 py-1 rounded'>Synced</div>
}
