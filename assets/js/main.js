let idPaiSelecionado = null;
let itensNoPreview = [];

document.addEventListener('DOMContentLoaded', carregarItens);

/** BUSCA E RENDERIZAÇÃO DA ÁRVORE **/
async function carregarItens() {
    const res = await fetch('/api/itens');
    const itens = await res.json();
    const container = document.getElementById('arvoreEstrutura');
    container.innerHTML = "";
    // Filtra itens raiz (aqueles que não possuem parentId)
    itens.filter(i => !i.parentId).forEach(r => renderNivel(r, itens, container, 0));
}

function renderNivel(item, lista, container, nivel) {
    const filhos = lista.filter(f => f.parentId === item.id);
    const wrapper = document.createElement('div');
    wrapper.className = `node-wrapper ${nivel > 0 ? 'tree-branch' : ''}`;
    wrapper.style.marginLeft = `${nivel * 30}px`;

    const labelCusto = filhos.length > 0 ? 'CUSTO COMPOSIÇÃO' : 'CUSTO UNIT';

    wrapper.innerHTML = `
        <div class="mp-card">
            <header>
                ${filhos.length > 0 ? `<button class="btn-toggle" onclick="toggleNode(this)">▼</button>` : `<span style="width:24px"></span>`}
                <div class="checklist-group">
                    <label><input type="checkbox" ${item.checkCadastro?'checked':''} onchange="statusDB(${item.id},'checkCadastro',this.checked)"> Cad</label>
                    <label><input type="checkbox" ${item.checkEstrutura?'checked':''} onchange="statusDB(${item.id},'checkEstrutura',this.checked)"> Est</label>
                    <label><input type="checkbox" ${item.checkMP?'checked':''} onchange="statusDB(${item.id},'checkMP',this.checked)"> MP</label>
                    <label><input type="checkbox" ${item.checkDOP?'checked':''} onchange="statusDB(${item.id},'checkDOP',this.checked)"> DOP</label>
                    <label><input type="checkbox" ${item.checkRoteiro?'checked':''} onchange="statusDB(${item.id},'checkRoteiro',this.checked)"> Rot</label>
                </div>
                <span class="pill">L${nivel+1}</span> <span class="pill">#${item.codigo}</span>
                <div class="row-actions">
                    <button class="btn-edit" onclick='editar(${JSON.stringify(item)})'>✎</button>
                    <button class="btn-copy" onclick="abrirImport(${item.id})">+</button>
                    <button class="btn-delete" onclick="excluir(${item.id})">🗑</button>
                </div>
            </header>
            <div class="mp-list">
                <div class="mp-row-field">
                    <span style="flex:1"><b>DESCRIÇÃO:</b> ${item.descricao} (x${item.quantidade})</span>
                </div>
                <div class="mp-row-field">
                    <span><b>${labelCusto}:</b> R$ ${item.custoAgrupado.toFixed(2)} | <b>M.U:</b> ${(item.markup*100).toFixed(0)}% | <b>VENDA FINAL: R$ ${item.vendaFinal.toFixed(2)}</b></span>
                </div>
            </div>
        </div>
        <div class="children-container"></div>
    `;
    const childContainer = wrapper.querySelector('.children-container');
    container.appendChild(wrapper);
    filhos.forEach(f => renderNivel(f, lista, childContainer, nivel + 1));
}

