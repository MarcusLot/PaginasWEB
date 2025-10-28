// BE MAKE Links - Sistema Simplificado (Sem Modal)
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 BE MAKE Links carregado');

    // Função para feedback visual nos botões
    function addButtonInteractions() {
        const buttons = document.querySelectorAll('.btn');

        buttons.forEach(button => {
            // Efeito de clique apenas para botões sem link
            button.addEventListener('click', function(e) {
                if (this.href === '#') {
                    e.preventDefault();
                    this.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        this.style.transform = '';
                    }, 150);
                }
                // Links funcionam diretamente sem modal
            });

            // Efeitos hover
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
            });

            button.addEventListener('mouseleave', function() {
                this.style.transform = '';
            });
        });
    }

    // Funcionalidade de Busca
    function addSearchFunctionality() {
        const searchInput = document.getElementById('searchInput');
        const cards = document.querySelectorAll('.card');

        if (!searchInput || cards.length === 0) return;

        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            let visibleCount = 0;

            cards.forEach(card => {
                const titleElement = card.querySelector('h2');
                if (!titleElement) return;

                const title = titleElement.textContent.toLowerCase();
                const buttons = card.querySelectorAll('.btn');
                let buttonText = '';

                buttons.forEach(btn => {
                    if (btn.textContent) {
                        buttonText += btn.textContent.toLowerCase() + ' ';
                    }
                });

                const isVisible = title.includes(searchTerm) || buttonText.includes(searchTerm);

                if (isVisible) {
                    card.style.display = 'block';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                    visibleCount++;
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        if (!title.includes(searchTerm) && !buttonText.includes(searchTerm)) {
                            card.style.display = 'none';
                        }
                    }, 300);
                }
            });

            // Mostrar mensagem de resultado
            updateSearchResults(visibleCount, searchTerm);
        });

        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                this.dispatchEvent(new Event('input'));
                this.blur();
            }
        });
    }

    function updateSearchResults(count, searchTerm) {
        let noResultsMsg = document.querySelector('.no-results');
        const linksGrid = document.querySelector('.links-grid');

        if (!linksGrid) return;

        if (searchTerm && count === 0) {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('div');
                noResultsMsg.className = 'no-results';
                noResultsMsg.style.cssText = `
                    text-align: center;
                    padding: 40px 20px;
                    color: var(--color4);
                    font-size: 1.1rem;
                    display: none;
                `;
                noResultsMsg.innerHTML = `
                    <div class="search-no-results-icon">🔍</div>
                    <div>Nenhum módulo encontrado para "<strong>${searchTerm}</strong>"</div>
                    <div style="font-size: 0.9rem; margin-top: 10px; opacity: 0.7;">Tente buscar por: Livro Caixa, Vale, Compras, Fiado...</div>
                `;
                linksGrid.appendChild(noResultsMsg);
            }
            noResultsMsg.style.display = 'block';
        } else if (noResultsMsg) {
            noResultsMsg.style.display = 'none';
        }
    }

    // Navegação por teclado
    function addKeyboardNavigation() {
        document.addEventListener('keydown', function(e) {
            // Navegação rápida com números 1-6
            if (e.key >= '1' && e.key <= '6') {
                const cardIndex = parseInt(e.key) - 1;
                const cards = document.querySelectorAll('.card');
                if (cards[cardIndex]) {
                    const primaryButton = cards[cardIndex].querySelector('.btn-primary');
                    if (primaryButton) {
                        primaryButton.focus();
                    }
                }
            }

            // F para foco na busca
            if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
                const searchInput = document.getElementById('searchInput');
                if (searchInput && document.activeElement !== searchInput) {
                    e.preventDefault();
                    searchInput.focus();
                }
            }

            // ESC para fechar elementos ativos
            if (e.key === 'Escape') {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.blur) {
                    activeElement.blur();
                }
            }
        });
    }

    // Inicialização
    addButtonInteractions();
    addSearchFunctionality();
    addKeyboardNavigation();

    console.log('✅ Sistema inicializado');
});
