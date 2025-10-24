// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);

                // Verificar por atualizações automaticamente
                checkForUpdates();

                // Configurar push notifications
                setupPushNotifications(registration);

            })
            .catch(function(error) {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

// Analytics (Google Analytics Simulado)
function trackEvent(category, action, label) {
    console.log('Analytics:', { category, action, label });
    // Aqui você integraria com Google Analytics ou Plausible
}

// Credenciais de login
const validUsers = {
    'Bruno': 'Bruno1220',
    'Evellyn': 'Evellyn1220',
    'Marcus': 'Marcus1220'
};

// Sistema de Tema (com verificação de segurança)
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    const themeIcon = themeToggle.querySelector('span:first-child');
    const themeText = themeToggle.querySelector('span:last-child');

    // Carregar tema salvo
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);

    // Alternar tema
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeButton(newTheme);
        trackEvent('UI', 'Theme Toggle', newTheme);
    });

    function updateThemeButton(theme) {
        if (theme === 'dark') {
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Modo Claro';
        } else {
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Modo Escuro';
        }
    }
}

// Sistema de Busca (com verificação de segurança)
const searchInput = document.getElementById('searchInput');
const cards = document.querySelectorAll('.card');

if (searchInput && cards.length > 0) {
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();

        cards.forEach(card => {
            const searchData = card.getAttribute('data-search').toLowerCase();
            if (searchData.includes(searchTerm) || searchTerm === '') {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });

        if (searchTerm) {
            trackEvent('Search', 'Perform Search', searchTerm);
        }
    });
}

// Sistema de Push Notifications
function setupPushNotifications(registration) {
    // Solicitar permissão de notificação
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            requestNotificationPermission();
        } else if (Notification.permission === 'granted') {
            console.log('Push Notifications: Permissão já concedida');
            scheduleNotificationCheck();
            // Inscrever-se para push notifications
            subscribeToPushNotifications(registration);
        }
    }
}

// Solicitar permissão de notificação
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(function(permission) {
            console.log('Push Notifications: Permissão', permission);
            if (permission === 'granted') {
                trackEvent('Notifications', 'Permission Granted', 'Push');
                scheduleNotificationCheck();

                // Ativar inscrição após conceder permissão
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(registration => {
                        subscribeToPushNotifications(registration).then(() => {
                            showToast('✅ Inscrição para notificações concluída!', 'success');
                            checkNotificationStatus();
                        });
                    });
                }
                showToast('🔔 Notificações ativadas! Você será avisado sobre atualizações.', 'success');
            } else {
                trackEvent('Notifications', 'Permission Denied', 'Push');
                showToast('❌ Notificações bloqueadas. Você não receberá avisos de atualização.', 'warning');
            }
        });
    }
}

// Função para solicitar permissão manualmente (redefinida para o modal)
function requestNotificationPermissionManual() {
    if ('Notification' in window) {
        Notification.requestPermission().then(function(permission) {
            console.log('Permissão manual:', permission);
            checkNotificationStatus();

            if (permission === 'granted') {
                showToast('🔔 Permissão concedida! Ativando notificações...', 'success');
                trackEvent('Notifications', 'Manual Permission Granted', 'Push');

                // Ativar inscrição após conceder permissão
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(registration => {
                        subscribeToPushNotifications(registration).then(() => {
                            showToast('✅ Inscrição para notificações concluída!', 'success');
                            checkNotificationStatus();
                        });
                    });
                }
            } else {
                showToast('❌ Permissão negada. Você não receberá notificações.', 'warning');
                trackEvent('Notifications', 'Manual Permission Denied', 'Push');
            }
        });
    }
}

// Agendar verificação de notificações
function scheduleNotificationCheck() {
    // Verificar por atualizações a cada 30 minutos
    setInterval(() => {
        checkForUpdates();
    }, 30 * 60 * 1000);

    // Primeira verificação em 1 minuto
    setTimeout(() => {
        checkForUpdates();
    }, 60 * 1000);
}

