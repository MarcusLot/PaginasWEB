// ID da sua planilha
const SHEET_ID = '1hjgp6w4TTftO8S7jOBASck169K-4_C87PN4olUv3cEA';

// Variáveis globais
let todosChamados = [];
let chamadosFiltrados = [];
let paginaAtual = 1;
let itensPorPagina = 10;
let modoVisualizacao = 'todos';
let vendedorAtual = '';

// Elementos do DOM
const loadBtn = document.getElementById('loadBtn');
const refreshBtn = document.getElementById('refreshBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const stats = document.getElementById('stats');
const filtros = document.getElementById('filtros');
const chamadosContainer = document.getElementById('chamadosContainer');
const chamadosDiv = document.getElementById('chamados');

// Modo de Visualização
function mudarModoVisualizacao() {
    modoVisualizacao = document.getElementById('modoVisualizacao').value;

    // Não precisa mais resetar o campo de vendedor pois está sempre visível
    // e o filtro funciona independentemente do modo

    filtrarChamados();
}

// Paginação
function mudarItensPorPagina() {
    itensPorPagina = parseInt(document.getElementById('itensPorPagina').value);
    paginaAtual = 1;
    filtrarChamados();
    mostrarToast(`📄 Exibindo ${itensPorPagina} itens por página (${Math.ceil(chamadosFiltrados.length / itensPorPagina)} páginas)`, 'info');
}

function mudarPagina(direcao) {
    const totalPaginas = Math.ceil(chamadosFiltrados.length / itensPorPagina);
    const novaPagina = paginaAtual + direcao;

    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
        paginaAtual = novaPagina;
        exibirChamados();
        atualizarControlesPaginacao();
        mostrarToast(`📄 Página ${paginaAtual} de ${totalPaginas} (${chamadosFiltrados.length} chamados total)`, 'info');
    }
}

function atualizarControlesPaginacao() {
    const totalPaginas = Math.ceil(chamadosFiltrados.length / itensPorPagina);
    const infoPagina = `Página ${paginaAtual} de ${totalPaginas}`;

    document.getElementById('infoPagina').textContent = infoPagina;
    document.getElementById('infoPagina2').textContent = infoPagina;

    // Habilitar/desabilitar botões
    const btnAnterior = document.getElementById('btnAnterior');
    const btnProximo = document.getElementById('btnProximo');
    const btnAnterior2 = document.getElementById('btnAnterior2');
    const btnProximo2 = document.getElementById('btnProximo2');

    btnAnterior.disabled = paginaAtual === 1;
    btnProximo.disabled = paginaAtual === totalPaginas;
    if (btnAnterior2) btnAnterior2.disabled = paginaAtual === 1;
    if (btnProximo2) btnProximo2.disabled = paginaAtual === totalPaginas;
}

// Carregar dados
async function carregarChamados(usarCache = true) {
    mostrarLoading();
    esconderErro();
    esconderStats();
    esconderChamados();
    loadBtn.disabled = true;
    refreshBtn.disabled = true;

    try {
        let dados;

        // Tentar carregar do cache primeiro
        if (usarCache) {
            dados = carregarCache();
            if (dados) {
                processarChamados(dados);
                mostrarToast('📋 Dados carregados do cache local (atualizados recentemente)', 'info');
                return;
            }
        }

        // Se não há cache ou cache expirado, buscar da planilha
        dados = await buscarDadosPlanilha();
        processarChamados(dados);
        salvarCache(dados);
        mostrarToast('🔄 Dados atualizados da planilha Google Sheets', 'success');
    } catch (err) {
        console.error('Erro:', err);
        mostrarErro('Erro ao carregar chamados: ' + err.message);
        mostrarToast('❌ Erro ao carregar dados da planilha', 'error');
    } finally {
        esconderLoading();
        loadBtn.disabled = false;
        refreshBtn.disabled = false;
    }
}

