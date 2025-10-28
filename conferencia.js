// Configuração inicial
document.addEventListener('DOMContentLoaded', function() {
    // Definir data atual
    const now = new Date();
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('pt-BR', options);
    
    // Inicializar métodos de pagamento
    initializePaymentMethods();
    
    // Inicializar vendedoras
    initializeSellers();
    
    // Configurar eventos
    setupEventListeners();
    
    // Calcular ticket médio automático
    setupTicketCalculation();
    
    // Configurar modais
    setupModals();
    
    // Carregar dados salvos
    loadSavedData();
    
    // Configurar auto-save
    setupAutoSave();
});

// Métodos de pagamento
let paymentMethods = [
    { name: 'Dinheiro', checked: false, value: 0, status: '' },
    { name: 'Cartão de Crédito', checked: false, value: 0, status: '' },
    { name: 'Cartão de Débito', checked: false, value: 0, status: '' },
    { name: 'PIX', checked: false, value: 0, status: '' },
    { name: 'Link de Pagamento', checked: false, value: 0, status: '' }
];

// Lista de vendedoras
let sellers = [];

// Variáveis para controle dos modais
let currentPaymentIndex = null;
let currentStatus = '';
let sellerToRemove = null;

// Inicializar métodos de pagamento
function initializePaymentMethods() {
    const container = document.getElementById('payment-methods');
    container.innerHTML = '';
    
    paymentMethods.forEach((method, index) => {
        const methodElement = document.createElement('div');
        methodElement.className = 'payment-method';
        methodElement.setAttribute('data-index', index);
        methodElement.innerHTML = `
            <div class="payment-name">${method.name}</div>
            <div class="payment-buttons">
                <button class="btn btn-check" data-index="${index}">
                    <i class="fas fa-check"></i> Verificado
                </button>
                <button class="btn btn-x" data-index="${index}">
                    <i class="fas fa-times"></i> Problema
                </button>
            </div>
            <div class="status-message" id="status-${index}"></div>
        `;
        container.appendChild(methodElement);
    });
}

// Inicializar vendedoras
function initializeSellers() {
    updateSellersList();
}

// Configurar eventos
function setupEventListeners() {
    // Eventos para métodos de pagamento
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-check')) {
            const button = e.target.closest('.btn-check');
            const index = button.getAttribute('data-index');
            setPaymentMethodChecked(index, true);
        }
        
        if (e.target.closest('.btn-x')) {
            const button = e.target.closest('.btn-x');
            const index = button.getAttribute('data-index');
            setPaymentMethodChecked(index, false);
        }
    });
    
    // Abrir modal de adicionar vendedora
    document.getElementById('open-seller-modal').addEventListener('click', function() {
        document.getElementById('seller-modal').classList.add('active');
        document.getElementById('seller-name').focus();
    });
    
    // Fechar modal de adicionar vendedora
    document.getElementById('cancel-seller').addEventListener('click', function() {
        document.getElementById('seller-modal').classList.remove('active');
    });
    
    // Adicionar vendedora
    document.getElementById('add-seller').addEventListener('click', function() {
        addSeller();
        // Fechar o modal após adicionar
        document.getElementById('seller-modal').classList.remove('active');
    });
    
    // Fechar modal ao clicar fora
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    // Evento para enviar para WhatsApp
    const sendWhatsAppBtn = document.getElementById('send-whatsapp');
    if (sendWhatsAppBtn) {
        sendWhatsAppBtn.addEventListener('click', sendToWhatsApp);
    }
}

// Configurar cálculo automático do ticket médio
function setupTicketCalculation() {
    const valueInput = document.getElementById('seller-value');
    const clientsInput = document.getElementById('seller-clients');
    const ticketInput = document.getElementById('seller-ticket');
    
    function calculateTicket() {
        const value = parseFloat(valueInput.value) || 0;
        const clients = parseInt(clientsInput.value) || 0;
        
        if (clients > 0) {
            const ticket = value / clients;
            ticketInput.value = ticket.toFixed(2);
        } else {
            ticketInput.value = '';
        }
    }
    
    valueInput.addEventListener('input', calculateTicket);
    clientsInput.addEventListener('input', calculateTicket);
}