// Verificar por atualizações
function checkForUpdates() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'CHECK_UPDATES',
            timestamp: new Date().toISOString()
        });
    }
}

// Enviar notificação push de teste
function sendTestNotification() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.ready.then(function(registration) {
            return registration.showNotification('🧪 BE MAKE - Teste de Notificação', {
                body: 'Notificações push funcionando perfeitamente!',
                icon: '/icons/icon-192x192.svg',
                badge: '/icons/icon-72x72.svg',
                tag: 'test-notification',
                requireInteraction: false,
                data: {
                    url: '/',
                    timestamp: new Date().toISOString()
                }
            });
        }).then(() => {
            showToast('📱 Notificação de teste enviada!', 'success');
            trackEvent('Notifications', 'Test Sent', 'Push');
        }).catch(error => {
            console.log('Erro ao enviar notificação:', error);
            showToast('❌ Erro ao enviar notificação de teste.', 'error');
        });
    }
}

// Simular nova atualização (para testes)
function simulateUpdate() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SIMULATE_UPDATE',
            title: '🔧 BE MAKE - Sistema Atualizado!',
            body: 'Nova funcionalidade adicionada ao sistema de chamados.',
            timestamp: new Date().toISOString()
        });
        showToast('📡 Simulando atualização...', 'info');
        trackEvent('Notifications', 'Simulate Update', 'Test');
    }
}

function showToast(message, type = 'info') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

function showNoveltiesModal() {
    const noveltiesModal = document.getElementById('novelties-modal');
    if (noveltiesModal) {
        noveltiesModal.style.display = 'flex';
    }
}

// Listener para mensagens do Service Worker
navigator.serviceWorker.addEventListener('message', function(event) {
    console.log('Recebida mensagem do Service Worker:', event.data);

    if (event.data.type === 'SIMULATE_UPDATE') {
        // Mostrar notificação personalizada
        showToast('🔔 ' + event.data.title, 'success');
    }
});

// Solicitar permissão de notificação
if ('Notification' in window) {
    Notification.requestPermission();
}

// Simular nova notificação
setTimeout(() => {
    if (notificationBadge) {
        notificationBadge.style.display = 'flex';
        showToast('Nova atualização disponível!', 'success');
    }
}, 3000);

if (notificationsBtn) {
    notificationsBtn.addEventListener('click', () => {
        showNoveltiesModal();
        if (notificationBadge) {
            notificationBadge.style.display = 'none';
        }
        trackEvent('Notifications', 'Open Novelties', 'click');
    });
}

// Gestos Touch para Mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchEndX - touchStartX;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe direito - próximo card
            trackEvent('Gesture', 'Swipe', 'right');
        } else {
            // Swipe esquerdo - card anterior
            trackEvent('Gesture', 'Swipe', 'left');
        }
    }
}

// Track inicial
trackEvent('Page', 'Load', 'Home');

// Elementos dos modais principais
const modalLivro = document.getElementById('modal-livro');
const modalVale = document.getElementById('modal-vale');
const modalCompras = document.getElementById('modal-compras');
const modalConferencia = document.getElementById('modal-conferencia');
const modalNotificacoes = document.getElementById('modal-notificacoes');
const noveltiesModal = document.getElementById('novelties-modal');
const closeBtns = document.querySelectorAll('.close-btn');
const loadingSpinner = document.getElementById('loadingSpinner');

// Botões que abrem os modais principais (com verificação de segurança)
const comoUsarLivro = document.getElementById('como-usar-livro');
const comoUsarVale = document.getElementById('como-usar-vale');
const comoUsarCompras = document.getElementById('como-usar-compras');
const comoUsarConferencia = document.getElementById('como-usar-conferencia');
const visualizarChamados = document.getElementById('visualizar-chamados');

