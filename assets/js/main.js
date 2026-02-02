let idPaiSelecionado = null;
let itensNoPreview = [];

document.addEventListener('DOMContentLoaded', carregarItens);

async function carregarItens() {
    const res = await fetch('/api/itens');
    const itens = await res.json();
    const container = document.getElementById('arvoreEstrutura');
    container.innerHTML = "";
    itens.filter(i => !i.parentId).forEach(r => renderNivel(r, itens, container, 0));
}

function renderNivel(item, lista, container, nivel) {
    const filhos = lista.filter(f => f.parentId === item.id);
    const wrapper = document.createElement('div');
    wrapper.className = `node-wrapper ${nivel > 0 ? 'tree-branch' : ''}`;
    wrapper.style.marginLeft = `${nivel * 30}px`;

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
                <div class="mp-row-field highlight-${item.corDesc}">
                    <span style="flex:1"><b>DESCRIÇÃO:</b> ${item.descricao} (x${item.quantidade})</span>
                    <div class="color-picker">
                        <span class="dot g" onclick="pintar(${item.id},'corDesc','verde')"></span>
                        <span class="dot b" onclick="pintar(${item.id},'corDesc','azul')"></span>
                        <span class="dot r" onclick="pintar(${item.id},'corDesc','vermelho')"></span>
                        <span class="dot n" onclick="pintar(${item.id},'corDesc','transparent')"></span>
                    </div>
                </div>
                <div class="mp-row-field highlight-${item.corCusto}">
                    <span><b>CUSTO ACUM:</b> R$ ${item.custoTotal.toFixed(2)} | <b>MARKUP:</b> ${(item.markup*100).toFixed(0)}% | <b>VENDA:</b> R$ ${item.valorVenda.toFixed(2)}</span>
                    <div class="color-picker">
                        <span class="dot g" onclick="pintar(${item.id},'corCusto','verde')"></span>
                        <span class="dot b" onclick="pintar(${item.id},'corCusto','azul')"></span>
                        <span class="dot r" onclick="pintar(${item.id},'corCusto','vermelho')"></span>
                        <span class="dot n" onclick="pintar(${item.id},'corCusto','transparent')"></span>
                    </div>
                </div>
            </div>
        </div>
        <div class="children-container"></div>
    `;
    const childContainer = wrapper.querySelector('.children-container');
    container.appendChild(wrapper);
    filhos.forEach(f => renderNivel(f, lista, childContainer, nivel + 1));
}

function toggleNode(btn) {
    const cont = btn.closest('.node-wrapper').querySelector('.children-container');
    const isVisible = cont.style.display !== 'none';
    cont.style.display = isVisible ? 'none' : 'block';
    btn.innerText = isVisible ? '▶' : '▼';
}

async function salvarItem() {
    const dados = {
        id: document.getElementById('editItemId').value || null,
        tipo: document.getElementById('tipo').value,
        codigo: document.getElementById('codigo').value,
        descricao: document.getElementById('descricao').value,
        quantidade: parseFloat(document.getElementById('quantidade').value) || 1,
        custo: parseFloat(document.getElementById('custo').value) || 0,
        markup: parseFloat(document.getElementById('markup').value) || 0
    };
    await fetch('/api/itens', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(dados) });
    limparFormularioPrincipal(); carregarItens();
}

async function salvarFilhoManual() {
    const item = {
        tipo: document.getElementById('mTipo').value,
        codigo: document.getElementById('mCodigo').value,
        descricao: document.getElementById('mDescricao').value,
        quantidade: parseFloat(document.getElementById('mQtd').value) || 1,
        custo: parseFloat(document.getElementById('mCusto').value) || 0,
        markup: parseFloat(document.getElementById('mMarkup').value) || 0,
        parentId: idPaiSelecionado
    };
    await fetch('/api/itens', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(item) });
    fecharModal(); carregarItens();
}

function prepararPreview() {
    const text = document.getElementById('txtExcel').value;
    const delim = text.includes('\t') ? '\t' : ';';
    itensNoPreview = text.split('\n').filter(l => l.length > 5).map(l => {
        const c = l.split(delim);
        return { nivel: c[0].replace(/\./g,'').trim(), codigo: c[1]?.trim(), descricao: c[4]?.trim() || 'S/D', quantidade: c[10] || 1, tipo: 'F' };
    }).filter(i => i.codigo);
    
    document.querySelector('#tabelaPreview tbody').innerHTML = itensNoPreview.map((i, idx) => `<tr><td>${i.nivel}</td><td>${i.codigo}</td><td>${i.descricao}</td><td>${i.quantidade}</td><td><button onclick="itensNoPreview.splice(${idx},1);prepararPreview()">❌</button></td></tr>`).join('');
    document.getElementById('areaColagem').style.display='none';
    document.getElementById('areaPreview').style.display='block';
}

async function confirmarImportacao() {
    await fetch(`/api/itens/${idPaiSelecionado}/filhos-bulk`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(itensNoPreview) });
    fecharModal(); carregarItens();
}

function abrirImport(id) { idPaiSelecionado = id; document.getElementById('modalExcel').style.display='flex'; }
function fecharModal() { document.getElementById('modalExcel').style.display='none'; }
async function pintar(id, campo, cor) { await fetch('/api/itens', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id, [campo]:cor}) }); carregarItens(); }
async function statusDB(id, campo, valor) { await fetch('/api/itens', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id, [campo]:valor}) }); }
async function excluir(id) { if(confirm("Excluir?")) { await fetch(`/api/itens/${id}`, {method:'DELETE'}); carregarItens(); } }

function editar(item) {
    document.getElementById('editItemId').value = item.id;
    document.getElementById('tipo').value = item.tipo;
    document.getElementById('codigo').value = item.codigo;
    document.getElementById('descricao').value = item.descricao;
    document.getElementById('quantidade').value = item.quantidade;
    document.getElementById('custo').value = item.custo;
    document.getElementById('markup').value = item.markup;
    document.getElementById('btnSalvar').textContent = "Atualizar Cadastro";
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