// Configurar modais
function setupModals() {
    // Modal de valor
    document.getElementById('cancel-value').addEventListener('click', function() {
        document.getElementById('value-modal').classList.remove('active');
    });
    
    document.getElementById('confirm-value').addEventListener('click', function() {
        const valueInput = document.getElementById('modal-value');
        const value = parseFloat(valueInput.value) || 0;
        
        // Se o valor for inválido (menor que zero), mostrar erro
        if (value < 0) {
            showToast('Por favor, informe um valor válido (maior ou igual a zero).', 'error');
            return;
        }
        
        const method = paymentMethods[currentPaymentIndex];
        method.value = value;
        method.status = 'batendo';
        method.checked = true;
        
        const statusElement = document.getElementById(`status-${currentPaymentIndex}`);
        const formattedValue = value.toFixed(2);
        statusElement.textContent = `Batendo - R$ ${formattedValue}`;
        statusElement.className = 'status-message status-batendo';
        
        // Atualizar botão ativo
        document.querySelector(`.btn-check[data-index="${currentPaymentIndex}"]`).classList.add('active');
        document.querySelector(`.btn-x[data-index="${currentPaymentIndex}"]`).classList.remove('active');
        
        // Fechar modal e limpar
        document.getElementById('value-modal').classList.remove('active');
        valueInput.value = '';
        
        // Atualizar interface
        updateSummary();
        saveData();
        
        // Mostrar confirmação
        if (value === 0) {
            showToast(`${method.name} marcado como verificado com valor zerado.`, 'success');
        }
    });
    
    // Modal de status
    document.querySelectorAll('.option-btn').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.option-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            this.classList.add('selected');
            currentStatus = this.getAttribute('data-status');
        });
    });
    
    document.getElementById('cancel-status').addEventListener('click', function() {
        document.getElementById('status-modal').classList.remove('active');
        resetStatusModal();
    });
    
    document.getElementById('confirm-status').addEventListener('click', function() {
        const value = parseFloat(document.getElementById('status-value').value) || 0;
        if (currentStatus && value > 0) {
            const method = paymentMethods[currentPaymentIndex];
            method.value = value;
            method.status = currentStatus;
            method.checked = false;
            
            const statusElement = document.getElementById(`status-${currentPaymentIndex}`);
            const statusText = currentStatus === 'faltando' ? 'Faltando' : 'Sobrando';
            statusElement.textContent = `${statusText} R$ ${method.value.toFixed(2)}`;
            statusElement.className = `status-message status-${currentStatus}`;
            
            // Atualizar botão ativo
            document.querySelector(`.btn-x[data-index="${currentPaymentIndex}"]`).classList.add('active');
            document.querySelector(`.btn-check[data-index="${currentPaymentIndex}"]`).classList.remove('active');
            
            document.getElementById('status-modal').classList.remove('active');
            resetStatusModal();
            
            updateSummary();
            saveData();
        } else {
            alert('Por favor, selecione um status e informe um valor válido.');
        }
    });
    
    // Modal de remoção
    document.getElementById('cancel-remove').addEventListener('click', function() {
        document.getElementById('remove-modal').classList.remove('active');
        sellerToRemove = null;
    });
    
    document.getElementById('confirm-remove').addEventListener('click', function() {
        if (sellerToRemove !== null) {
            sellers.splice(sellerToRemove, 1);
            updateSellersList();
            updateSummary();
            saveData();
            document.getElementById('remove-modal').classList.remove('active');
            sellerToRemove = null;
            showToast('Vendedora removida com sucesso!', 'success');
        }
    });
}

// Resetar modal de status
function resetStatusModal() {
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.getElementById('status-value').value = '';
    currentStatus = '';
}

// Definir método de pagamento como verificado
function setPaymentMethodChecked(index, isChecked) {
    currentPaymentIndex = parseInt(index);
    const method = paymentMethods[currentPaymentIndex];
    
    if (isChecked) {
        // Se está verificado, abrir modal para valor
        document.getElementById('value-modal-header').textContent = `Valor para ${method.name}`;
        document.getElementById('value-modal').classList.add('active');
        document.getElementById('modal-value').focus();
    } else {
        // Se não está verificado, abrir modal para status
        document.getElementById('status-modal-header').textContent = `Status para ${method.name}`;
        document.getElementById('status-modal-text').textContent = `Qual o status para ${method.name}?`;
        document.getElementById('status-modal').classList.add('active');
        document.getElementById('status-value').focus();
    }
}