if (comoUsarLivro) {
    comoUsarLivro.addEventListener('click', () => {
        if (modalLivro) {
            modalLivro.style.display = 'flex';
            trackEvent('Modal', 'Open', 'Livro Caixa Help');
        }
    });
}

if (comoUsarVale) {
    comoUsarVale.addEventListener('click', () => {
        if (modalVale) {
            modalVale.style.display = 'flex';
            trackEvent('Modal', 'Open', 'Vale Help');
        }
    });
}

if (comoUsarCompras) {
    comoUsarCompras.addEventListener('click', () => {
        if (modalCompras) {
            modalCompras.style.display = 'flex';
            trackEvent('Modal', 'Open', 'Compras Help');
        }
    });
}

if (comoUsarConferencia) {
    comoUsarConferencia.addEventListener('click', () => {
        if (modalConferencia) {
            modalConferencia.style.display = 'flex';
            trackEvent('Modal', 'Open', 'Conferencia Help');
        }
    });
}

if (visualizarChamados) {
    visualizarChamados.addEventListener('click', () => {
        // Abrir visualizador de chamados local
        window.open('VizuChamado.html', '_blank');
        trackEvent('Navigation', 'View Calls', 'Local Maintenance');
    });
}

// Fechar modais principais (com verificação de segurança)
if (closeBtns.length > 0) {
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (modalLivro) modalLivro.style.display = 'none';
            if (modalVale) modalVale.style.display = 'none';
            if (modalCompras) modalCompras.style.display = 'none';
            if (modalConferencia) modalConferencia.style.display = 'none';
            if (modalNotificacoes) modalNotificacoes.style.display = 'none';
        });
    });
}

// Fechar modal ao clicar fora (com verificação de segurança)
window.addEventListener('click', (e) => {
    if (modalLivro && e.target === modalLivro) {
        modalLivro.style.display = 'none';
    }
    if (modalVale && e.target === modalVale) {
        modalVale.style.display = 'none';
    }
    if (modalCompras && e.target === modalCompras) {
        modalCompras.style.display = 'none';
    }
    if (modalConferencia && e.target === modalConferencia) {
        modalConferencia.style.display = 'none';
    }
    if (modalNotificacoes && e.target === modalNotificacoes) {
        modalNotificacoes.style.display = 'none';
    }
    if (noveltiesModal && e.target === noveltiesModal) {
        noveltiesModal.style.display = 'none';
    }
});

// Sistema Administrativo (com verificação de segurança)
const adminBtn = document.getElementById('adminBtn');
const adminLoginModal = document.getElementById('adminLoginModal');
const adminPanel = document.getElementById('adminPanel');
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const logoutBtn = document.getElementById('logoutBtn');
const closeAdminModal = document.getElementById('closeAdminModal');

// Modal de confirmação
const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');

// Abrir modal de login (com verificação de segurança)
if (adminBtn && adminLoginModal) {
    adminBtn.addEventListener('click', () => {
        adminLoginModal.style.display = 'flex';
        trackEvent('Admin', 'Open Login', 'click');
    });
}

// Fechar modal de login com X (com verificação de segurança)
if (closeAdminModal && adminLoginModal && errorMessage && loginForm) {
    closeAdminModal.addEventListener('click', () => {
        adminLoginModal.style.display = 'none';
        errorMessage.style.display = 'none';
        loginForm.reset();
    });
}

// Fechar modal de login ao clicar fora (com verificação de segurança)
if (adminLoginModal) {
    adminLoginModal.addEventListener('click', (e) => {
        if (e.target === adminLoginModal) {
            adminLoginModal.style.display = 'none';
            if (errorMessage) errorMessage.style.display = 'none';
            if (loginForm) loginForm.reset();
        }
    });
}