async function buscarDadosPlanilha() {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
    const resposta = await fetch(url);

    if (!resposta.ok) {
        throw new Error(`Erro ${resposta.status}. Verifique se a planilha é pública.`);
    }

    const textoCSV = await resposta.text();

    if (!textoCSV || textoCSV.trim().length === 0) {
        throw new Error('Planilha vazia ou não encontrada');
    }

    return parseCSV(textoCSV);
}

function parseCSV(csvText) {
    const linhas = csvText.split('\n').filter(linha => linha.trim());
    const dados = [];

    linhas.forEach((linha) => {
        const celulas = [];
        let celulaAtual = '';
        let dentroAspas = false;

        for (let i = 0; i < linha.length; i++) {
            const char = linha[i];

            if (char === '"') {
                dentroAspas = !dentroAspas;
            } else if (char === ',' && !dentroAspas) {
                celulas.push(celulaAtual.trim());
                celulaAtual = '';
            } else {
                celulaAtual += char;
            }
        }

        celulas.push(celulaAtual.trim());
        dados.push(celulas);
    });

    return dados;
}

function processarChamados(dados) {
    if (!dados || dados.length < 2) {
        mostrarErro('Nenhum chamado encontrado na planilha');
        return;
    }

    const cabecalhos = dados[0];
    const linhasChamados = dados.slice(1);

    todosChamados = linhasChamados.map((linha, index) => {
        const status = linha[0] || ''; // Coluna Check

        return {
            numero: index + 1,
            status: status,
            timestamp: linha[1] || '',
            sede: linha[2] || '',
            responsavel: linha[3] || '',
            dataProblema: linha[4] || '',
            tipoProblema: linha[5] || '',
            descricao: linha[6] || '',
            urgencia: linha[7] || '',
            localizacao: linha[8] || '',
            resolvido: linha[9] || '',
            prestador: linha[10] || '', // ← COLUNA K (índice 10) - Campo "Prestador" da planilha
            observacoes: linha[11] || '',
            statusFinal: linha[12] || '',
            dataRegistro: linha[13] || '',
            rawData: linha
        };
    });

    // Repopular dropdown de vendedores com novos dados
    preencherFiltros();
    mostrarFiltros();
    filtrarChamados();
}

function preencherFiltros() {
    const filtroLoja = document.getElementById('filtroLoja');
    const filtroVendedor = document.getElementById('buscaVendedor');

    const lojas = [...new Set(todosChamados.map(c => c.sede).filter(Boolean))];
    const vendedores = [...new Set(todosChamados.map(c => c.responsavel).filter(Boolean))];

    // Limpar dropdowns antes de repopular
    filtroLoja.innerHTML = '<option value="">Todas as Lojas</option>';
    filtroVendedor.innerHTML = '<option value="">Todos os Vendedores</option>';

    // Preencher lojas
    lojas.sort().forEach(loja => {
        filtroLoja.innerHTML += `<option value="${loja}">${loja}</option>`;
    });

    // Preencher vendedores (dropdown)
    vendedores.sort().forEach(vendedor => {
        filtroVendedor.innerHTML += `<option value="${vendedor}">${vendedor}</option>`;
    });
}

function filtrarLojasPorVendedor() {
    const filtroVendedor = document.getElementById('buscaVendedor');
    const filtroLoja = document.getElementById('filtroLoja');
    const vendedorSelecionado = filtroVendedor.value;

    if (vendedorSelecionado) {
        // Filtrar apenas as lojas onde o vendedor selecionado tem chamados
        const lojasDoVendedor = [...new Set(todosChamados
            .filter(c => c.responsavel.toLowerCase().includes(vendedorSelecionado.toLowerCase()))
            .map(c => c.sede)
            .filter(Boolean))];

        // Atualizar dropdown de lojas
        filtroLoja.innerHTML = '<option value="">Todas as Lojas</option>';
        lojasDoVendedor.sort().forEach(loja => {
            filtroLoja.innerHTML += `<option value="${loja}">${loja}</option>`;
        });

        // Se havia uma loja selecionada que não está mais disponível, limpar
        if (filtroLoja.value && !lojasDoVendedor.includes(filtroLoja.value)) {
            filtroLoja.value = '';
        }
    } else {
        // Se não há vendedor selecionado, mostrar todas as lojas
        preencherFiltros();
    }
}