// Adicionar vendedora
function addSeller() {
    const name = document.getElementById('seller-name').value.trim();
    const value = parseFloat(document.getElementById('seller-value').value) || 0;
    const clients = parseInt(document.getElementById('seller-clients').value) || 0;
    const ticket = parseFloat(document.getElementById('seller-ticket').value) || 0;

    if (!name) {
        showToast('Por favor, informe o nome da vendedora', 'error');
        document.getElementById('seller-name').focus();
        return;
    }

    if (value <= 0) {
        showToast('O valor deve ser maior que zero', 'error');
        document.getElementById('seller-value').focus();
        return;
    }

    sellers.push({
        name: name,
        value: value,
        clients: clients,
        ticket: ticket
    });

    // Limpar campos
    document.getElementById('seller-name').value = '';
    document.getElementById('seller-value').value = '';
    document.getElementById('seller-clients').value = '';
    document.getElementById('seller-ticket').value = '';

    // Voltar o foco para o primeiro campo
    document.getElementById('seller-name').focus();

    updateSellersList();
    updateSummary();
    saveData();
    showToast('Vendedora adicionada com sucesso!', 'success');
}

// Remover vendedora
function removeSeller(index) {
    sellerToRemove = index;
    document.getElementById('remove-modal-text').textContent = `Tem certeza que deseja remover a vendedora "${sellers[index].name}"?`;
    document.getElementById('remove-modal').classList.add('active');
}

// Atualizar lista de vendedoras
function updateSellersList() {
    const container = document.getElementById('sellers-list');
    container.innerHTML = '';

    // Atualizar contador
    const sellerCount = document.querySelector('.seller-count');
    sellerCount.textContent = `${sellers.length} ${sellers.length === 1 ? 'vendedora' : 'vendedoras'}`;

    if (sellers.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <i class="fas fa-user-plus"></i>
            <p>Nenhuma vendedora cadastrada</p>
            <small>Clique no botão acima para adicionar uma vendedora</small>
        `;
        container.appendChild(emptyState);
        return;
    }

    sellers.forEach((seller, index) => {
        const sellerElement = document.createElement('div');
        sellerElement.className = 'seller-item';
        sellerElement.setAttribute('tabindex', '0');
        sellerElement.innerHTML = `
            <div class="seller-name">${seller.name}</div>
            <div class="seller-value">${seller.value.toFixed(2)}</div>
            <div class="seller-clients">${seller.clients}</div>
            <div class="seller-ticket">${seller.ticket.toFixed(2)}</div>
            <div class="seller-actions">
                <button class="btn-remove" data-index="${index}" title="Remover vendedora">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Navegação com teclado
        sellerElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                sellerElement.click();
            }
        });

        sellerElement.querySelector('.btn-remove').addEventListener('click', (e) => {
            e.stopPropagation();
            removeSeller(index);
        });

        container.appendChild(sellerElement);
    });
}

// Atualizar resumo
function updateSummary() {
    // Calcular totais
    let totalSales = 0;
    let totalClients = 0;
    
    sellers.forEach(seller => {
        totalSales += seller.value;
        totalClients += seller.clients;
    });
    
    const averageTicket = totalClients > 0 ? totalSales / totalClients : 0;
    
    // Atualizar elementos
    document.getElementById('total-sales').textContent = `R$ ${totalSales.toFixed(2)}`;
    document.getElementById('total-clients').textContent = totalClients;
    document.getElementById('average-ticket').textContent = `R$ ${averageTicket.toFixed(2)}`;
}

// Mostrar toast de notificação
function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast';
    
    if (type) {
        toast.classList.add(type);
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Carregar dados salvos
function loadSavedData() {
    const savedData = localStorage.getItem('conferenciaCaixa');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            
            // Carregar métodos de pagamento
            if (data.paymentMethods) {
                data.paymentMethods.forEach((method, index) => {
                    const methodElement = document.querySelectorAll('.payment-method')[index];
                    if (methodElement) {
                        const input = methodElement.querySelector('input[type="number"]');
                        const checkbox = methodElement.querySelector('input[type="checkbox"]');
                        
                        if (input) input.value = method.value;
                        if (checkbox) checkbox.checked = method.checked;
                        
                        // Atualizar visual se verificado
                        if (method.checked) {
                            methodElement.classList.add('verified');
                            methodElement.querySelector('span').classList.add('verified');
                        }
                    }
                });
            }
            
            // Carregar vendedores
            if (data.sellers && data.sellers.length > 0) {
                sellers = data.sellers;
                updateSellersList();
            }
            
            // Atualizar resumo
            updateSummary();
            
        } catch (error) {
            console.error('Erro ao carregar dados salvos:', error);
        }
    }
}