// Processar login (com verificação de segurança)
if (loginForm && adminLoginModal && adminPanel && errorMessage) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const login = document.getElementById('login').value;
        const senha = document.getElementById('senha').value;

        if (validUsers[login] && validUsers[login] === senha) {
            // Login bem-sucedido
            adminLoginModal.style.display = 'none';
            if (adminPanel) adminPanel.style.display = 'block';
            errorMessage.style.display = 'none';
            loginForm.reset();
            trackEvent('Admin', 'Login Success', login);
            showToast(`Bem-vindo, ${login}!`, 'success');
        } else {
            // Login falhou
            errorMessage.style.display = 'block';
            trackEvent('Admin', 'Login Failed', login);
        }
    });
}

// Logout (com verificação de segurança)
if (logoutBtn && adminPanel && loginForm) {
    logoutBtn.addEventListener('click', () => {
        if (adminPanel) adminPanel.style.display = 'none';
        if (loginForm) loginForm.reset();
        trackEvent('Admin', 'Logout', 'click');
        showToast('Logout realizado com sucesso!', 'info');
    });
}

// Sistema de confirmação para links que precisam (com verificação de segurança)
function showConfirmation(message, url) {
    if (!confirmModal || !confirmMessage || !confirmYes || !confirmNo || !loadingSpinner) return;

    confirmMessage.textContent = `Certeza que deseja abrir "${message}"?`;

    confirmYes.onclick = function() {
        loadingSpinner.style.display = 'block';
        setTimeout(() => {
            window.open(url, '_blank');
            loadingSpinner.style.display = 'none';
            trackEvent('Navigation', 'Open External', message);
        }, 500);
        confirmModal.style.display = 'none';
    };

    confirmNo.onclick = function() {
        confirmModal.style.display = 'none';
    };

    confirmModal.style.display = 'flex';
}

// Fechar modal de confirmação ao clicar fora (com verificação de segurança)
if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            confirmModal.style.display = 'none';
        }
    });
}

// Botões do painel administrativo - COM CONFIRMAÇÃO (com verificação de segurança)
const adminLivroCaixa = document.getElementById('adminLivroCaixa');
const adminVale = document.getElementById('adminVale');
const adminCompras = document.getElementById('adminCompras');
const adminManutencao = document.getElementById('adminManutencao');
const adminNotificacoes = document.getElementById('adminNotificacoes');

if (adminLivroCaixa && confirmModal && confirmMessage && confirmYes && confirmNo && loadingSpinner) {
    adminLivroCaixa.addEventListener('click', () => {
        showConfirmation('Livro Caixa - Planilha', 'https://docs.google.com/spreadsheets/d/1SWrEtYMN89mGwywxD00ztzW1vKZD5ndAyqYiu0X4WU4/edit?gid=0#gid=0');
    });
}

if (adminVale && confirmModal && confirmMessage && confirmYes && confirmNo && loadingSpinner) {
    adminVale.addEventListener('click', () => {
        showConfirmation('Vale - Planilha', 'https://docs.google.com/spreadsheets/d/1EeEeIKydYmXqhJfPgeNGdbAWU6bysnxrWK8tXmUlRXM/edit?gid=0#gid=0');
    });
}

if (adminCompras && confirmModal && confirmMessage && confirmYes && confirmNo && loadingSpinner) {
    adminCompras.addEventListener('click', () => {
        showConfirmation('Compras - Planilha', 'https://docs.google.com/spreadsheets/d/1HYiBtyLn-Gb-w2Ur5aWRL5RrCAA-fC01MZ7pcDcH-EI/edit?usp=sharing');
    });
}

if (adminManutencao && confirmModal && confirmMessage && confirmYes && confirmNo && loadingSpinner) {
    adminManutencao.addEventListener('click', () => {
        showToast('Sistema de Manutenção totalmente funcional!', 'success');
        trackEvent('Admin', 'Maintenance System', 'Ativo');
    });
}

if (adminNotificacoes) {
    adminNotificacoes.addEventListener('click', () => {
        const modalNotificacoes = document.getElementById('modal-notificacoes');
        if (modalNotificacoes) {
            modalNotificacoes.style.display = 'flex';
            checkNotificationStatus();
            trackEvent('Admin', 'Open Notifications', 'Panel');
        }
    });
}