function filtrarChamados() {
    const buscaGeral = document.getElementById('buscaGeral').value.toLowerCase();
    const filtroLoja = document.getElementById('filtroLoja').value;
    const filtroStatus = document.getElementById('filtroStatus').value;
    const filtroUrgencia = document.getElementById('filtroUrgencia').value;
    const filtroVendedor = document.getElementById('buscaVendedor').value; // Agora é select, não precisa toLowerCase()

    let resultados = todosChamados;

    // Aplicar modo de visualização
    switch(modoVisualizacao) {
        case 'loja':
            if (filtroLoja) {
                resultados = resultados.filter(c => c.sede === filtroLoja);
            }
            break;
    }

    // Aplicar filtros gerais
    resultados = resultados.filter(chamado => {
        if (buscaGeral) {
            const textoBusca = Object.values(chamado).join(' ').toLowerCase();
            if (!textoBusca.includes(buscaGeral)) return false;
        }

        // Filtro por vendedor (funciona em qualquer modo)
        if (filtroVendedor) {
            vendedorAtual = filtroVendedor;
            if (!chamado.responsavel.toLowerCase().includes(filtroVendedor.toLowerCase())) return false;
        }

        if (filtroUrgencia && !chamado.urgencia.includes(filtroUrgencia)) return false;

        // Filtro de status
        if (filtroStatus) {
            const statusChamado = chamado.status.toLowerCase();
            if (filtroStatus === 'check' && !statusChamado.includes('check')) return false;
            if (filtroStatus === 'andamento' && !statusChamado.includes('andamento')) return false;
            if (filtroStatus === 'ser visto' && !statusChamado.includes('ser visto')) return false;
            if (filtroStatus === 'pendente' && statusChamado !== '') return false;
        }

        return true;
    });

    chamadosFiltrados = resultados;

    // Aplicar ordenação atual
    const campo = document.getElementById('ordenarPor').value || 'numero';
    const direcao = document.getElementById('direcaoOrdenacao').value || 'desc';

    chamadosFiltrados.sort((a, b) => {
        let valorA = a[campo] || '';
        let valorB = b[campo] || '';

        // Tratamento especial para diferentes tipos de dados
        if (campo === 'numero') {
            valorA = parseInt(valorA) || 0;
            valorB = parseInt(valorB) || 0;
        } else if (campo === 'urgencia') {
            const ordemUrgencia = { 'Alta': 3, 'Média': 2, 'Baixa': 1, '': 0 };
            valorA = ordemUrgencia[valorA] || 0;
            valorB = ordemUrgencia[valorB] || 0;
        } else if (campo === 'dataProblema') {
            // Converter data para comparação
            valorA = valorA ? new Date(valorA).getTime() : 0;
            valorB = valorB ? new Date(valorB).getTime() : 0;
        }

        if (direcao === 'asc') {
            return valorA > valorB ? 1 : -1;
        } else {
            return valorA < valorB ? 1 : -1;
        }
    });

    paginaAtual = 1;
    exibirChamados();
    atualizarStats();
    atualizarControlesPaginacao();

    // Mostrar toast quando filtros são aplicados
    const filtrosAtivos = [buscaGeral, filtroVendedor, filtroLoja, filtroStatus, filtroUrgencia].filter(f => f).length;
    if (filtrosAtivos > 0) {
        const filtrosTexto = [];
        if (buscaGeral) filtrosTexto.push('🔍 busca geral');
        if (filtroVendedor) filtrosTexto.push('👤 vendedor');
        if (filtroLoja) filtrosTexto.push('🏪 loja');
        if (filtroStatus) filtrosTexto.push('🎯 status');
        if (filtroUrgencia) filtrosTexto.push('🚨 urgência');

        mostrarToast(`✅ ${filtrosTexto.join(', ')} aplicados (${chamadosFiltrados.length} chamados encontrados)`, 'info');
    } else {
        if (chamadosFiltrados.length > 0) {
            mostrarToast(`📋 Exibindo todos os ${chamadosFiltrados.length} chamados disponíveis`, 'success');
        } else {
            mostrarToast('📭 Nenhum chamado encontrado na planilha', 'warning');
        }
    }
}

