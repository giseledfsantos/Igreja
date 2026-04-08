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
    const tag = data?.tag ? String(data.tag) : undefined
    const options = {
      body,
      icon: '/tela-inicial.jpg',
      badge: '/tela-inicial.jpg',
      data: { url },
      tag
    }
    await self.registration.showNotification(title, options)
  }
  event.waitUntil(show())
})

self.addEventListener('notificationclick', (event) => {
  const open = async () => {
    try { event.notification.close() } catch {}
    const url = String(event?.notification?.data?.url || '/')
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