// Track clicks nos links principais (com verificação de segurança)
const livroCaixaLink = document.getElementById('livro-caixa-link');
const valeLink = document.getElementById('vale-link');
const comprasLink = document.getElementById('compras-link');
const conferenciaCaixaLink = document.getElementById('conferencia-caixa-link');

if (livroCaixaLink) {
    livroCaixaLink.addEventListener('click', () => {
        trackEvent('Navigation', 'Open App', 'Livro Caixa');
    });
}

if (valeLink) {
    valeLink.addEventListener('click', () => {
        trackEvent('Navigation', 'Open App', 'Vale');
    });
}

if (comprasLink) {
    comprasLink.addEventListener('click', () => {
        trackEvent('Navigation', 'Open App', 'Compras');
    });
}

if (conferenciaCaixaLink) {
    conferenciaCaixaLink.addEventListener('click', () => {
        trackEvent('Navigation', 'Open App', 'Conferencia de Caixa');
    });
}

// Track click no link do chamado de manutenção
const chamadoManutencaoLink = document.getElementById('chamado-manutencao-link');
if (chamadoManutencaoLink) {
    chamadoManutencaoLink.addEventListener('click', () => {
        trackEvent('Navigation', 'Open App', 'Chamado Manutencao');
    });
}

// Fechar com tecla ESC (com verificação de segurança)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (modalLivro) modalLivro.style.display = 'none';
        if (modalVale) modalVale.style.display = 'none';
        if (modalCompras) modalCompras.style.display = 'none';
        if (modalConferencia) modalConferencia.style.display = 'none';
        if (modalNotificacoes) modalNotificacoes.style.display = 'none';
        if (noveltiesModal) noveltiesModal.style.display = 'none';
        if (adminLoginModal) adminLoginModal.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'none';
        if (confirmModal) confirmModal.style.display = 'none';
        if (errorMessage) errorMessage.style.display = 'none';
    }
});

// Atalhos de teclado (com verificação de segurança)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey) {
        switch(e.key) {
            case '1':
                e.preventDefault();
                if (livroCaixaLink) livroCaixaLink.click();
                break;
            case '2':
                e.preventDefault();
                if (valeLink) valeLink.click();
                break;
            case '3':
                e.preventDefault();
                if (comprasLink) comprasLink.click();
                break;
            case '4':
                e.preventDefault();
                if (visualizarChamados) visualizarChamados.click();
                break;
            case 'a':
                e.preventDefault();
                if (adminBtn) adminBtn.click();
                break;
        }
    }
});

// Efeito de digitação no título (com verificação de segurança)
const title = document.querySelector('h1');
if (title) {
    const originalText = title.textContent;
    title.textContent = '';
    let i = 0;

    function typeWriter() {
        if (i < originalText.length) {
            title.textContent += originalText.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        }
    }

    // Iniciar efeito de digitação após carregamento
    window.addEventListener('load', () => {
        setTimeout(typeWriter, 500);

        // Mostrar mensagem de boas-vindas
        setTimeout(() => {
            showToast('Bem-vindo ao BE MAKE Links! 🚀', 'success');
        }, 1000);
    });
}

