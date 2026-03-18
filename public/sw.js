self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json()
      
      const title = data.title || 'Eng-Amh Trainer'
      const options = {
        body: data.body || 'Time to practice!',
        icon: '/icon.png', // Fallback icon (can add real paths later)
        badge: '/badge.png',
        tag: data.tag || 'practice-reminder',
        data: data.url || '/',
        vibrate: [200, 100, 200]
      }

      event.waitUntil(self.registration.showNotification(title, options))
    } catch (err) {
      // Data is not JSON
      event.waitUntil(
        self.registration.showNotification('Eng-Amh Trainer', {
          body: event.data.text()
        })
      )
    }
  }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const urlToOpen = event.notification.data || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
