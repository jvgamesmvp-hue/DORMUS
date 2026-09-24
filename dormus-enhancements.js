/* Dormus — extensões clássicas, sem dependências e seguras para carregamento repetido. */
(function () {
  'use strict';

  if (window.__dormusEnhancementsLoaded) return;
  window.__dormusEnhancementsLoaded = true;

  var LOGO_KEY = 'dormus-logo-choice';
  var LOGOS = {
    classic: { name: 'Clássico', description: 'A marca original do Dormus.', manifest: './manifest-classic.json', preview: './icons/dormus-classic.svg', icon: './icons/dormus-classic-192.png' },
    portal: { name: 'Portal', description: 'Leitura clara para o acesso diário.', manifest: './manifest-portal.json', preview: './icons/dormus-portal.svg', icon: './icons/dormus-portal-192.png' },
    monogram: { name: 'Monograma', description: 'Assinatura compacta para telas menores.', manifest: './manifest-monogram.json', preview: './icons/dormus-monogram.svg', icon: './icons/dormus-monogram-192.png' }
  };

  function db() {
    try {
      if (typeof window.DormusDB !== 'undefined' && window.DormusDB) return window.DormusDB;
      if (typeof window.db !== 'undefined' && window.db) return window.db;
      if (typeof globalThis.db !== 'undefined' && globalThis.db) return globalThis.db;
    } catch (e) {}
    return { contracts: [] };
  }
  function escText(value) {
    try {
      if (typeof window.esc === 'function') return window.esc(value);
      if (typeof esc === 'function') return esc(value);
    } catch (e) {}
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c];
    });
  }
  function moneyText(value) {
    try {
      if (typeof window.money === 'function') return window.money(value);
      if (typeof money === 'function') return money(value);
    } catch (e) {}
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function dateText(value) {
    if (!value) return 'Não informado';
    var parts = String(value).split('-');
    return parts.length === 3 ? parts.reverse().join('/') : String(value);
  }
  function today() {
    return localDateValue(new Date());
  }
  function localDateValue(date) {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  }
  function dayAfter(value) {
    if (!value) return today();
    var date = new Date(value + 'T12:00:00');
    if (Number.isNaN(date.getTime())) return today();
    date.setDate(date.getDate() + 1);
    return localDateValue(date);
  }
  function yearAfter(value) {
    if (!value) return '';
    var date = new Date(value + 'T12:00:00');
    if (Number.isNaN(date.getTime())) return '';
    date.setFullYear(date.getFullYear() + 1);
    return localDateValue(date);
  }
  function uid() {
    return 'ren-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }
  function contractById(id) {
    var list = db().contracts || [];
    return list.find(function (item) { return String(item.id) === String(id); }) || null;
  }
  function closeLegacyModal() {
    if (typeof window.closeModal === 'function') window.closeModal();
    else {
      var root = document.getElementById('modal-root');
      if (root) root.innerHTML = '';
    }
  }
  function persist() {
    try {
      if (typeof window.save === 'function') return Promise.resolve(window.save());
      if (typeof save === 'function') return Promise.resolve(save());
    } catch (e) {
      return Promise.reject(e);
    }
    return Promise.reject(new Error('A função de gravação do Dormus não está disponível.'));
  }
  function propertyName(contract) {
    var list = db().properties || [];
    var item = list.find(function (x) { return String(x.id) === String(contract && contract.propertyId); });
    return item && (item.name || item.address) || 'Imóvel não informado';
  }
  function tenantName(contract) {
    var list = db().tenants || [];
    var item = list.find(function (x) { return String(x.id) === String(contract && contract.tenantId); });
    return item && item.name || 'Locatário não informado';
  }

  function field(label, id, value, type, extra, full) {
    return '<div class="form-field' + (full ? ' full' : '') + '"><label for="' + id + '">' + label + '</label>' +
      '<input id="' + id + '" type="' + (type || 'text') + '" value="' + escText(value == null ? '' : value) + '"' +
      (extra ? ' ' + extra : '') + '></div>';
  }
  function selectField(label, id, options, value, full) {
    return '<div class="form-field' + (full ? ' full' : '') + '"><label for="' + id + '">' + label + '</label><select id="' + id + '">' +
      options.map(function (option) {
        return '<option value="' + escText(option) + '"' + (String(option) === String(value || '') ? ' selected' : '') + '>' + escText(option) + '</option>';
      }).join('') + '</select></div>';
  }
  function textArea(label, id, value) {
    return '<div class="form-field full"><label for="' + id + '">' + label + '</label><textarea id="' + id + '" rows="3">' + escText(value || '') + '</textarea></div>';
  }
  function currentSnapshot(contract) {
    return {
      start: contract.start || '',
      end: contract.end || '',
      rent: Number(contract.rent || 0),
      index: contract.index || '',
      adjustment: contract.adjustment || '',
      dueDay: contract.dueDay || '',
      guarantee: contract.guarantee || ''
    };
  }
  function renewalHistory(contract) {
    return Array.isArray(contract.renewals) ? contract.renewals : [];
  }
  function historyHtml(contract) {
    var rows = renewalHistory(contract).slice().reverse();
    if (!rows.length) return '<div class="dormus-renewal-history-empty">Nenhuma renovação registrada para este contrato.</div>';
    return rows.map(function (r) {
      return '<div class="dormus-renewal-history-row"><span><strong>' + escText(dateText(r.renewalDate)) + '</strong><br>Renovação</span>' +
        '<span>' + escText(dateText(r.previousStart || r.start)) + ' até ' + escText(dateText(r.previousEnd || r.end)) + '</span>' +
        '<span>' + moneyText(r.previousRent != null ? r.previousRent : r.oldRent) + ' → ' + moneyText(r.newRent) + '</span>' +
        '<span>' + escText(r.index || 'Índice não informado') + '</span></div>';
    }).join('');
  }
  function summaryHtml(contract) {
    var current = currentSnapshot(contract);
    return '<div class="dormus-renewal-current"><div><span>Vigência atual</span><strong>' + escText(dateText(current.start)) + ' até ' + escText(dateText(current.end)) + '</strong></div>' +
      '<div><span>Aluguel atual</span><strong>' + moneyText(current.rent) + '</strong></div>' +
      '<div><span>Índice atual</span><strong>' + escText(current.index || 'Não informado') + '</strong></div>' +
      '<div><span>Renovações</span><strong>' + renewalHistory(contract).length + '</strong></div></div>';
  }
  function renewalForm(contract) {
    var current = currentSnapshot(contract);
    var initialRent = Number(current.rent || 0);
    var initialAdjustment = 0;
    var start = current.end && dayAfter(current.end) > today() ? dayAfter(current.end) : today();
    var next = yearAfter(start);
    return '<p class="dormus-renewal-intro">Informe o novo período e as condições aprovadas. O aluguel sugerido usa o percentual informado sobre o valor atual; confira o índice vigente antes de assinar. O contrato atual só será alterado depois da confirmação em “Salvar renovação”.</p>' +
      summaryHtml(contract) +
      '<div class="form-grid">' +
      field('Início da nova vigência', 'dormus-renew-start', start, 'date', 'required') +
      field('Fim da nova vigência', 'dormus-renew-end', '', 'date', 'required') +
      field('Data da renovação', 'dormus-renew-date', today(), 'date', 'required') +
      field('Índice de reajuste', 'dormus-renew-index', current.index || '', 'text', 'required') +
      field('Percentual de ajuste (%)', 'dormus-renew-adjustment', initialAdjustment, 'number', 'min="0" step="0.01" required') +
      field('Novo aluguel (R$)', 'dormus-renew-rent', initialRent.toFixed(2), 'number', 'min="0" step="0.01" required') +
      '<span class="dormus-renewal-calculated full" id="dormus-renew-calculated">O valor inicial é calculado pelo aluguel atual e pelo percentual informado.</span>' +
      field('Próximo reajuste', 'dormus-renew-next-adjustment', next, 'date', 'required') +
      field('Dia de vencimento', 'dormus-renew-due-day', current.dueDay || '', 'number', 'min="1" max="31" required') +
      selectField('Garantia', 'dormus-renew-guarantee', ['Caução', 'Fiador', 'Seguro-fiança', 'Título de capitalização', 'Sem garantia'], current.guarantee || 'Caução') +
      textArea('Observações da renovação', 'dormus-renew-notes', '') +
      '</div>' +
      '<div id="dormus-renew-error" class="dormus-renewal-error" role="alert"></div>' +
      '<div class="dormus-renewal-summary" id="dormus-renew-summary"></div>' +
      '<section class="dormus-renewal-history"><h3>Histórico preservado</h3>' + historyHtml(contract) + '</section>';
  }
  function formValues() {
    function value(id) { var element = document.getElementById(id); return element ? element.value.trim() : ''; }
    return {
      start: value('dormus-renew-start'),
      end: value('dormus-renew-end'),
      renewalDate: value('dormus-renew-date'),
      index: value('dormus-renew-index'),
      adjustmentPercentage: value('dormus-renew-adjustment'),
      newRent: value('dormus-renew-rent'),
      nextAdjustment: value('dormus-renew-next-adjustment'),
      dueDay: value('dormus-renew-due-day'),
      guarantee: value('dormus-renew-guarantee'),
      notes: value('dormus-renew-notes')
    };
  }
  function showRenewalSummary(contract) {
    var value = formValues();
    var current = currentSnapshot(contract);
    var target = document.getElementById('dormus-renew-summary');
    if (!target) return;
    var oldEnd = current.end ? dateText(current.end) : 'Não informado';
    target.innerHTML = '<div><h3>Antes</h3><dl><dt>Vigência</dt><dd>' + escText(dateText(current.start)) + ' até ' + escText(oldEnd) + '</dd><dt>Aluguel</dt><dd>' + moneyText(current.rent) + '</dd><dt>Índice</dt><dd>' + escText(current.index || 'Não informado') + '</dd><dt>Próximo reajuste</dt><dd>' + escText(dateText(current.adjustment)) + '</dd><dt>Vencimento</dt><dd>Dia ' + escText(current.dueDay || '—') + '</dd><dt>Garantia</dt><dd>' + escText(current.guarantee || 'Não informada') + '</dd></dl></div>' +
      '<div><h3>Depois</h3><dl><dt>Vigência</dt><dd>' + escText(dateText(value.start)) + ' até ' + escText(dateText(value.end)) + '</dd><dt>Novo aluguel</dt><dd>' + moneyText(value.newRent) + '</dd><dt>Índice / ajuste</dt><dd>' + escText(value.index || '—') + ' · ' + escText(value.adjustmentPercentage || '0') + '%</dd><dt>Próximo reajuste</dt><dd>' + escText(dateText(value.nextAdjustment)) + '</dd><dt>Vencimento</dt><dd>Dia ' + escText(value.dueDay || '—') + '</dd><dt>Garantia</dt><dd>' + escText(value.guarantee || 'Não informada') + '</dd></dl></div>';
  }
  function setRenewalError(message) {
    var error = document.getElementById('dormus-renew-error');
    if (error) {
      error.textContent = message || '';
      error.style.display = message ? 'block' : 'none';
    }
  }
  function validateRenewal(contract, value) {
    if (!value.start || !value.end || !value.renewalDate || !value.index || !value.adjustmentPercentage || !value.newRent || !value.nextAdjustment || !value.dueDay || !value.guarantee) {
      return 'Preencha todos os campos obrigatórios da renovação.';
    }
    var start = new Date(value.start + 'T12:00:00');
    var end = new Date(value.end + 'T12:00:00');
    var signed = new Date(value.renewalDate + 'T12:00:00');
    var next = new Date(value.nextAdjustment + 'T12:00:00');
    if ([start, end, signed, next].some(function (date) { return Number.isNaN(date.getTime()); })) return 'Informe datas válidas para a renovação.';
    if (start > end) return 'O início da nova vigência deve ser anterior ou igual ao fim.';
    if (signed > end) return 'A data da renovação não pode ser posterior ao fim da nova vigência.';
    if (next < start) return 'O próximo reajuste deve ocorrer a partir do início da nova vigência.';
    var percentage = Number(value.adjustmentPercentage);
    var rent = Number(value.newRent);
    var due = Number(value.dueDay);
    if (!Number.isFinite(percentage) || percentage < 0) return 'Informe um percentual de ajuste válido.';
    if (!Number.isFinite(rent) || rent < 0) return 'Informe um novo aluguel válido.';
    if (!Number.isInteger(due) || due < 1 || due > 31) return 'O dia de vencimento deve ficar entre 1 e 31.';
    return '';
  }
  function updateCalculatedRent(contract) {
    var percentage = Number(document.getElementById('dormus-renew-adjustment')?.value || 0);
    var rent = Number(contract && contract.rent || 0);
    var input = document.getElementById('dormus-renew-rent');
    var hint = document.getElementById('dormus-renew-calculated');
    if (!input || !Number.isFinite(percentage)) return;
    var calculated = rent * (1 + percentage / 100);
    if (input.dataset.manual !== 'true') input.value = calculated.toFixed(2);
    if (hint) hint.textContent = 'Cálculo sugerido: ' + moneyText(calculated) + '. O novo aluguel pode ser editado.';
    showRenewalSummary(contract);
  }
  function renewalModal(contract) {
    var root = document.getElementById('modal-root');
    if (!root) return;
    root.innerHTML = '<div class="modal-bg" onclick="closeModal(event)"><div class="modal dormus-renewal-modal" onclick="event.stopPropagation()">' +
      '<div class="modal-head"><div><div class="eyebrow">Contrato · renovação</div><h2>Renovar contrato</h2><p class="panel-kicker">' + escText(propertyName(contract)) + ' · ' + escText(tenantName(contract)) + '</p></div><button class="icon" type="button" onclick="closeModal()">×</button></div>' +
      renewalForm(contract) +
      '<div class="modal-actions"><button class="button button-quiet" type="button" onclick="closeModal()">Cancelar</button><button class="button button-brass" type="button" onclick="printDormusRenewalAddendum(\'' + escText(contract.id) + '\')">Imprimir aditivo</button><button class="button button-primary" type="button" onclick="saveDormusRenewal(\'' + escText(contract.id) + '\')">Salvar renovação</button></div>' +
      '</div></div>';
    var adjustment = document.getElementById('dormus-renew-adjustment');
    var rent = document.getElementById('dormus-renew-rent');
    if (adjustment) adjustment.addEventListener('input', function () { if (rent) rent.dataset.manual = 'false'; updateCalculatedRent(contract); });
    if (rent) rent.addEventListener('input', function () { rent.dataset.manual = 'true'; showRenewalSummary(contract); });
    ['dormus-renew-start', 'dormus-renew-end', 'dormus-renew-date', 'dormus-renew-index', 'dormus-renew-next-adjustment', 'dormus-renew-due-day', 'dormus-renew-guarantee', 'dormus-renew-notes'].forEach(function (id) {
      document.getElementById(id)?.addEventListener('input', function () { showRenewalSummary(contract); });
      document.getElementById(id)?.addEventListener('change', function () { showRenewalSummary(contract); });
    });
    updateCalculatedRent(contract);
    showRenewalSummary(contract);
  }
  async function saveRenewal(id) {
    var contract = contractById(id);
    if (!contract) { setRenewalError('Contrato não encontrado.'); return; }
    var value = formValues();
    var problem = validateRenewal(contract, value);
    if (problem) { setRenewalError(problem); return; }
    var before = JSON.stringify(contract);
    var current = currentSnapshot(contract);
    var entry = {
      id: uid(),
      renewalDate: value.renewalDate,
      previousStart: current.start,
      previousEnd: current.end,
      previousRent: current.rent,
      previousIndex: current.index,
      previousAdjustment: current.adjustment,
      previousDueDay: current.dueDay,
      previousGuarantee: current.guarantee,
      start: value.start,
      end: value.end,
      oldRent: current.rent,
      newRent: Number(value.newRent),
      index: value.index,
      adjustmentPercentage: Number(value.adjustmentPercentage),
      nextAdjustment: value.nextAdjustment,
      dueDay: Number(value.dueDay),
      guarantee: value.guarantee,
      notes: value.notes,
      createdAt: new Date().toISOString()
    };
    if (!Array.isArray(contract.renewals)) contract.renewals = [];
    contract.renewals.push(entry);
    contract.start = value.start;
    contract.end = value.end;
    contract.rent = Number(value.newRent);
    contract.index = value.index;
    contract.adjustment = value.nextAdjustment;
    contract.dueDay = Number(value.dueDay);
    contract.guarantee = value.guarantee;
    contract.notes = value.notes ? [contract.notes, value.notes].filter(Boolean).join('\n\n') : contract.notes;
    if (/encerrad|rescind|vencid/i.test(String(contract.status || ''))) contract.status = 'Ativo';
    contract.updatedAt = new Date().toISOString();
    try {
      var saved = await persist();
      if (saved === false) throw new Error('Não foi possível salvar a renovação.');
      closeLegacyModal();
      if (typeof window.renderContracts === 'function') window.renderContracts();
    } catch (error) {
      var original = JSON.parse(before);
      Object.keys(contract).forEach(function (key) {
        if (!Object.prototype.hasOwnProperty.call(original, key)) delete contract[key];
      });
      Object.assign(contract, original);
      setRenewalError(error.message || 'Não foi possível salvar a renovação.');
    }
  }
  function printAddendum(id) {
    var contract = contractById(id);
    if (!contract) return;
    var latest = renewalHistory(contract).slice(-1)[0];
    if (document.getElementById('dormus-renew-start')) {
      var draft = formValues();
      var draftProblem = validateRenewal(contract, draft);
      if (draftProblem) {
        setRenewalError(draftProblem + ' Preencha o formulário para imprimir o aditivo.');
        return;
      }
      var currentDraft = currentSnapshot(contract);
      latest = {
        renewalDate: draft.renewalDate,
        previousStart: currentDraft.start,
        previousEnd: currentDraft.end,
        previousRent: currentDraft.rent,
        previousIndex: currentDraft.index,
        previousAdjustment: currentDraft.adjustment,
        previousDueDay: currentDraft.dueDay,
        previousGuarantee: currentDraft.guarantee,
        start: draft.start,
        end: draft.end,
        newRent: Number(draft.newRent),
        index: draft.index,
        adjustmentPercentage: Number(draft.adjustmentPercentage),
        dueDay: Number(draft.dueDay),
        guarantee: draft.guarantee,
        notes: draft.notes
      };
    }
    if (!latest) {
      alert('Salve a renovação antes de imprimir o aditivo.');
      return;
    }
    var p = (db().properties || []).find(function (x) { return String(x.id) === String(contract.propertyId); }) || {};
    var o = (db().owners || []).find(function (x) { return String(x.id) === String(contract.ownerId); }) || {};
    var t = (db().tenants || []).find(function (x) { return String(x.id) === String(contract.tenantId); }) || {};
    var printArea = document.getElementById('print-area');
    if (!printArea) { alert('Área de impressão não encontrada.'); return; }
    printArea.innerHTML = '<article class="dormus-renewal-print"><header><div class="brand">dormus<small>GESTÃO IMOBILIÁRIA</small></div><div class="meta">ADITIVO DE RENOVAÇÃO<br>Emitido em ' + dateText(today()) + '</div></header>' +
      '<h1>Aditivo de renovação de contrato</h1><p>As partes abaixo registram a renovação das condições de locação mantidas no cadastro do Dormus.</p>' +
      '<div class="dormus-renewal-print-grid"><div><span>Imóvel</span><strong>' + escText(p.name || p.address || 'Não informado') + '</strong></div><div><span>Locador</span><strong>' + escText(o.name || 'Não informado') + '</strong></div><div><span>Locatário</span><strong>' + escText(t.name || 'Não informado') + '</strong></div><div><span>Data da renovação</span><strong>' + dateText(latest.renewalDate) + '</strong></div></div>' +
      '<h2>Condições anteriores e renovadas</h2><table><thead><tr><th>Condição</th><th>Anterior</th><th>Renovada</th></tr></thead><tbody>' +
      '<tr><td>Vigência</td><td>' + dateText(latest.previousStart) + ' até ' + dateText(latest.previousEnd) + '</td><td>' + dateText(latest.start) + ' até ' + dateText(latest.end) + '</td></tr>' +
      '<tr><td>Aluguel mensal</td><td>' + moneyText(latest.previousRent) + '</td><td>' + moneyText(latest.newRent) + '</td></tr>' +
      '<tr><td>Índice e ajuste</td><td>' + escText(latest.previousIndex || 'Não informado') + '</td><td>' + escText(latest.index) + ' · ' + escText(latest.adjustmentPercentage) + '%</td></tr>' +
      '<tr><td>Próximo reajuste</td><td>' + dateText(latest.previousAdjustment) + '</td><td>' + dateText(latest.nextAdjustment) + '</td></tr>' +
      '<tr><td>Vencimento</td><td>Dia ' + escText(latest.previousDueDay || '—') + '</td><td>Dia ' + escText(latest.dueDay) + '</td></tr>' +
      '<tr><td>Garantia</td><td>' + escText(latest.previousGuarantee || 'Não informado') + '</td><td>' + escText(latest.guarantee) + '</td></tr></tbody></table>' +
      '<h2>Observações</h2><p>' + escText(latest.notes || 'Nenhuma observação informada.') + '</p><div class="signatures"><div class="signature">Locador / representante</div><div class="signature">Locatário / representante</div></div></article>';
    document.body.classList.add('dormus-printing-renewal');
    setTimeout(function () {
      window.print();
      setTimeout(function () { printArea.innerHTML = ''; document.body.classList.remove('dormus-printing-renewal'); }, 900);
    }, 80);
  }

  function addRenewalButton(container, id) {
    if (!container || container.querySelector('[data-dormus-renew="' + id + '"]')) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'button button-small button-brass dormus-renewal-action';
    button.dataset.dormusRenew = id;
    button.textContent = 'Renovar';
    button.title = 'Registrar uma renovação para este contrato';
    container.appendChild(button);
  }
  function decorateContractList() {
    document.querySelectorAll('#contracts-list tr').forEach(function (row) {
      var action = row.querySelector('.actions');
      if (!action) return;
      var existing = action.querySelector('[onclick*="openPresentation(\'contract\'"]');
      var id = existing && existing.getAttribute('onclick').match(/contract','([^']+)/);
      if (id) addRenewalButton(action, id[1]);
    });
  }
  function decorateContractPresentation(id) {
    var root = document.getElementById('modal-root');
    if (!root) return;
    var actionArea = root.querySelector('.contract360-actions') || root.querySelector('.presentation-actions');
    if (actionArea) addRenewalButton(actionArea, id);
  }
  function wrapPresentation() {
    if (window.__dormusRenewalPresentationWrapped || typeof window.openPresentation !== 'function') return;
    window.__dormusRenewalPresentationWrapped = true;
    var original = window.openPresentation;
    window.openPresentation = function (kind, id) {
      var result = original.apply(this, arguments);
      if (kind === 'contract') {
        setTimeout(function () { decorateContractPresentation(id); }, 0);
        setTimeout(function () { decorateContractPresentation(id); }, 120);
      }
      return result;
    };
  }
  function wrapContractRenderer() {
    if (window.__dormusRenewalRendererWrapped || typeof window.renderContracts !== 'function') return;
    window.__dormusRenewalRendererWrapped = true;
    var original = window.renderContracts;
    window.renderContracts = function () {
      var result = original.apply(this, arguments);
      decorateContractList();
      return result;
    };
    decorateContractList();
  }
  function observeContractList() {
    var list = document.getElementById('contracts-list');
    if (!list || list.__dormusRenewalObserver) return;
    var observer = new MutationObserver(function () { decorateContractList(); });
    observer.observe(list, { childList: true, subtree: true });
    list.__dormusRenewalObserver = observer;
    decorateContractList();
  }
  function installLogoChooser() {
    if (document.getElementById('dormus-logo-launch')) return;
    var target = document.querySelector('.top-actions') || document.querySelector('.top');
    if (!target) return;
    var launch = document.createElement('button');
    launch.id = 'dormus-logo-launch';
    launch.type = 'button';
    launch.className = 'icon dormus-logo-launch';
    launch.textContent = 'Marca';
    launch.title = 'Escolher identidade do aplicativo';
    target.appendChild(launch);
    var picker = document.createElement('aside');
    picker.className = 'dormus-logo-picker';
    picker.id = 'dormus-logo-picker';
    picker.hidden = true;
    picker.setAttribute('aria-label', 'Escolha da identidade do aplicativo');
    picker.innerHTML = '<div class="dormus-logo-picker-head"><div><strong>Identidade do aplicativo</strong><span>A escolha fica salva neste aparelho.</span></div><button class="dormus-logo-picker-close" type="button" aria-label="Fechar">×</button></div><div class="dormus-logo-options">' +
      Object.keys(LOGOS).map(function (id) {
        var logo = LOGOS[id];
        return '<button type="button" class="dormus-logo-option" data-dormus-logo="' + id + '"><span class="dormus-logo-preview"><img src="' + logo.preview + '" alt="Logo ' + logo.name + '"></span><span><strong>' + logo.name + '</strong><small>' + logo.description + '</small></span></button>';
      }).join('') + '</div><p class="dormus-logo-picker-note"><strong>Manifesto PWA:</strong> a identidade escolhida também será usada na instalação do aplicativo.</p>';
    document.body.appendChild(picker);
    function applyLogo(id) {
      if (!LOGOS[id]) id = 'classic';
      localStorage.setItem(LOGO_KEY, id);
      var manifest = document.querySelector('link[rel="manifest"]');
      if (manifest) manifest.setAttribute('href', LOGOS[id].manifest);
      var favicon = document.querySelector('link[rel="icon"]');
      if (favicon) favicon.setAttribute('href', LOGOS[id].preview);
      var apple = document.querySelector('link[rel="apple-touch-icon"]');
      if (!apple) {
        apple = document.createElement('link');
        apple.rel = 'apple-touch-icon';
        document.head.appendChild(apple);
      }
      apple.setAttribute('href', LOGOS[id].icon);
      picker.querySelectorAll('[data-dormus-logo]').forEach(function (option) {
        option.classList.toggle('is-selected', option.dataset.dormusLogo === id);
        option.setAttribute('aria-pressed', option.dataset.dormusLogo === id ? 'true' : 'false');
      });
    }
    launch.addEventListener('click', function (event) {
      event.stopPropagation();
      picker.hidden = !picker.hidden;
    });
    picker.querySelector('.dormus-logo-picker-close').addEventListener('click', function () { picker.hidden = true; });
    picker.querySelectorAll('[data-dormus-logo]').forEach(function (option) {
      option.addEventListener('click', function () {
        applyLogo(option.dataset.dormusLogo);
        picker.hidden = false;
      });
    });
    document.addEventListener('click', function (event) {
      if (!picker.hidden && !picker.contains(event.target) && event.target !== launch) picker.hidden = true;
    });
    applyLogo(localStorage.getItem(LOGO_KEY) || 'classic');
  }

  window.openDormusRenewal = function (id) {
    var contract = contractById(id);
    if (contract) renewalModal(contract);
  };
  window.saveDormusRenewal = saveRenewal;
  window.printDormusRenewalAddendum = printAddendum;
  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('[data-dormus-renew]');
    if (button) {
      event.preventDefault();
      event.stopPropagation();
      window.openDormusRenewal(button.dataset.dormusRenew);
    }
  }, true);

  function boot() {
    wrapPresentation();
    wrapContractRenderer();
    observeContractList();
    installLogoChooser();
    decorateContractList();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
  var attempts = 0;
  var timer = setInterval(function () {
    boot();
    attempts += 1;
    if (attempts > 24) clearInterval(timer);
  }, 500);
})();