// Salvar dados no localStorage
function saveData() {
    const data = {
        paymentMethods: paymentMethods,
        sellers: sellers,
        timestamp: new Date().getTime()
    };
    
    localStorage.setItem('conferenciaCaixa', JSON.stringify(data));
}

// Configurar auto-save
function setupAutoSave() {
    // Salvar a cada 30 segundos
    setInterval(saveData, 30000);
    
    // Salvar quando a página for fechada
    window.addEventListener('beforeunload', saveData);
}

// Validar formulário antes de enviar
function validateForm() {
    let isValid = true;
    const missingPayments = [];
    
    // Remover destaque de validação anterior
    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.remove('invalid');
    });
    
    // Verificar se as formas de pagamento não verificadas têm valor preenchido
    paymentMethods.forEach((method, index) => {
        // Se não está verificado E não tem valor
        if (!method.checked && (isNaN(method.value) || method.value <= 0)) {
            isValid = false;
            missingPayments.push(method.name);
            
            // Adicionar classe de erro ao elemento
            const methodElement = document.querySelector(`.payment-method[data-index="${index}"]`);
            if (methodElement) {
                methodElement.classList.add('invalid');
            }
        }
    });
    
    if (!isValid) {
        const message = `As seguintes formas de pagamento precisam ter valor preenchido:\n\n${missingPayments.join('\n')}\n\nMétodos marcados como "Verificado" podem ter valor zerado.`;
        showToast(message, 'error');
        
        // Rolar até o primeiro campo inválido
        const firstInvalid = document.querySelector('.payment-method.invalid');
        if (firstInvalid) {
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        return false;
    }
    
    return true;
}

// Enviar para WhatsApp
function sendToWhatsApp() {
    // Validar formulário antes de continuar
    if (!validateForm()) {
        return; // Não prossegue se a validação falhar
    }
    
    const now = new Date();
    const date = now.toLocaleDateString('pt-BR');
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    let message = `CONFERÊNCIA DE CAIXA - ${date}\n[${time}]\n\n`;
    
    // Formas de pagamento
    message += "Formas de Pagamento:\n";
    message += "__________\n";
    message += "Nota: Métodos marcados como 'Verificado' podem ter valor zerado (R$ 0,00).\n";
    message += "__________\n\n";
    
    paymentMethods.forEach(method => {
        if (method.checked) {
            // Mostrar "Batendo" mesmo se o valor for zero
            message += `[ ✓ ] - ${method.name} - Batendo R$ ${(method.value || 0).toFixed(2)}`;
            if (method.value <= 0) {
                message += " (Valor zerado)";
            }
            message += "\n";
        } else {
            if (method.status === 'faltando') {
                message += `[ ✗ ] - ${method.name} - Faltando R$ ${method.value.toFixed(2)}\n`;
            } else if (method.status === 'sobrando') {
                message += `[ ✗ ] - ${method.name} - Sobrando R$ ${method.value.toFixed(2)}\n`;
            } else {
                message += `[ ✗ ] - ${method.name}\n`;
            }
        }
    });
    
    message += "__________\n\n";
    
    // Vendedoras
    message += "Vendedoras:\n";
    message += "__________\n";
    
    sellers.forEach(seller => {
        message += `${seller.name} | R$ ${seller.value.toFixed(2)} | ${seller.clients} clientes | Ticket: R$ ${seller.ticket.toFixed(2)}\n`;
    });
    
    message += "__________\n\n";
    
    // Resumo
    const totalSales = document.getElementById('total-sales').textContent;
    const averageTicket = document.getElementById('average-ticket').textContent;
    const totalClients = document.getElementById('total-clients').textContent;
    
    message += `Total Vendido: ${totalSales}\n`;
    message += `Total de Clientes: ${totalClients}\n`;
    message += `Ticket Médio da Loja: ${averageTicket}`;
    
    // Codificar mensagem para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Abrir WhatsApp
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    
    // Limpar formulário após envio
    if (confirm('Deseja limpar o formulário após o envio?')) {
        paymentMethods = paymentMethods.map(method => ({
            ...method,
            checked: false,
            value: 0,
            status: ''
        }));
        
        sellers = [];
        
        initializePaymentMethods();
        updateSellersList();
        updateSummary();
        saveData();
        
        showToast('Formulário limpo com sucesso!', 'success');
    }
}