// Função para verificar status das notificações
function checkNotificationStatus() {
    const permissionStatus = document.getElementById('permissionStatus');
    const serviceWorkerStatus = document.getElementById('serviceWorkerStatus');
    const subscriptionStatus = document.getElementById('subscriptionStatus');

    if (permissionStatus && serviceWorkerStatus && subscriptionStatus) {
        // Verificar permissão
        if ('Notification' in window) {
            switch(Notification.permission) {
                case 'granted':
                    permissionStatus.innerHTML = '✅ <strong>Permissão concedida:</strong> Notificações ativas';
                    permissionStatus.style.color = '#28a745';
                    break;
                case 'denied':
                    permissionStatus.innerHTML = '❌ <strong>Permissão negada:</strong> Notificações bloqueadas';
                    permissionStatus.style.color = '#dc3545';
                    break;
                case 'default':
                    permissionStatus.innerHTML = '⏳ <strong>Permissão pendente:</strong> Solicitar permissão';
                    permissionStatus.style.color = '#ffc107';
                    break;
            }
        } else {
            permissionStatus.innerHTML = '❌ <strong>Não suportado:</strong> Navegador não suporta notificações';
            permissionStatus.style.color = '#dc3545';
        }

        // Verificar service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(registration => {
                if (registration) {
                    serviceWorkerStatus.innerHTML = '✅ <strong>Service Worker ativo:</strong> Funcionando em background';
                    serviceWorkerStatus.style.color = '#28a745';
                } else {
                    serviceWorkerStatus.innerHTML = '❌ <strong>Service Worker inativo:</strong> Não registrado';
                    serviceWorkerStatus.style.color = '#dc3545';
                }
            });
        } else {
            serviceWorkerStatus.innerHTML = '❌ <strong>Não suportado:</strong> Navegador não suporta service workers';
            serviceWorkerStatus.style.color = '#dc3545';
        }

        // Verificar push subscription
        if ('PushManager' in window) {
            navigator.serviceWorker.ready.then(registration => {
                return registration.pushManager.getSubscription();
            }).then(subscription => {
                if (subscription) {
                    subscriptionStatus.innerHTML = '✅ <strong>Inscrito:</strong> Receberá notificações push';
                    subscriptionStatus.style.color = '#28a745';
                } else {
                    subscriptionStatus.innerHTML = '❌ <strong>Não inscrito:</strong> Não receberá push notifications';
                    subscriptionStatus.style.color = '#dc3545';
                }
            });
        } else {
            subscriptionStatus.innerHTML = '❌ <strong>Não suportado:</strong> Navegador não suporta push';
            subscriptionStatus.style.color = '#dc3545';
        }
    }
}

// Inscrever-se para push notifications
function subscribeToPushNotifications(registration) {
    return registration.pushManager.getSubscription()
        .then(function(existingSubscription) {
            if (existingSubscription) {
                console.log('Push Notifications: Já inscrito', existingSubscription);
                return existingSubscription;
            }

            // VAPID key pública (você precisa gerar uma real para produção)
            const vapidKey = 'BKxQzJ8QX3wQ1v1Y7Z3x8Q2Y7Z3x8Q2Y7Z3x8Q2Y7Z3x8Q2Y7Z3x8Q2Y7Z3x8Q2Y7Z3x8Q2Y'; // Exemplo

            return registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            });
        })
        .then(function(subscription) {
            console.log('Push Notifications: Inscrição bem-sucedida', subscription);
            trackEvent('Notifications', 'Subscription Success', 'Push');

            // Enviar subscription para o servidor (opcional)
            return sendSubscriptionToServer(subscription);
        })
        .catch(function(error) {
            console.log('Push Notifications: Falha na inscrição', error);
            trackEvent('Notifications', 'Subscription Failed', error.message);
        });
}

// Converter VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Cancelar inscrição de notificações push
function unsubscribeFromNotifications() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
            return registration.pushManager.getSubscription();
        }).then(subscription => {
            if (subscription) {
                return subscription.unsubscribe().then(() => {
                    console.log('Push Notifications: Inscrição cancelada');
                    showToast('🚫 Inscrição para notificações cancelada!', 'warning');
                    trackEvent('Notifications', 'Unsubscribed', 'Push');
                    checkNotificationStatus();
                });
            } else {
                showToast('ℹ️ Você não estava inscrito para notificações.', 'info');
            }
        }).catch(error => {
            console.log('Erro ao cancelar inscrição:', error);
            showToast('❌ Erro ao cancelar inscrição.', 'error');
        });
    } else {
        showToast('❌ Push notifications não suportadas neste navegador.', 'error');
    }
}
