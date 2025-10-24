const CACHE_NAME = 'bemake-links-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/sw.js',
  '/ConfCaixa.html',
  '/VizuChamado.html',
  '/icons/icon-72x72.svg',
  '/icons/icon-96x96.svg',
  '/icons/icon-128x128.svg',
  '/icons/icon-144x144.svg',
  '/icons/icon-152x152.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-384x384.svg',
  '/icons/icon-512x512.svg',
  '/favicon.svg'
];

// Instalação do Service Worker
self.addEventListener('install', function(event) {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Fazendo cache dos arquivos');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('Service Worker: Cache concluído, pulando para activated');
        return self.skipWaiting();
      })
      .catch(function(error) {
        console.log('Service Worker: Falha no cache', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Ativando...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('Service Worker: Ativado com sucesso');
      return self.clients.claim();
    })
  );
});

// Interceptação de requisições (Cache First)
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          console.log('Service Worker: Servindo do cache', event.request.url);
          return response;
        }
        console.log('Service Worker: Buscando da rede', event.request.url);
        return fetch(event.request);
      })
      .catch(function(error) {
        console.log('Service Worker: Falha na busca', error);
        // Para páginas HTML, retornar offline page se necessário
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// NOTIFICAÇÕES PUSH - NOVO!
self.addEventListener('push', function(event) {
  console.log('Service Worker: Recebendo push notification');

  let notificationData = {
    title: '🔔 BE MAKE - Nova Atualização!',
    body: 'Sistema de Chamados de Manutenção atualizado e disponível!',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
    tag: 'bemake-update',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: '🔧 Abrir Chamados',
        icon: '/icons/icon-96x96.svg'
      },
      {
        action: 'dismiss',
        title: '✖️ Dispensar'
      }
    ],
    data: {
      url: '/VizuChamado.html',
      timestamp: new Date().toISOString()
    }
  };

  // Se o evento tem dados customizados, usar
  if (event.data) {
    try {
      const customData = event.data.json();
      notificationData = { ...notificationData, ...customData };
    } catch (e) {
      console.log('Service Worker: Erro ao parsear dados do push', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Clique nas notificações
self.addEventListener('notificationclick', function(event) {
  console.log('Service Worker: Notificação clicada', event.action);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Abrir a aplicação
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(function(clientList) {
        // Se já existe uma janela aberta, focar nela
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
        // Se não, abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url || '/');
        }
      })
    );
  } else if (event.action === 'dismiss') {
    // Apenas fechar a notificação
    console.log('Service Worker: Notificação dispensada');
  }
});

// Mensagem do background sync (para quando voltar online)
self.addEventListener('sync', function(event) {
  console.log('Service Worker: Background sync', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sincronizar dados quando voltar online
      doBackgroundSync()
    );
  }
});

// Função para background sync
function doBackgroundSync() {
  return Promise.resolve()
    .then(() => {
      console.log('Service Worker: Executando background sync');
      // Aqui você pode adicionar lógica para sincronizar dados
      // como verificar por novas atualizações, etc.
    });
}

// Verificar por atualizações periodicamente
self.addEventListener('periodicsync', function(event) {
  if (event.tag === 'update-check') {
    event.waitUntil(
      checkForUpdates()
    );
  }
});

// Função para verificar atualizações
function checkForUpdates() {
  return fetch('/manifest.json')
    .then(response => response.json())
    .then(data => {
      console.log('Service Worker: Verificando atualizações...');
      // Comparar versão atual com a do servidor
      // Se houver atualização, mostrar notificação
      return showUpdateNotification();
    })
    .catch(error => {
      console.log('Service Worker: Erro ao verificar atualizações', error);
    });
}

// Listener para mensagens do main thread
self.addEventListener('message', function(event) {
  console.log('Service Worker: Recebida mensagem do main thread', event.data);

  if (event.data.type === 'CHECK_UPDATES') {
    // Verificar por atualizações
    event.waitUntil(
      checkForUpdates()
    );
  } else if (event.data.type === 'SIMULATE_UPDATE') {
    // Simular uma atualização
    event.waitUntil(
      self.registration.showNotification(event.data.title || '🔧 BE MAKE - Atualização!', {
        body: event.data.body || 'Nova atualização disponível no sistema BE MAKE.',
        icon: '/icons/icon-192x192.svg',
        badge: '/icons/icon-72x72.svg',
        tag: 'simulated-update',
        requireInteraction: true,
        data: {
          url: '/',
          type: 'simulated'
        }
      })
    );
  }
});