function limparFiltros() {
    document.getElementById('buscaGeral').value = '';
    document.getElementById('filtroLoja').value = '';
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroUrgencia').value = '';
    document.getElementById('buscaVendedor').value = '';
    document.getElementById('modoVisualizacao').value = 'todos';
    document.getElementById('ordenarPor').value = 'numero';
    document.getElementById('direcaoOrdenacao').value = 'desc';
    document.getElementById('itensPorPagina').value = '10';

    filtrarChamados();
    mostrarToast('🧹 Filtros limpos - mostrando todos os chamados disponíveis', 'info');
}

function exibirChamados() {
    if (chamadosFiltrados.length === 0) {
        chamadosDiv.innerHTML = `
            <div class="sem-resultados">
                📭 Nenhum chamado encontrado com os filtros atuais
            </div>
        `;
    } else {
        // Calcular itens para a página atual
        const inicio = (paginaAtual - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina;
        const chamadosPagina = chamadosFiltrados.slice(inicio, fim);

        chamadosDiv.innerHTML = chamadosPagina.map(chamado => {
            // Determinar status visual com NOVAS CORES
            const status = chamado.status.toLowerCase();
            let statusClass, statusText, statusBadge;

            if (status.includes('check')) {
                statusClass = 'status-check';
                statusText = '✅ Concluído';
                statusBadge = 'status-check-badge';
            } else if (status.includes('andamento')) {
                statusClass = 'status-andamento';
                statusText = '🔵 Em Andamento';
                statusBadge = 'status-andamento-badge';
            } else if (status.includes('ser visto')) {
                statusClass = 'status-ser-visto';
                statusText = '🟡 A Ser Visto';
                statusBadge = 'status-ser-visto-badge';
            } else {
                statusClass = 'status-pendente';
                statusText = '⚪ Aguardando';
                statusBadge = 'status-pendente-badge';
            }

            const urgencia = chamado.urgencia || '';
            const classeUrgencia = urgencia.includes('Alta') ? 'urgencia-alta' :
                                 urgencia.includes('Média') ? 'urgencia-media' : 'urgencia-baixa';

            const statusResolvido = chamado.resolvido === 'Sim' ? 'resolvido' : 'nao-resolvido';
            const textoResolvido = chamado.resolvido === 'Sim' ? '✅ Resolvido Emergencialmente' : '❌ Não Resolvido';

            // Verificar se é chamado do vendedor atual
            const isMeuChamado = vendedorAtual && chamado.responsavel.toLowerCase().includes(vendedorAtual);
            const classeMeuChamado = isMeuChamado ? 'chamado-meu' : '';

            return `
                <div class="chamado-card ${classeMeuChamado}">
                    <div class="status-indicator ${statusClass}"></div>

                    <div class="chamado-header">
                        <div>
                            <div class="chamado-titulo">
                                ${chamado.tipoProblema || 'Chamado sem tipo'}
                                <span class="chamado-numero">#${chamado.numero}</span>
                                ${isMeuChamado ? '<small style="color: #3498db; font-weight: 600;">(MEU CHAMADO)</small>' : ''}
                            </div>
                            <div style="font-size: 0.9em; color: #666;">
                                ${chamado.sede || 'Sem sede'} • ${chamado.dataProblema || 'Sem data'}
                            </div>
                        </div>
                        <div>
                            <span class="status-badge ${statusBadge}">${statusText}</span>
                            <span class="urgencia ${classeUrgencia}">${urgencia || 'Não definida'}</span>
                        </div>
                    </div>

                    <div class="chamado-info">
                        <div class="info-item">
                            <div class="info-label">Solicitante</div>
                            <div class="info-value">${chamado.responsavel || 'Não informado'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Localização</div>
                            <div class="info-value">${chamado.localizacao || 'Não informada'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Resolução Emergencial</div>
                            <div class="info-value ${statusResolvido}">${textoResolvido}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Prestador</div>
                            <div class="info-value">${chamado.prestador || 'Não informado'}</div>
                        </div>
                    </div>

                    <div class="info-item">
                        <div class="info-label">Descrição do Problema</div>
                        <div class="descricao info-value">
                            ${chamado.descricao || 'Sem descrição fornecida'}
                        </div>
                    </div>

                    ${chamado.observacoes ? `
                    <div class="info-item">
                        <div class="info-label">Observações</div>
                        <div class="info-value">${chamado.observacoes}</div>
                    </div>
                    ` : ''}

                    <div class="timeline-info">
                        <strong>📅 Timeline:</strong>
                        Registrado em: ${chamado.timestamp || 'N/A'}
                        ${chamado.dataRegistro ? `| Status em: ${chamado.dataRegistro}` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    mostrarChamados();
}

// Carregar automaticamente quando a página abrir
window.addEventListener('DOMContentLoaded', function() {
    // Inicializar sistema de toast
    inicializarToastSystem();

    // Carregar automaticamente com cache
    carregarChamados();
    // Configurar busca em tempo real
    configurarBuscaTempoReal();
});

function atualizarStats() {
    const total = todosChamados.length;
    const filtrados = chamadosFiltrados.length;
    const concluidos = todosChamados.filter(c => c.status.toLowerCase().includes('check')).length;
    const andamento = todosChamados.filter(c => c.status.toLowerCase().includes('andamento')).length;
    const serVisto = todosChamados.filter(c => c.status.toLowerCase().includes('ser visto')).length;
    const pendentes = todosChamados.filter(c => !c.status || c.status === '').length;

    stats.innerHTML = `
        📊 Total: ${total} |
        ✅ Concluídos: ${concluidos} |
        🔵 Andamento: ${andamento} |
        🟡 A Ser Visto: ${serVisto} |
        ⚪ Pendentes: ${pendentes} |
        🔍 Filtrados: ${filtrados}
    `;
    mostrarStats();
}

function salvarCache(dados) {
    localStorage.setItem('chamadosCache', JSON.stringify(dados));
    localStorage.setItem('cacheTimestamp', Date.now());
}

function carregarCache() {
    const cache = localStorage.getItem('chamadosCache');
    const timestamp = localStorage.getItem('cacheTimestamp');

    if (cache && timestamp && (Date.now() - timestamp < 300000)) { // 5 minutos
        return JSON.parse(cache);
    }
    return null;
}

function configurarBuscaTempoReal() {
    let timeout;

    // Busca geral com debounce
    document.getElementById('buscaGeral').addEventListener('input', function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (this.value.length === 0 || this.value.length >= 2) {
                filtrarChamados();
            }
        }, 300);
    });

    // Filtros sem debounce (mudança imediata)
    ['filtroStatus', 'filtroUrgencia', 'filtroLoja', 'modoVisualizacao', 'ordenarPor', 'direcaoOrdenacao', 'itensPorPagina'].forEach(id => {
        document.getElementById(id).addEventListener('change', filtrarChamados);
    });

    // Filtro automático: quando selecionar vendedor, filtrar lojas automaticamente
    document.getElementById('buscaVendedor').addEventListener('change', function() {
        filtrarLojasPorVendedor();
        filtrarChamados();
    });

    // Busca por vendedor removido - agora é select com onchange no HTML
}

function forcarRecarregamento() {
    limparCache();
    carregarChamados(false); // false = não usar cache
}

function aplicarOrdenacao() {
    // A ordenação agora é feita dentro de filtrarChamados()
    filtrarChamados();
    const campo = document.getElementById('ordenarPor').value || 'numero';
    const direcao = document.getElementById('direcaoOrdenacao').value || 'desc';
    const campoTexto = document.querySelector(`#ordenarPor option[value="${campo}"]`).textContent;
}

// Função para alternar filtros avançados
function alternarFiltrosAvancados() {
    const filtrosAvancados = document.getElementById('filtrosAvancados');
    const btnToggle = document.getElementById('btnToggleFiltros');

    if (filtrosAvancados.style.display === 'none' || filtrosAvancados.style.display === '') {
        filtrosAvancados.style.display = 'block';
        btnToggle.innerHTML = '🔽 Menos Filtros';
        btnToggle.classList.add('active');
        mostrarToast('🎛️ Filtros avançados abertos - configure ordenação e paginação', 'info');
    } else {
        filtrosAvancados.style.display = 'none';
        btnToggle.innerHTML = '⚙️ Mais Filtros';
        btnToggle.classList.remove('active');
        mostrarToast('🎛️ Filtros avançados fechados - usando configuração padrão', 'info');
    }
}
function mostrarLoading() { loading.style.display = 'flex'; }
function esconderLoading() { loading.style.display = 'none'; }
function mostrarErro(mensagem) { error.textContent = mensagem; error.style.display = 'block'; }
function esconderErro() { error.style.display = 'none'; }
function mostrarStats() { stats.style.display = 'block'; }
function esconderStats() { stats.style.display = 'none'; }
function mostrarFiltros() { filtros.style.display = 'grid'; }
function mostrarChamados() { chamadosContainer.style.display = 'block'; }
function limparCache() {
    localStorage.removeItem('chamadosCache');
    localStorage.removeItem('cacheTimestamp');
}

function esconderChamados() { chamadosContainer.style.display = 'none'; }

// Configurações do sistema de toast
// MELHORIAS IMPLEMENTADAS:
// ✅ Sistema de toasts múltiplos com reorganização suave
// ✅ Lógica inteligente para filtros sem resultados
// ✅ Mensagens específicas baseadas no tipo de filtro
// ✅ Animações escalonadas (stagger) para melhor UX
// ✅ Reposicionamento automático quando um toast desaparece
const toastConfig = {
    maxToasts: 3,
    duration: 1500,        // 1.5 segundos (otimizado para UX)
    debounceDelay: 100,
    enableDuplicatePrevention: true,
    pauseOnHover: true     // Pausar no hover
};

// Função para inicializar o sistema de toast
function inicializarToastSystem() {
    // Garantir que o toastContainer existe
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        console.warn('Toast container não encontrado no DOM. Criando dinamicamente...');
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    console.log('✅ Sistema de toast inicializado com sucesso');
}

// Função para mostrar toast notifications
function mostrarToast(mensagem, tipo = 'success') {
    _mostrarToast(mensagem, tipo);
}

function _mostrarToast(mensagem, tipo = 'success') {
    const toastContainer = document.getElementById('toastContainer');

    // Verificação de segurança - se o container não existe, não fazer nada
    if (!toastContainer) {
        console.warn('Toast container não encontrado. Pulando exibição do toast.');
        return;
    }

    console.log(`Criando toast: ${mensagem} (${tipo})`);

    // Criar novo toast
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;

    // Adicionar botão de fechar
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.className = 'toast-close';
    closeBtn.onclick = () => {
        if (toast.timeoutId) {
            clearTimeout(toast.timeoutId);
        }
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    };

    // Adicionar ícone baseado no tipo
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    toast.appendChild(icon);

    // Adicionar mensagem
    const message = document.createElement('span');
    message.textContent = mensagem;
    message.style.flex = '1';
    toast.appendChild(message);

    // Adicionar botão de fechar
    toast.appendChild(closeBtn);

    // Configurar timer para remoção
    toast.timeoutId = setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOutRight 0.5s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 500);
        }
    }, toastConfig.duration);

    // Adicionar pause on hover
    if (toastConfig.pauseOnHover) {
        toast.onmouseenter = () => {
            if (toast.timeoutId) {
                clearTimeout(toast.timeoutId);
            }
            toast.style.animationPlayState = 'paused';
        };
        toast.onmouseleave = () => {
            toast.timeoutId = setTimeout(() => {
                if (toast.parentNode) {
                    toast.style.animation = 'slideOutRight 0.5s ease forwards';
                    setTimeout(() => {
                        if (toast.parentNode) {
                            toast.parentNode.removeChild(toast);
                        }
                    }, 500);
                }
            }, toastConfig.duration);
            toast.style.animationPlayState = 'running';
        };
    }

    toastContainer.appendChild(toast);

    // Manter apenas o número máximo de toasts
    while (toastContainer.children.length > toastConfig.maxToasts) {
        const primeiroToast = toastContainer.firstChild;
        if (primeiroToast && primeiroToast.timeoutId) {
            clearTimeout(primeiroToast.timeoutId);
        }
        if (primeiroToast) {
            toastContainer.removeChild(primeiroToast);
        }
    }
}