/** MAPEAMENTO DE COLUNAS IFS: A(0), C(2), D(3), F(5) **/
function prepararPreview() {
    const text = document.getElementById('txtExcel').value;
    const delim = text.includes('\t') ? '\t' : (text.includes(';') ? ';' : ',');
    const lines = text.split('\n');

    itensNoPreview = lines.filter(l => l.trim().length > 10).map(l => {
        // Remove aspas duplas típicas de arquivos CSV
        const c = l.replace(/"/g, '').split(delim);
        return { 
            nivel: c[0] ? c[0].trim() : '?',
            codigo: c[2] ? c[2].trim().toUpperCase() : '', 
            descricao: c[3] ? c[3].trim().toUpperCase() : 'S/D', 
            quantidade: c[5] ? parseFloat(c[5].replace(',', '.')) : 1 
        };
    }).filter(i => i.codigo && i.codigo !== "ITEM COMPONENTE" && i.codigo !== "N° ITEM LINHA");
    
    renderizarTabelaPreview();
}

/** RENDERIZAÇÃO DA TABELA DE PREVIEW NO MODAL **/
function renderizarTabelaPreview() {
    const tbody = document.querySelector('#tabelaPreview tbody');
    tbody.innerHTML = itensNoPreview.map((i, idx) => `
        <tr>
            <td>${i.nivel}</td>
            <td>${i.codigo}</td>
            <td>${i.descricao}</td>
            <td>${i.quantidade}</td>
            <td><button class="btn-preview-del" onclick="removerDoPreview(${idx})">❌</button></td>
        </tr>`).join('');
    
    document.getElementById('areaPreview').style.display = itensNoPreview.length > 0 ? 'block' : 'none';
    document.getElementById('modalFooter').style.display = itensNoPreview.length > 0 ? 'block' : 'none';
}

function removerDoPreview(index) {
    itensNoPreview.splice(index, 1);
    renderizarTabelaPreview();
}

/** CONFIRMAR IMPORTAÇÃO COM LIMPEZA DA CAIXA **/
async function confirmarImportacao() {
    if (itensNoPreview.length === 0) return;

    const res = await fetch(`/api/itens/${idPaiSelecionado}/filhos-bulk`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(itensNoPreview) 
    });

    if (res.ok) {
        // Limpa a caixa de texto e o preview após salvar
        document.getElementById('txtExcel').value = "";
        itensNoPreview = [];
        renderizarTabelaPreview();
        
        fecharModal(); 
        carregarItens(); 
    }
}

/** AUXILIARES DE MODAL E STATUS **/
function abrirImport(id) { 
    idPaiSelecionado = id; 
    document.getElementById('modalExcel').style.display = 'flex'; 
    document.getElementById('txtExcel').value = ""; // Limpa ao abrir para novo pai
    document.getElementById('areaPreview').style.display = 'none'; 
    document.getElementById('modalFooter').style.display = 'none'; 
}

function fecharModal() { document.getElementById('modalExcel').style.display = 'none'; }

function toggleNode(btn) { 
    const cont = btn.closest('.node-wrapper').querySelector('.children-container'); 
    cont.style.display = (cont.style.display === 'none') ? 'block' : 'none'; 
    btn.innerText = (cont.style.display === 'none') ? '▶' : '▼'; 
}

async function statusDB(id, campo, valor) { 
    await fetch('/api/itens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, [campo]: valor }) }); 
}

async function excluir(id) { 
    if (confirm("Excluir item e todos os seus filhos?")) { 
        await fetch(`/api/itens/${id}`, { method: 'DELETE' }); 
        carregarItens(); 
    } 
}

/** GERENCIAMENTO MANUAL (CRUD) **/
function editar(item) {
    document.getElementById('editItemId').value = item.id;
    document.getElementById('codigo').value = item.codigo;
    document.getElementById('descricao').value = item.descricao;
    document.getElementById('quantidade').value = item.quantidade;
    document.getElementById('custo').value = item.custo;
    document.getElementById('markup').value = item.markup;
    document.getElementById('btnSalvar').textContent = "Atualizar Item";
}

function limparFormularioPrincipal() {
    document.getElementById('editItemId').value = '';
    document.getElementById('codigo').value = '';
    document.getElementById('descricao').value = '';
    document.getElementById('quantidade').value = 1;
    document.getElementById('custo').value = '';
    document.getElementById('markup').value = '';
    document.getElementById('btnSalvar').textContent = "Salvar Cadastro";
}

async function salvarItem() {
    const dados = {
        id: document.getElementById('editItemId').value || null,
        codigo: document.getElementById('codigo').value.toUpperCase(),
        descricao: document.getElementById('descricao').value.toUpperCase(),
        quantidade: parseFloat(document.getElementById('quantidade').value) || 1,
        custo: parseFloat(document.getElementById('custo').value) || 0,
        markup: parseFloat(document.getElementById('markup').value) || 0
    };
    await fetch('/api/itens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
    limparFormularioPrincipal(); 
    carregarItens();
}

async function salvarFilhoManual() {
    const item = {
        codigo: document.getElementById('mCodigo').value.toUpperCase(),
        descricao: document.getElementById('mDescricao').value.toUpperCase(),
        quantidade: parseFloat(document.getElementById('mQtd').value) || 1,
        custo: parseFloat(document.getElementById('mCusto').value) || 0,
        markup: parseFloat(document.getElementById('mMarkup').value) || 0,
        parentId: idPaiSelecionado
    };
    await fetch('/api/itens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
    fecharModal(); 
    carregarItens();
}