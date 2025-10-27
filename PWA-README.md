# 🚀 PWA - Instruções Rápidas

## 📱 Como Instalar no Celular

1. **Abra** o site no **Chrome** ou **Edge** do celular
2. **Procure** o botão **"Instalar App"** ou **"+"** na barra de endereço
3. **Toque** em "Instalar" ou "Adicionar à tela inicial"
4. **Confirme** a instalação
5. **Pronto!** O app aparece na tela inicial como qualquer outro app

## 💻 Como Instalar no Desktop

1. **Abra** no **Chrome** ou **Edge**
2. **Clique** no ícone **"+"** na barra de endereço (lado direito)
3. **Selecione** **"Instalar"** ou **"Instalar App"**
4. **Confirme** - o app será instalado como programa nativo

## 🌐 Deploy no GitHub Pages

### ✅ **Funciona Perfeitamente no GitHub!**

1. **Envie para o GitHub:**
   ```bash
   git add .
   git commit -m "Deploy BE MAKE Links"
   git push origin main
   ```

2. **Ative GitHub Pages:**
   - Repositório → **Settings** → **Pages**
   - **Source:** `main` branch, `/root`
   - **Save**

3. **URL:** `https://seu-usuario.github.io/repo-name`

4. **PWA funciona normalmente** no GitHub Pages!

## 🔗 Configurar Links do Sistema

No arquivo `script.js`, substitua pelas URLs reais:

```javascript
updateLinks({
    'Acessar Livro Caixa': 'https://seu-sistema.com/livro-caixa',
    'Acessar Vale': 'https://seu-sistema.com/vale',
    'Acessar Compras': 'https://seu-sistema.com/compras',
    'Acessar Fiado': 'https://seu-sistema.com/fiado',
    'Acessar Conferência de Caixa': 'https://seu-sistema.com/conferencia',
    'Abrir Chamado': 'https://seu-sistema.com/chamado/novo',
    'Visualizar Chamados': 'https://seu-sistema.com/chamados'
});
```

## ✨ Funcionalidades Incluídas

- ✅ **Busca inteligente** por módulos
- ✅ **Design responsivo** para todos os dispositivos
- ✅ **6 módulos BE MAKE** organizados
- ✅ **PWA completo** (instalável)
- ✅ **Paleta de cores** oficial BE MAKE

---

**Desenvolvido especialmente para BE MAKE** por Marcus Lot