// ========================================
// 🎯 INICIALIZAÇÃO E CONFIGURAÇÃO
// ========================================

// Funções de configuração adicionais
function configurarToastDuration(novaDuracao) {
    if (!novaDuracao || novaDuracao < 1000) return;
    toastConfig.duration = novaDuracao;
    mostrarToast(`⏱️ Duração alterada para ${novaDuracao/1000}s`, 'info');
}

function limparToasts() {
    const toastContainer = document.getElementById('toastContainer');
    if (toastContainer) {
        toastContainer.innerHTML = '';
        mostrarToast('🧹 Todos os toasts foram removidos', 'info');
    }
}

function pausarToasts() {
    const toasts = document.querySelectorAll('.toast');
    toasts.forEach(toast => {
        if (toast.timeoutId) {
            clearTimeout(toast.timeoutId);
        }
        toast.style.animationPlayState = 'paused';
    });
    mostrarToast('⏸️ Toasts pausados', 'warning');
}

// Função para verificar sistema de toast
function verificarToastSystem() {
    console.log('🔍 Verificando sistema de toast...');
    const toastContainer = document.getElementById('toastContainer');
    console.log('Container encontrado:', !!toastContainer);
    console.log('Configuração atual:', toastConfig);
    console.log('Toasts ativos:', toastContainer ? toastContainer.children.length : 0);
}

// ========================================
// 🧪 FUNÇÕES DE TESTE E DEBUG
// ========================================

// Adicionar painel de debug (desabilitado por padrão)
function adicionarDebugPanel() {
    const debugPanel = document.createElement('div');
    debugPanel.className = 'toast-debug-panel';
    debugPanel.innerHTML = `
        <div><strong>🧪 Debug Panel</strong></div>
        <button onclick="verificarToastSystem()">Verificar Sistema</button>
        <button onclick="configurarToastDuration(2000)">2s</button>
        <button onclick="configurarToastDuration(5000)">5s</button>
        <button onclick="configurarToastDuration(10000)">10s</button>
        <button onclick="limparToasts()">Limpar</button>
        <button onclick="pausarToasts()">Pause</button>
        <button onclick="adicionarDebugPanel()">Fechar</button>
    `;
    document.body.appendChild(debugPanel);

    // Para habilitar o debug panel, descomente a linha abaixo:
    // debugPanel.style.display = 'block';
}
