let idPaiSelecionado = null;

document.addEventListener('DOMContentLoaded', carregarItens);

async function salvarItem() {
    const id = document.getElementById('editItemId').value;
    const itemData = {
        tipo: document.getElementById('tipo').value,
        codigo: document.getElementById('codigo').value,
        descricao: document.getElementById('descricao').value,
        custo: parseFloat(document.getElementById('custo').value) || 0,
        markup: parseFloat(document.getElementById('markup').value) || 0
    };
    if (id) itemData.id = id;

    try {
        const res = await fetch('/api/itens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });

        if (res.ok) {
            limparFormularioPrincipal();
            carregarItens();
        } else {
            const err = await res.json();
            alert("Erro: " + err.error);
        }
    } catch (f) { alert("Erro ao conectar com o servidor."); }
}

async function carregarItens() {
    const container = document.getElementById('arvoreEstrutura');
    try {
        const response = await fetch('/api/itens');
        const itens = await response.json();

        const itensPais = itens.filter(i => !i.parentId);
        container.innerHTML = itensPais.map(item => {
            const filhosCount = itens.filter(f => f.parentId === item.id).length;
            const classeBorda = `border-${item.tipo.toLowerCase()}`;
            const classeDestaque = item.corDestaque ? `highlight-${item.corDestaque}` : 'highlight-transparent';

            return `
                <div class="mp-card ${classeBorda}">
                    <header>
                        <span class="pill">#${item.codigo}</span>
                        <h3 style="flex:1;">${item.tipo} - ${item.descricao}</h3>
                        <div class="row-actions">
                            <span class="dot" style="background:#ccffcc;" onclick="pintarLinha(${item.id}, 'verde')"></span>
                            <span class="dot" style="background:#dde8fa;" onclick="pintarLinha(${item.id}, 'azul')"></span>
                            <span class="dot" style="background:#ffcccc;" onclick="pintarLinha(${item.id}, 'vermelho')"></span>
                            <span class="dot" style="background:#fff;" onclick="pintarLinha(${item.id}, 'transparent')"></span>
                            |
                            <button class="btn-copy" onclick="abrirModalExcel(${item.id})">+</button>
                            <button class="btn-edit" onclick='prepararEdicao(${JSON.stringify(item).replace(/'/g, "&apos;")})'>✎</button>
                            <button class="btn-delete" onclick="excluirItem(${item.id})">🗑</button>
                        </div>
                    </header>
                    <div class="mp-list">
                        <div class="mp-row ${classeDestaque}">
                            <span><b>Custo:</b> R$ ${item.custoTotal.toFixed(2)}</span>
                            <span><b>Markup:</b> ${(item.markup * 100).toFixed(0)}%</span>
                            <span style="color:var(--primary-blue); font-weight:bold;"><b>Venda:</b> R$ ${item.valorVenda.toFixed(2)}</span>
                            <span><b>Filhos:</b> ${filhosCount}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) { container.innerHTML = "<p>Erro ao carregar dados.</p>"; }
}

async function pintarLinha(id, cor) {
    await fetch('/api/itens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, corDestaque: cor })
    });
    carregarItens();
}

function prepararEdicao(item) {
    document.getElementById('editItemId').value = item.id;
    document.getElementById('tipo').value = item.tipo;
    const cod = document.getElementById('codigo');
    cod.value = item.codigo;
    cod.readOnly = true;
    cod.classList.add('immutable');
    document.getElementById('descricao').value = item.descricao;
    document.getElementById('custo').value = item.custo;
    document.getElementById('markup').value = item.markup;
    document.getElementById('btnSalvarPrincipal').textContent = "Atualizar";
}

async function excluirItem(id) {
    if (confirm("Excluir item?")) {
        await fetch(`/api/itens/${id}`, { method: 'DELETE' });
        carregarItens();
    }
}

function limparFormularioPrincipal() {
    document.getElementById('editItemId').value = '';
    const cod = document.getElementById('codigo');
    cod.value = ''; cod.readOnly = false; cod.classList.remove('immutable');
    document.getElementById('descricao').value = '';
    document.getElementById('custo').value = '';
    document.getElementById('markup').value = '';
    document.getElementById('btnSalvarPrincipal').textContent = "Salvar Item";
}

function abrirModalExcel(id) { idPaiSelecionado = id; document.getElementById('modalExcel').style.display = 'flex'; }
function fecharModal() { document.getElementById('modalExcel').style.display = 'none'; }

async function salvarFilhoManual() {
    const cod = document.getElementById('manualCodigo').value;
    const des = document.getElementById('manualDesc').value;
    await enviarFilhos([{ tipo: 'F', codigo: cod, descricao: des, custo: 0, markup: 0 }]);
}

async function processarExcel() {
    const raw = document.getElementById('txtExcel').value;
    const payload = raw.split('\n').filter(l => l.trim()).map(l => {
        const col = l.split('\t');
        return { tipo: 'F', codigo: col[0]?.trim() || 'S/D', descricao: col[1]?.trim() || 'S/D', custo: 0, markup: 0 };
    });
    await enviarFilhos(payload);
}

async function enviarFilhos(payload) {
    await fetch(`/api/itens/${idPaiSelecionado}/filhos-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    fecharModal();
    carregarItens();
}