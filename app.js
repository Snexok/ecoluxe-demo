(function () {
  'use strict';
  const M = window.EcoModel;
  const STORAGE = 'ecoluxe-demo-v2';
  const stages = ['production', 'ready', 'scheduled', 'delivered', 'installation', 'accepted'];
  const labels = { production: 'В производстве', ready: 'Готов к выезду', scheduled: 'Выезд назначен', delivered: 'Доставлен', installation: 'На сборке', accepted: 'Принят' };
  const shortLabels = ['Производство', 'Комплект', 'Доставка', 'На объекте', 'Сборка', 'Приёмка'];
  const pages = { overview: 'Обзор', orders: 'Заказы', comms: 'Коммуникации', production: 'Производство', delivery: 'Доставка', assembly: 'Сборка', system: 'Дизайн-система' };
  const roleLabels = { client: 'Клиент', manager: 'Менеджер', production: 'Производство', logistics: 'Логистика', crew: 'Бригада' };
  const channelLabels = { hub: 'Центр', whatsapp: 'WhatsApp', call: 'Звонок', email: 'Email' };
  const paths = {
    overview: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    orders: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v3h6V3M9 11h6M9 15h6"/>',
    production: '<path d="m3 9 9-5 9 5-9 5-9-5Zm0 0v10l9 4 9-4V9M12 14v9M7.5 6.5l9 5" transform="translate(0 -2)"/>',
    delivery: '<path d="M2 6h12v12H2zM14 10h4l4 4v4h-8M17 10v4h5"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    assembly: '<path d="m14 6 4-3 3 3-3 4-3-1-9 12-3-3 11-9-1-3ZM3 3l4 1 2 4-2 2-4-2V3M15 15l6 6"/>',
    system: '<circle cx="8" cy="8" r="5"/><rect x="12" y="12" width="9" height="9" rx="2"/><path d="M5 17h4M7 15v4M16 5h4M18 3v4"/>',
    comms: '<path d="M4 6h11a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H10l-4 3v-3H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/><path d="M9 11h6M9 8h4"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    alert: '<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3v.1"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-12 4h2m3 0h2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    reset: '<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>'
  };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.orders}</svg>`;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);
  const date = (d, long = false) => new Date(`${d}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: long ? 'long' : 'short' }).replace('.', '');
  const title = order => order.name.replace(/^Кухня /, '');
  const photo = order => `assets/kitchen-${['ЭК-1050', 'ЭК-1051'].includes(order.id) ? 'dark' : 'light'}.jpg`;
  const badge = stage => `<span class="badge ${stage}">${labels[stage]}</span>`;
  const countStage = stage => state.orders.filter(o => o.stage === stage).length;
  let state = M.createState();
  let loadNotice = '';
  try {
    const saved = localStorage.getItem(STORAGE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (M.validateState(parsed)) state = parsed;
        else loadNotice = 'Сохранённые данные не прошли проверку. Загружено исходное демо.';
      } catch (_) { loadNotice = 'Сохранённые данные повреждены. Загружено исходное демо.'; }
    }
  } catch (_) { loadNotice = 'Локальное сохранение недоступно. Демо работает до закрытия страницы.'; }
  const ui = { page: 'overview', search: '', filter: 'all', overviewFilter: 'all', selected: null, commsOrderId: 'ЭК-1048', commsMobileShowThread: false, composeRole: 'manager' };
  const app = document.querySelector('#app');
  const detail = document.querySelector('#detail');
  let toastTimer;

  function toast(text, error = false) {
    const target = document.querySelector('#toast');
    target.textContent = text;
    target.className = `toast show${error ? ' error' : ''}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { target.className = 'toast'; }, 4200);
  }

  function persist() {
    try { localStorage.setItem(STORAGE, JSON.stringify(state)); return true; }
    catch (_) { return false; }
  }

  function render() {
    const unread = M.getUnreadCount(state);
    const nav = Object.entries(pages).map(([key, label]) => {
      let badge = '';
      if (key === 'orders') badge = `<span class="nav-count">${state.orders.length}</span>`;
      if (key === 'comms' && unread) badge = `<span class="nav-count unread">${unread}</span>`;
      return `<a href="#${key}" class="${ui.page === key ? 'active' : ''}" ${ui.page === key ? 'aria-current="page"' : ''}>${icon(key)}<span>${label}</span>${badge}</a>`;
    });
    const mainNav = nav.slice(0, -1).join('');
    const systemNav = nav[nav.length - 1];
    app.innerHTML = `<div class="shell">
      <button class="mobile-scrim" data-command="menu-close" aria-label="Закрыть меню"></button>
      <aside class="sidebar"><a href="#overview" class="brand" aria-label="ЭКОЛЮКС — обзор"><span class="brand-mark">Э</span><div><div class="brand-name">ЭКОЛЮКС</div><div class="brand-sub">Рабочее пространство</div></div></a><div class="nav-label">Управление заказами</div><nav class="nav" aria-label="Главное меню">${mainNav}</nav><div class="sidebar-bottom"><nav class="nav" aria-label="Материалы концепта">${systemNav}</nav><div class="sidebar-note"><span class="eyebrow">Одна кухня. Весь путь.</span><p>От готового комплекта<br>до последней регулировки.</p><button class="text-link" data-command="about">О концепте ${icon('arrow')}</button></div><div class="profile"><span class="avatar">Э</span><div><strong>Команда ЭКОЛЮКС</strong><p>Демонстрационный доступ</p></div></div></div></aside>
      <div class="workspace"><header class="topbar"><div class="breadcrumbs"><button class="icon-button mobile-menu" data-command="menu" aria-label="Открыть меню" aria-expanded="false">${icon('menu')}</button><span>Рабочее пространство</span><span class="separator">/</span><span>${pages[ui.page]}</span></div><div class="topbar-actions"><span class="topbar-date">Сценарий · сентябрь 2026</span><span class="pill dot">Концепт · тестовые данные</span><button class="icon-button" data-command="reset" aria-label="Сбросить демо" title="Сбросить демо">${icon('reset')}</button></div></header><main id="main" class="main" tabindex="-1">${renderPage()}<footer class="workspace-footer"><span>ЭКОЛЮКС / Концепция управления производством, доставкой и сборкой</span><span>Все заказы вымышлены · прогресс сохраняется в этом браузере</span></footer></main></div></div>`;
    document.title = `${pages[ui.page]} · ЭКОЛЮКС`;
    syncMenuAccessibility();
  }

  function heading(kicker, headingText, subtitle, action = '') {
    return `<div class="page-heading"><div><span class="eyebrow">${kicker}</span><h1>${headingText}</h1><p>${subtitle}</p></div>${action}</div>`;
  }

  function renderPage() {
    switch (ui.page) {
      case 'orders': return renderOrders();
      case 'comms': return renderComms();
      case 'production': return renderProduction();
      case 'delivery': return renderDelivery();
      case 'assembly': return renderAssembly();
      case 'system': return renderSystem();
      default: return renderOverview();
    }
  }

  function readiness(order) {
    const r = M.getReadiness(order);
    return `<div class="progress-text"><div class="progress ${r.ready ? '' : 'warn'}"><span style="width:${100 * r.done / r.total}%"></span></div><span>${r.done}/${r.total}</span></div>`;
  }

  function orderTable(orders, full = false) {
    if (!orders.length) return `<div class="empty">${icon('search')}<h3>Таких заказов пока нет</h3><p>Попробуйте другой запрос или снимите фильтр.</p><button class="button" data-command="clear-filters">Сбросить фильтры</button></div>`;
    return `<table class="order-table"><caption class="visually-hidden">Демонстрационные заказы</caption><thead><tr><th scope="col">Заказ / проект</th><th scope="col">Комплектность</th><th scope="col">Этап</th><th scope="col">${full ? 'Срок / сумма' : 'Срок'}</th></tr></thead><tbody>${orders.map(o => `<tr><td><div class="order-cell"><img class="order-thumb" src="${photo(o)}" alt="" loading="lazy"><div><div class="order-id">${o.id}</div><button class="order-name" data-order="${o.id}">${esc(title(o))}</button><div class="order-meta">${esc(full ? o.client : o.district)}</div></div></div></td><td>${readiness(o)}</td><td>${badge(o.stage)}</td><td><div class="date-cell">${date(o.due)}<small>${full ? money(o.amount) : 'по плану'}</small></div></td></tr>`).join('')}</tbody></table>`;
  }

  function renderOverview() {
    const s = M.getStats(state);
    const main = state.orders.find(o => o.id === 'ЭК-1048');
    const incomplete = state.orders.filter(o => !M.getReadiness(o).ready).length;
    const metrics = [
      ['orders', 'В работе', s.active, 'из 6 демонстрационных заказов', ''],
      ['production', 'Готовы к выезду', s.ready, '<em>Комплектность подтверждена</em>', ''],
      ['comms', 'Открытые диалоги', s.openDialogs, s.unreadComms ? `<em><a class="metric-link" href="#comms">Непрочитанных: ${s.unreadComms}</a></em>` : '<em><a class="metric-link" href="#comms">Единый центр по заказу</a></em>', ''],
      ['alert', 'Требуют внимания', state.orders.filter(o => !M.getReadiness(o).ready || o.issues.some(i => !i.resolved)).length, `<em>Комплектация: ${incomplete} · замечания: ${s.issues}</em>`, 'attention']
    ];
    const r = M.getReadiness(main);
    const list = state.orders.filter(o => ui.overviewFilter === 'all' ? o.stage !== 'accepted' : ui.overviewFilter === 'production' ? o.stage === 'production' : !M.getReadiness(o).ready || o.issues.some(i => !i.resolved));
    const visits = state.orders.filter(o => o.stage === 'scheduled').sort((a, b) => a.schedule.date.localeCompare(b.schedule.date)).slice(0, 2);
    const nextText = { production: r.ready ? 'Комплект собран' : `Ожидаем: ${main.parts.filter(p => !p.ready).map(p => p.name.toLocaleLowerCase('ru')).join(', ')}`, ready: 'Можно назначать выезд', scheduled: 'Выезд запланирован', delivered: 'Кухня уже на объекте', installation: 'Сборка в процессе', accepted: 'Работа принята' }[main.stage];
    return `${heading('От производства до приёмки', 'Всё складывается в кухню.', 'Заказы, комплекты и выезды — в одном рабочем пространстве.', `<button class="button primary" data-order="ЭК-1048">Пройти сценарий ${icon('arrow')}</button>`)}
      <section class="metrics" aria-label="Показатели демонстрационных заказов">${metrics.map(([i, l, n, f, c]) => `<div class="metric ${c}"><div class="metric-label">${l}${icon(i)}</div><div class="metric-value">${String(n).padStart(2, '0')}</div><div class="metric-foot">${f}</div></div>`).join('')}</section>
      <div class="overview-grid"><div class="left-column"><section class="panel route-panel"><div class="panel-head"><h2>Маршрут заказа</h2><span class="caption">Один процесс, пять этапов</span></div><div class="route-strip">${[['Производство', countStage('production')], ['Комплект готов', countStage('ready')], ['Доставка', countStage('scheduled') + countStage('delivered')], ['Сборка', countStage('installation')], ['Приёмка', countStage('accepted')]].map(([l, n], i) => `<div class="route-node"><span class="route-number">${String(i + 1).padStart(2, '0')}</span><strong>${l}</strong><small>Заказов: ${n}</small></div>`).join('')}</div></section>
      <section class="panel"><div class="panel-head"><h2>Заказы в работе <span class="count">${s.active}</span></h2><a class="text-link" href="#orders">Все заказы ${icon('arrow')}</a></div><div class="order-list-head"><div class="filter-chips">${[['all', 'Все в работе'], ['production', 'Производство'], ['attention', 'Требуют внимания']].map(([key, l]) => `<button class="chip ${ui.overviewFilter === key ? 'active' : ''}" data-overview-filter="${key}" aria-pressed="${ui.overviewFilter === key}">${l}</button>`).join('')}</div></div>${orderTable(list)}<div class="table-footer"><span>Показано: ${list.length} · изменения сохраняются</span><button class="text-link" data-order="ЭК-1048">Открыть главный заказ ↗</button></div></section>
      <section class="panel"><div class="panel-head"><h2>Ближайшие выезды</h2><a class="text-link" href="#delivery">План выездов ${icon('arrow')}</a></div><div class="agenda">${visits.length ? visits.map(o => `<div class="agenda-item"><div class="agenda-date">${new Date(`${o.schedule.date}T12:00`).getDate()}<small>${new Date(`${o.schedule.date}T12:00`).toLocaleDateString('ru-RU', { month: 'short' })}</small></div><div><h3>${esc(o.schedule.crew)} · ${o.schedule.time}</h3><p>${esc(title(o))} / ${esc(o.district)}</p><button class="text-link" data-order="${o.id}">${o.id} ↗</button></div></div>`).join('') : '<div class="empty">Выездов в работе нет. Готовым заказам можно назначить доставку.</div>'}</div></section></div>
      <aside class="right-column" aria-label="Фокус внимания"><section class="focus-card"><div class="focus-photo"><img src="${photo(main)}" alt="Кухня из каталога ЭКОЛЮКС, иллюстрация концепта"><span class="photo-label">Заказ в фокусе</span><span class="photo-number">${main.id}</span></div><div class="focus-body"><span class="eyebrow">От детали до результата</span><h2>${esc(title(main))}</h2><p>${esc(main.material)}<br>${esc(main.dimensions)} · ${esc(main.district)}</p><div class="focus-warning">${icon(main.stage === 'accepted' ? 'checkCircle' : 'clock')}<div>${nextText}<small>${main.stage === 'production' ? `Готово ${r.done} из ${r.total} групп комплекта` : labels[main.stage]}</small></div></div><button class="button light" data-order="ЭК-1048">Открыть заказ ${icon('arrow')}</button></div></section><section class="panel mini-panel"><h3>Без потерь между этапами</h3><p>Цех подтверждает комплект.<br>Логист назначает выезд.<br>Бригада закрывает работы.</p><div class="team-row"><div class="team-avatars"><span class="avatar">Ц</span><span class="avatar">Л</span><span class="avatar">С</span></div><span class="caption">Общий статус<br>для всей команды</span></div></section><section class="panel mini-panel comms-teaser"><h3>Открытые диалоги</h3><p>Один заказ — одна лента. Менеджер, цех, логистика и клиент пишут в контексте этапа.</p><a class="text-link" href="#comms">Открыть центр коммуникаций ${icon('arrow')}</a>${s.unreadComms ? `<p class="caption" style="margin-top:12px">Непрочитанных: ${s.unreadComms}</p>` : ''}</section></aside></div>`;
  }

  function filteredOrders() {
    const q = ui.search.trim().toLocaleLowerCase('ru');
    return state.orders.filter(o => (ui.filter === 'all' || o.stage === ui.filter) && `${o.id} ${o.name} ${o.client} ${o.district}`.toLocaleLowerCase('ru').includes(q));
  }

  function renderOrders() {
    return `${heading('Единая карточка проекта', 'Каждый заказ на виду.', 'Комплект, сроки, выезд и сборка связаны с одним проектом.')}<div class="toolbar"><label class="search">${icon('search')}<input id="order-search" type="search" value="${esc(ui.search)}" placeholder="Номер, кухня или клиент" aria-label="Поиск заказов"></label><select id="status-filter" class="filter-select" aria-label="Фильтр по этапу"><option value="all">Все этапы</option>${stages.map(s => `<option value="${s}" ${ui.filter === s ? 'selected' : ''}>${labels[s]}</option>`).join('')}</select><span class="caption" id="result-count">Найдено: ${filteredOrders().length}</span></div><section id="filter-results" class="panel full-table">${orderTable(filteredOrders(), true)}</section>`;
  }


  function formatMsgTime(iso) {
    return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function channelChip(channel) {
    if (channel === 'hub') return '';
    return `<span class="channel-chip ${channel}">${channelLabels[channel] || channel}</span>`;
  }

  function renderMessageBubble(m) {
    if (m.kind === 'system') {
      return `<div class="comms-system"><span>${esc(m.text)}</span><time>${formatMsgTime(m.time)}</time></div>`;
    }
    const side = m.role === 'client' ? 'client' : 'internal';
    return `<article class="comms-bubble ${side} role-${m.role}"><div class="comms-bubble-meta"><strong>${esc(m.author)}</strong><span class="role-tag">${roleLabels[m.role] || m.role}</span>${channelChip(m.channel)}<time>${formatMsgTime(m.time)}</time></div><p>${esc(m.text)}</p></article>`;
  }

  function renderComms() {
    const threads = M.getThreadMeta(state);
    if (!ui.commsOrderId || !threads.some(t => t.orderId === ui.commsOrderId)) {
      ui.commsOrderId = threads[0]?.orderId || null;
    }
    const active = threads.find(t => t.orderId === ui.commsOrderId) || null;
    const mobileClass = ui.commsMobileShowThread && active ? 'show-thread' : '';
    const list = threads.length ? threads.map(t => {
      const preview = t.last.kind === 'system' ? t.last.text : `${roleLabels[t.last.role] || ''}: ${t.last.text}`;
      return `<button type="button" class="comms-thread ${t.orderId === ui.commsOrderId ? 'active' : ''}" data-comms-thread="${t.orderId}"><div class="comms-thread-top"><span class="mono">${t.orderId}</span>${badge(t.order.stage)}${t.unread ? `<span class="unread-dot" title="Непрочитано">${t.unread}</span>` : ''}</div><strong>${esc(title(t.order))}</strong><p>${esc(preview.slice(0, 110))}${preview.length > 110 ? '…' : ''}</p></button>`;
    }).join('') : '<div class="empty"><h3>Диалогов пока нет</h3><p>Сообщения появятся вместе с активными заказами.</p></div>';

    const threadPane = active ? `<div class="comms-thread-pane"><div class="comms-thread-head"><button type="button" class="button small comms-back" data-command="comms-back">${icon('arrow')} К списку</button><div><span class="mono">${active.orderId}</span><h2>${esc(title(active.order))}</h2><p>${esc(active.order.client)} · ${labels[active.order.stage]}</p></div><button type="button" class="button small" data-order="${active.orderId}">Карточка заказа</button></div><div class="comms-messages" id="comms-messages">${active.messages.map(renderMessageBubble).join('')}</div><form id="comms-form" class="comms-composer" data-comms-order="${active.orderId}"><label class="field compose-role">От имени<select name="role" id="comms-role">${Object.entries(roleLabels).map(([k, l]) => `<option value="${k}" ${ui.composeRole === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label><label class="field compose-text">Сообщение<textarea name="text" id="comms-text" rows="2" maxlength="800" required placeholder="Ответ в единый центр по заказу…"></textarea></label><button class="button primary" type="submit">Отправить в центр</button><p class="caption">Новые ответы всегда идут через хаб · без WhatsApp и звонков</p></form></div>` : '<div class="comms-thread-pane empty"><h3>Выберите диалог</h3><p>Слева — ленты по заказам.</p></div>';

    return `${heading('Единый центр коммуникаций', 'Один заказ — одна лента.', 'Производство, доставка, монтаж и клиент в одном месте.', `<a class="button" href="#orders">К заказам ${icon('arrow')}</a>`)}
      <div class="callout comms-callout">${icon('comms')}<div><h3>Раньше: звонки и WhatsApp → Теперь: единый центр по карточке заказа</h3><p>История ЭК-1048 показывает, как вопрос клиента из мессенджера попадает в хаб и дальше виден цеху и логистике в контексте этапа.</p></div></div>
      <div class="comms-layout ${mobileClass}"><aside class="panel comms-list" aria-label="Список диалогов"><div class="panel-head"><h2>Диалоги <span class="count">${threads.length}</span></h2>${M.getUnreadCount(state) ? `<span class="pill"> непрочитано: ${M.getUnreadCount(state)}</span>` : ''}</div><div class="comms-thread-list">${list}</div></aside>${threadPane}</div>`;
  }

  function renderProduction() {
    const groups = [ ['В цехе', ['production']], ['Готовы к выезду', ['ready']], ['Доставка и сборка', ['scheduled', 'delivered', 'installation']] ];
    return `${heading('Производство и комплектация', 'Сначала — полный комплект.', 'Готовность отмечается по группам деталей в карточке заказа.')}<div class="callout">${icon('production')}<div><h3>Выпуск после проверки комплектности</h3><p>Кухня попадёт в план доставки, когда цех подтвердит каждую позицию. В демо начните с фасадов заказа ЭК-1048.</p></div></div><div class="board">${groups.map(([name, group]) => { const orders = state.orders.filter(o => group.includes(o.stage)); return `<section class="board-column"><div class="board-column-head"><h2>${name}</h2><span class="count">${orders.length}</span></div>${orders.length ? orders.map(o => { const r = M.getReadiness(o); return `<button class="work-card" data-order="${o.id}"><div class="work-card-top"><span class="mono">${o.id}</span>${badge(o.stage)}</div><h3>${esc(title(o))}</h3><p>${esc(o.material)}</p><div class="progress ${r.ready ? '' : 'warn'}"><span style="width:${100 * r.done / r.total}%"></span></div><p>${r.ready ? 'Комплект подтверждён' : `Готово ${r.done} из ${r.total} групп`}</p><div class="work-card-bottom"><span>${esc(o.owner)}</span><span>до ${date(o.due)}</span></div></button>`; }).join('') : '<div class="board-empty">На этом этапе заказов нет</div>'}</section>`; }).join('')}</div>`;
  }

  function visitRow(o) {
    return `<div class="schedule-row"><span class="avatar">${o.schedule ? o.schedule.time.slice(0, 2) : icon('delivery')}</span><div class="schedule-row-info"><span class="order-id">${o.id}</span><h3>${esc(title(o))}</h3><p>${o.schedule ? `${date(o.schedule.date, true)} · ${o.schedule.time} · ${esc(o.schedule.crew)}` : `${esc(o.district)} · полный комплект`}</p>${badge(o.stage)}</div><button class="button small" data-order="${o.id}">${o.stage === 'ready' ? 'Назначить' : 'Открыть'} ${icon('arrow')}</button></div>`;
  }

  function renderDelivery() {
    const ready = state.orders.filter(o => o.stage === 'ready');
    const scheduled = state.orders.filter(o => o.schedule && o.stage !== 'accepted').sort((a, b) => `${a.schedule.date}${a.schedule.time}`.localeCompare(`${b.schedule.date}${b.schedule.time}`));
    return `${heading('Доставка и выездные работы', 'Всё готово к отправке.', 'Планируйте выезд и передавайте готовый заказ монтажной бригаде.')}<div class="split-view"><section class="panel"><div class="panel-head"><h2>Выезды в работе <span class="count">${scheduled.length}</span></h2>${icon('calendar')}</div>${scheduled.length ? scheduled.map(visitRow).join('') : '<div class="empty">Выезды ещё не назначены</div>'}</section><div><div class="callout">${icon('checkCircle')}<div><h3>Проверка перед назначением</h3><p>Полный комплект, дата и время, свободная бригада. Совпадающее время одной бригады будет заблокировано.</p></div></div><section class="panel"><div class="panel-head"><h2>Ожидают назначения <span class="count">${ready.length}</span></h2></div>${ready.length ? ready.map(visitRow).join('') : '<div class="empty">Нет готовых заказов без выезда.<br>Проверьте комплекты в производстве.</div>'}</section></div></div>`;
  }

  function renderAssembly() {
    const orders = state.orders.filter(o => ['delivered', 'installation', 'accepted'].includes(o.stage)).sort((a, b) => (a.stage === 'accepted') - (b.stage === 'accepted'));
    return `${heading('Рабочее место монтажника', 'Последние детали. Готовая кухня.', 'Задание, чек-лист и замечания доступны с телефона.')}<div class="assembly-grid">${orders.length ? orders.map(o => { const done = o.installation.filter(i => i.done).length; return `<section class="panel assembly-card"><img class="assembly-photo" src="${photo(o)}" alt="Кухня из каталога, иллюстрация задания"><div class="assembly-body"><div class="section-heading"><span class="mono">${o.id}</span>${badge(o.stage)}</div><h2>${esc(title(o))}</h2><p>${esc(o.district)} · ${esc(o.address)}</p><div class="assembly-meta"><div><span class="caption">Работы: ${done}/${o.installation.length}</span><div class="progress"><span style="width:${100 * done / o.installation.length}%"></span></div></div><span class="caption">${esc(o.schedule.crew)}<br>${date(o.schedule.date)} · ${o.schedule.time}</span></div><button class="button ${o.stage === 'accepted' ? '' : 'primary'}" data-order="${o.id}">${o.stage === 'accepted' ? 'Посмотреть результат' : 'Открыть задание'} ${icon('arrow')}</button></div></section>`; }).join('') : '<div class="panel empty">Задания появятся после доставки кухни на объект.</div>'}</div>`;
  }

  function renderSystem() {
    const swatches = [['Бумага', '#f6f4ef'], ['Поверхность', '#ffffff'], ['Графит', '#292b28'], ['Тёмный акцент', '#30352e'], ['Золото', '#c7a36c'], ['Готовность', '#456449']];
    return `${heading('Основа интерфейса · версия 1.0', 'Спокойная форма. Ясный процесс.', 'Дизайн-система рабочего пространства ЭКОЛЮКС.')}<p class="ds-message">Тёплая палитра и акцентная антиква продолжают визуальный язык сайта. В рабочем интерфейсе на первом месте статус, следующий шаг и читаемость. Это предложение для продукта, а не официальный брендбук компании.</p><div class="ds-grid"><section class="panel"><span class="eyebrow">01 / Цвет</span><h2>Материальная палитра</h2><div class="swatches">${swatches.map(([name, color]) => `<div class="swatch"><div class="swatch-color" style="background:${color}"></div><strong>${name}</strong><small>${color}</small></div>`).join('')}</div><p class="caption">Золото — декоративный акцент. Основные действия и текст используют контрастный графит.</p></section><section class="panel"><span class="eyebrow">02 / Типографика</span><h2>Характер и порядок</h2><div class="type-serif">Всё складывается<br>в кухню.</div><p class="caption">Georgia · заголовок страницы · 38/45</p><div class="type-sans">Статус понятен с первого взгляда</div><p class="caption">Системный sans-serif · интерфейс · 12–18 px</p><p class="mono" style="margin-top:20px">ЭК-1048 / 28 СЕН / 04:05</p></section><section class="panel"><span class="eyebrow">03 / Этапы</span><h2>Цвет всегда сопровождает текст</h2><div class="ds-statuses">${stages.map(badge).join('')}</div><p class="caption">Шесть состояний связывают пять рабочих этапов. Доставка отдельно подтверждает прибытие на объект.</p><div style="margin-top:22px" class="notice">${icon('alert')}<span>Не хватает одной группы комплекта</span></div><div style="margin-top:12px" class="notice success">${icon('checkCircle')}<span>Все позиции проверены. Можно назначать выезд.</span></div></section><section class="panel"><span class="eyebrow">04 / Компоненты</span><h2>Одинаковое действие — одинаковая форма</h2><div class="ds-components"><div class="button-row"><button class="button primary" data-order="ЭК-1048">Открыть заказ ${icon('arrow')}</button><button class="button" data-command="about">О концепте</button><button class="button" disabled>Недоступно</button></div><label class="field">Поле ввода<input placeholder="Название проекта" aria-label="Пример поля ввода"></label><label class="check-row"><input type="checkbox"><span>Пример выполненной проверки</span></label></div></section><section class="panel"><span class="eyebrow">05 / Ритм</span><h2>Сетка и пространство</h2><div class="spacing-scale">${[4, 8, 16, 24, 32].map(n => `<div><i style="height:${n * 2}px"></i>${n} px</div>`).join('')}</div><p class="caption">Радиусы 8 / 12 / 16 px. Страница адаптируется к телефону; задание монтажника читается одной колонкой.</p></section><section class="panel"><span class="eyebrow">06 / Поведение</span><h2>Понятно, что происходит</h2><div class="properties"><div class="property"><span>Фокус</span><strong>Видимая рамка при Tab</strong></div><div class="property"><span>Ошибки</span><strong>Текст рядом с действием</strong></div><div class="property"><span>Пустой список</span><strong>Причина и сброс фильтра</strong></div><div class="property"><span>Прогресс</span><strong>Сохраняется локально</strong></div><div class="property"><span>Движение</span><strong>Учитывает reduced motion</strong></div></div><p class="caption">Интерактивные образцы используют те же компоненты, что и основные экраны.</p></section></div>`;
  }

  function actionSection(order) {
    const r = M.getReadiness(order);
    if (order.stage === 'production') return `<section class="detail-section"><h3>Комплектность <span class="count">${r.done}/${r.total}</span></h3>${!r.ready ? `<div class="notice">${icon('alert')}<p>Подтвердите недостающие позиции перед передачей заказа в доставку.</p></div>` : `<div class="notice success">${icon('checkCircle')}<p>Комплект собран. Подтвердите готовность кухни.</p></div>`}${order.parts.map(p => `<label class="check-row"><input id="part-${p.id}" type="checkbox" data-part="${p.id}" ${p.ready ? 'checked' : ''}><span>${esc(p.name)}</span><small>${p.qty} шт.</small></label>`).join('')}<div class="button-row"><button class="button primary" data-action="finish-production" ${r.ready ? '' : 'disabled'}>Подтвердить готовность ${icon('arrow')}</button></div>${!r.ready ? '<p class="help">Кнопка станет доступна после проверки всех позиций.</p>' : ''}</section>`;
    if (order.stage === 'ready') return `<section class="detail-section"><h3>Назначить выезд</h3><div class="notice success">${icon('checkCircle')}<p>Полный комплект подтверждён: ${r.done} из ${r.total} групп.</p></div><form id="schedule-form"><div class="form-grid"><label class="field">Дата<input name="date" type="date" min="2026-09-21" value="2026-09-24" required></label><label class="field">Время<input name="time" type="time" value="10:00" required></label></div><label class="field">Монтажная бригада<select name="crew" required><option value="Бригада «Север»">Бригада «Север»</option><option value="Бригада «Восток»">Бригада «Восток»</option><option value="Бригада «Юг»">Бригада «Юг»</option></select></label><p class="help">Бригада получает заказ с комплектом и адресом. В демо проверяется совпадение времени одной бригады.</p><div class="button-row"><button class="button primary" type="submit">Назначить выезд ${icon('arrow')}</button></div><p class="status-message" id="form-error" role="alert"></p></form></section>`;
    if (order.stage === 'scheduled') return `<section class="detail-section"><h3>Выезд назначен</h3>${scheduleSummary(order)}<div class="button-row"><button class="button primary" data-action="deliver">Подтвердить доставку ${icon('check')}</button></div><p class="help">Подтвердите после передачи комплекта на объект. Для демо можно выполнить действие сейчас.</p></section>`;
    if (order.stage === 'delivered') return `<section class="detail-section"><h3>Комплект на объекте</h3><div class="notice success">${icon('checkCircle')}<p>Доставка подтверждена. Можно приступать к сборке.</p></div>${scheduleSummary(order)}<div class="button-row"><button class="button primary" data-action="start-installation">Начать сборку ${icon('assembly')}</button></div></section>`;
    const done = order.installation.filter(i => i.done).length;
    const openIssues = order.issues.filter(i => !i.resolved).length;
    const accepted = order.stage === 'accepted';
    return `${accepted ? `<div class="acceptance-stamp">${icon('checkCircle')}<h3>Кухня принята</h3><p>Все работы отмечены, замечания закрыты.<br>Это демонстрационная приёмка.</p></div>` : ''}<section class="detail-section"><h3>Чек-лист сборки <span class="count">${done}/${order.installation.length}</span></h3>${order.installation.map(item => `<label class="check-row"><input id="installation-${item.id}" type="checkbox" data-installation="${item.id}" ${item.done ? 'checked' : ''} ${accepted ? 'disabled' : ''}><span>${esc(item.label)}</span></label>`).join('')}</section><section class="detail-section"><h3>Замечания <span class="count">${openIssues} открыто</span></h3>${order.issues.length ? order.issues.map(i => `<div class="issue-row ${i.resolved ? 'resolved' : ''}"><span>${esc(i.text)}</span>${i.resolved ? '<small>Закрыто ✓</small>' : `<button id="resolve-${i.id}" class="button small" data-resolve="${i.id}">Устранено ${icon('check')}</button>`}</div>`).join('') : '<p class="help">Замечаний пока нет.</p>'}${!accepted ? `<form id="issue-form"><label class="field" style="margin-top:18px">Новое замечание<textarea id="issue-text" name="text" maxlength="500" required placeholder="Например, отрегулировать левый фасад"></textarea></label><div class="button-row"><button id="issue-submit" class="button" type="submit">Добавить замечание</button></div><p class="status-message" id="form-error" role="alert"></p></form>` : ''}</section>${!accepted ? `<section class="detail-section"><h3>Приёмка работы</h3><p class="help">${done < order.installation.length ? 'Сначала выполните все пункты чек-листа.' : openIssues ? 'Перед приёмкой устраните открытые замечания.' : 'Все проверки пройдены. Можно завершить заказ.'}</p><div class="button-row"><button class="button primary" data-action="accept" ${done === order.installation.length && !openIssues ? '' : 'disabled'}>Подтвердить приёмку ${icon('checkCircle')}</button></div></section>` : ''}`;
  }

  function scheduleSummary(o) {
    return `<div class="properties"><div class="property"><span>Выезд</span><strong>${date(o.schedule.date, true)}, ${o.schedule.time}</strong></div><div class="property"><span>Бригада</span><strong>${esc(o.schedule.crew)}</strong></div><div class="property"><span>Адрес</span><strong>${esc(o.district)}, ${esc(o.address)}</strong></div></div>`;
  }

  function renderDetail() {
    const o = state.orders.find(item => item.id === ui.selected);
    if (!o) return;
    const current = stages.indexOf(o.stage);
    const focused = detail.contains(document.activeElement) ? document.activeElement.id : '';
    const previousScroll = detail.scrollTop;
    detail.className = 'detail-dialog';
    detail.innerHTML = `<header class="detail-header"><div class="detail-header-top"><span class="eyebrow">${o.id} / Тестовый заказ</span><button class="icon-button" id="close-detail" data-command="close-detail" aria-label="Закрыть карточку">${icon('close')}</button></div><div class="detail-header-bottom"><div><h2 id="detail-title">${esc(o.name)}</h2><p>${esc(o.client)} · ${esc(o.district)} · план до ${date(o.due, true)}</p></div>${badge(o.stage)}</div></header><div class="detail-steps" aria-label="Этапы заказа">${stages.map((s, i) => `<div class="detail-step ${i === current ? 'current' : i < current ? 'complete' : ''}" ${i === current ? 'aria-current="step"' : ''}><i>${i < current ? '✓' : i + 1}</i><span>${shortLabels[i]}</span></div>`).join('')}</div><div class="detail-layout"><div class="detail-main">${actionSection(o)}</div><aside class="detail-aside"><img class="detail-photo" src="${photo(o)}" alt="Референс кухни из каталога ЭКОЛЮКС"><section class="detail-section"><h3>Паспорт проекта</h3><div class="properties"><div class="property"><span>Габариты</span><strong>${esc(o.dimensions)}</strong></div><div class="property"><span>Материал</span><strong>${esc(o.material)}</strong></div><div class="property"><span>Стоимость</span><strong>${money(o.amount)}</strong></div><div class="property"><span>Комплект</span><strong>${M.getReadiness(o).done}/${M.getReadiness(o).total} групп</strong></div></div><p class="help">Сумма и спецификация придуманы для демонстрации. Фото — референс каталога.</p></section><section class="detail-section"><h3>Коммуникации</h3>${(() => { const msgs = M.getComms(state, o.id).slice(-2); if (!msgs.length) return '<p class="help">Пока нет сообщений в центре.</p>'; return `<div class="detail-comms">${msgs.map(m => `<div class="detail-comms-item"><strong>${esc(m.kind === 'system' ? 'Система' : m.author)}</strong><span>${esc(m.text.slice(0, 90))}${m.text.length > 90 ? '…' : ''}</span></div>`).join('')}</div>`; })()}<a class="text-link" href="#comms" data-command="open-comms" data-comms-thread="${o.id}" style="margin-top:14px">Открыть центр ${icon('arrow')}</a></section><section class="detail-section"><h3>История заказа</h3><ol class="history">${o.history.slice().reverse().slice(0, 8).map(h => `<li><time>${new Date(h.time).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>${esc(h.text)}</li>`).join('')}</ol></section></aside></div>`;
    detail.scrollTop = previousScroll;
    if (focused) { const nextFocus = document.getElementById(focused) || detail.querySelector('#issue-text') || detail.querySelector('#close-detail'); nextFocus?.focus({ preventScroll: true }); }
  }

  function openDetail(id) {
    if (!state.orders.some(o => o.id === id)) return;
    ui.selected = id;
    renderDetail();
    detail.showModal();
    document.body.style.overflow = 'hidden';
    detail.scrollTop = 0;
    document.querySelector('#close-detail').focus({ preventScroll: true });
  }

  function applyAction(action, payload = {}) {
    const oldStage = state.orders.find(o => o.id === ui.selected)?.stage;
    const result = M.transition(state, ui.selected, action, payload);
    if (!result.ok) {
      const error = detail.querySelector('#form-error');
      if (error) error.textContent = result.message;
      toast(result.message, true);
      return;
    }
    state = result.state;
    const saved = persist();
    render();
    renderDetail();
    if (state.orders.find(o => o.id === ui.selected).stage !== oldStage) {
      detail.scrollTop = 0;
      document.querySelector('#close-detail').focus({ preventScroll: true });
    }
    toast(saved ? result.message : `${result.message} Сохранение недоступно.`, !saved);
  }

  function updateResults() {
    document.querySelector('#filter-results').innerHTML = orderTable(filteredOrders(), true);
    document.querySelector('#result-count').textContent = `Найдено: ${filteredOrders().length}`;
  }

  function closeMenu() {
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
    document.querySelector('[data-command="menu"]')?.setAttribute('aria-expanded', 'false');
    syncMenuAccessibility();
  }

  function syncMenuAccessibility() {
    const mobile = window.matchMedia('(max-width: 800px)').matches;
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.inert = mobile && !document.body.classList.contains('menu-open');
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('button, a');
    if (!target) return;
    if (target.classList.contains('skip-link')) { event.preventDefault(); document.querySelector('#main').focus(); return; }
    if (target.dataset.commsThread) {
      event.preventDefault();
      ui.commsOrderId = target.dataset.commsThread;
      ui.commsMobileShowThread = true;
      const marked = M.markThreadRead(state, ui.commsOrderId);
      if (marked.ok) { state = marked.state; persist(); }
      if (target.dataset.command === 'open-comms') {
        if (detail.open) detail.close();
        if (location.hash !== '#comms') location.hash = 'comms';
        else { render(); queueMicrotask(() => document.querySelector('#comms-messages')?.scrollTo(0, 99999)); }
        return;
      }
      if (ui.page === 'comms') {
        render();
        queueMicrotask(() => document.querySelector('#comms-messages')?.scrollTo(0, 99999));
        return;
      }
    }
    if (target.dataset.order) return openDetail(target.dataset.order);
    if (target.dataset.action) return applyAction(target.dataset.action);
    if (target.dataset.resolve) return applyAction('resolve-issue', { issueId: target.dataset.resolve });
    if (target.dataset.overviewFilter) { ui.overviewFilter = target.dataset.overviewFilter; render(); document.querySelector(`[data-overview-filter="${ui.overviewFilter}"]`).focus({ preventScroll: true }); return; }
    if (target.matches('a[href^="#"]')) closeMenu();
    switch (target.dataset.command) {
      case 'close-detail': detail.close(); break;
      case 'about': document.querySelector('#about-dialog').showModal(); break;
      case 'close-about': document.querySelector('#about-dialog').close(); break;
      case 'reset': document.querySelector('#confirm-dialog').showModal(); break;
      case 'cancel-reset': document.querySelector('#confirm-dialog').close(); break;
      case 'confirm-reset': state = M.createState(); ui.search = ''; ui.filter = 'all'; ui.overviewFilter = 'all'; ui.commsOrderId = 'ЭК-1048'; ui.commsMobileShowThread = false; ui.composeRole = 'manager'; persist(); document.querySelector('#confirm-dialog').close(); render(); toast('Исходные заказы восстановлены.'); break;
      case 'clear-filters': ui.search = ''; ui.filter = 'all'; ui.overviewFilter = 'all'; render(); document.querySelector('#order-search')?.focus(); break;
      case 'menu': {
        const open = document.body.classList.toggle('menu-open');
        target.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
        syncMenuAccessibility();
        break;
      }
      case 'menu-close': closeMenu(); break;
      case 'comms-back': ui.commsMobileShowThread = false; render(); break;
    }
  });
  document.addEventListener('change', event => {
    const t = event.target;
    if (t.dataset.part) applyAction('toggle-part', { partId: t.dataset.part });
    else if (t.dataset.installation) applyAction('toggle-installation', { itemId: t.dataset.installation });
    else if (t.id === 'status-filter') { ui.filter = t.value; updateResults(); }
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'order-search') { ui.search = event.target.value; updateResults(); }
  });
  document.addEventListener('submit', event => {
    if (event.target.id === 'comms-form') {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target).entries());
      ui.composeRole = data.role || 'manager';
      const orderId = event.target.dataset.commsOrder || ui.commsOrderId;
      const result = M.addMessage(state, orderId, { role: ui.composeRole, text: data.text });
      if (!result.ok) { toast(result.message, true); return; }
      state = result.state;
      const saved = persist();
      ui.commsMobileShowThread = true;
      render();
      queueMicrotask(() => {
        document.querySelector('#comms-messages')?.scrollTo(0, 99999);
        document.querySelector('#comms-text')?.focus();
      });
      toast(saved ? result.message : `${result.message} Сохранение недоступно.`, !saved);
      return;
    }
    if (!['schedule-form', 'issue-form'].includes(event.target.id)) return;
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    applyAction(event.target.id === 'schedule-form' ? 'schedule' : 'add-issue', data);
  });
  detail.addEventListener('close', () => {
    document.body.style.overflow = '';
    document.querySelector(`[data-order="${ui.selected}"]`)?.focus({ preventScroll: true });
  });
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const items = Array.from(dialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(node => node.getClientRects().length);
    if (!items.length) { event.preventDefault(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  function route() {
    const next = location.hash.slice(1);
    ui.page = Object.hasOwn(pages, next) ? next : 'overview';
    if (ui.page === 'comms' && ui.commsOrderId) {
      const marked = M.markThreadRead(state, ui.commsOrderId);
      if (marked.ok && marked.state !== state) { state = marked.state; persist(); }
    }
    render();
    window.scrollTo(0, 0);
    if (ui.page === 'comms') queueMicrotask(() => document.querySelector('#comms-messages')?.scrollTo(0, 99999));
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('resize', syncMenuAccessibility);
  route();
  if (loadNotice) toast(loadNotice, true);
}());
