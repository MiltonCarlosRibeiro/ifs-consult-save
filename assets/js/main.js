// Carregar itens ao abrir a página
document.addEventListener('DOMContentLoaded', carregarItens);

async function salvarItem() {
    const inputCodigo = document.getElementById('codigo');
    const inputDesc = document.getElementById('descricao');
    const selectTipo = document.getElementById('tipo');

    if (!inputCodigo.value || !inputDesc.value) {
        alert("Por favor, preencha o código e a descrição.");
        return;
    }

    const itemData = {
        tipo: selectTipo.value,
        codigo: inputCodigo.value,
        descricao: inputDesc.value
    };

    try {
        const response = await fetch('/api/itens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });

        const result = await response.json();

        if (response.ok) {
            // REGRA: Se salvo, não pode mais ser alterado (Imutabilidade)
            inputCodigo.readOnly = true;
            inputCodigo.classList.add('immutable');
            
            alert("Item cadastrado com sucesso!");
            carregarItens(); // Atualiza a lista visual
        } else {
            alert("Erro: " + result.error);
        }
    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro de conexão com o servidor.");
    }
}

async function carregarItens() {
    const container = document.getElementById('arvoreEstrutura');
    
    try {
        const response = await fetch('/api/itens');
        const itens = await response.json();

        if (itens.length === 0) {
            container.innerHTML = "<p>Nenhum item cadastrado.</p>";
            return;
        }

        container.innerHTML = itens.map(item => `
            <div class="mp-card" style="border-left: 5px solid ${getCorBorda(item.tipo)}">
                <header>
                    <span class="pill">#${item.codigo}</span>
                    <h3>${item.tipo} - ${item.descricao}</h3>
                    <div class="btn-group end">
                        <button class="btn-copy" onclick="abrirFilhos('${item._id}')">+</button>
                    </div>
                </header>
                <div class="mp-list">
                    <div class="mp-row" style="background: ${item.corDestaque || '#f9fbff'}">
                        <span class="txt">Custo: R$ ${item.custo.toFixed(2)}</span>
                        <span class="txt">Markup: ${item.markup}</span>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        container.innerHTML = "<p>Erro ao carregar dados do MongoDB.</p>";
    }
}

function getCorBorda(tipo) {
    const cores = { 'W1': '#2d6cdf', 'F': '#2e7d32', 'C1': '#d84315', 'C0': '#6a1b9a' };
    return cores[tipo] || '#ccc';
}