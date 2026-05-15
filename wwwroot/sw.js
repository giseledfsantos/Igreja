self.addEventListener('push', (event) => {
  const show = async () => {
    let data = {}
    try {
      data = event?.data ? event.data.json() : {}
    } catch {
      try { data = { body: event?.data ? event.data.text() : '' } } catch { data = {} }
    }
    const title = String(data?.title || 'IEADM-ITAPEVA')
    const body = String(data?.body || '')
    const url = String(data?.url || '/')
    const notificationId = data?.notificationId ? String(data.notificationId) : ''
    const tag = data?.tag ? String(data.tag) : undefined
    const options = {
      body,
      icon: '/tela-inicial.jpg',
      badge: '/tela-inicial.jpg',
      data: { url, notificationId, tag },
      tag
    }
    if (typeof data?.renotify === 'boolean') options.renotify = data.renotify
    if (typeof data?.silent === 'boolean') options.silent = data.silent
    if (typeof data?.requireInteraction === 'boolean') options.requireInteraction = data.requireInteraction
    if (Array.isArray(data?.vibrate)) options.vibrate = data.vibrate
    if (typeof data?.timestamp === 'number') options.timestamp = data.timestamp
    await self.registration.showNotification(title, options)
    if (notificationId) {
      try {
        await fetch('/api/push/track-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notificationId,
            tag: tag || '',
            eventType: 'shown'
          })
        })
      } catch {}
    }
  }
  event.waitUntil(show())
})

self.addEventListener('notificationclick', (event) => {
  const open = async () => {
    try { event.notification.close() } catch {}
    const url = String(event?.notification?.data?.url || '/')
    const notificationId = String(event?.notification?.data?.notificationId || '')
    const tag = String(event?.notification?.data?.tag || '')
    if (notificationId) {
      try {
        await fetch('/api/push/track-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notificationId,
            tag,
            eventType: 'clicked'
          })
        })
      } catch {}
    }
    const list = await clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const c of list) {
      try {
        if ('focus' in c) {
          await c.focus()
          if ('navigate' in c) await c.navigate(url)
          return
        }
      } catch {}
    }
    try { await clients.openWindow(url) } catch {}
  }
  event.waitUntil(open())
})

self.addEventListener('notificationclose', (event) => {
  const track = async () => {
    const notificationId = String(event?.notification?.data?.notificationId || '')
    const tag = String(event?.notification?.data?.tag || '')
    if (!notificationId) return
    try {
      await fetch('/api/push/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId,
          tag,
          eventType: 'dismissed'
        })
      })
    } catch {}
  }
  event.waitUntil(track())
})
