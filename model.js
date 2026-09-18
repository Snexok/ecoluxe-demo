(function publishEcoModel(root, factory) {
  var api = factory();
  root.EcoModel = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function createEcoModel() {
  'use strict';

  var SCHEMA = 2;
  var STAGES = ['production', 'ready', 'scheduled', 'delivered', 'installation', 'accepted'];
  var SEED_IDS = ['ЭК-1048', 'ЭК-1049', 'ЭК-1050', 'ЭК-1051', 'ЭК-1052', 'ЭК-1053'];
  var VISIT_START = '2026-09-21';
  var COMM_ROLES = ['client', 'manager', 'production', 'logistics', 'crew'];
  var COMM_CHANNELS = ['hub', 'whatsapp', 'call', 'email'];
  var COMM_KINDS = ['message', 'system'];

  function part(id, name, qty, ready) {
    return { id: id, name: name, qty: qty, ready: ready };
  }

  function checklist(id, label, done) {
    return { id: id, label: label, done: done };
  }

  function standardInstallation(done) {
    return [
      checklist('level', 'Выставить корпуса по уровню', done),
      checklist('worktop', 'Установить столешницу и проверить вырезы', done),
      checklist('doors', 'Отрегулировать фасады и зазоры', done),
      checklist('hardware', 'Проверить фурнитуру и открывание', done),
      checklist('cleanup', 'Убрать упаковку и проверить результат', done)
    ];
  }

  function history(time, text) {
    return { time: time, text: text };
  }

  function msg(id, orderId, role, author, channel, time, text, kind, unread) {
    return {
      id: id,
      orderId: orderId,
      role: role,
      author: author,
      channel: channel,
      time: time,
      text: text,
      kind: kind || 'message',
      unread: !!unread
    };
  }

  function seedComms() {
    return [
      msg('c1048-01', 'ЭК-1048', 'client', 'Клиент «Терра»', 'whatsapp', '2026-09-18T07:42:00.000Z',
        'Здравствуйте! Подскажите, когда кухня будет готова к отгрузке? Очень ждём монтаж.', 'message', false),
      msg('c1048-02', 'ЭК-1048', 'manager', 'Анна · менеджер', 'hub', '2026-09-18T08:05:00.000Z',
        'Приняли вопрос в единую ленту заказа. Производство — статус по фасадам ЭК-1048?', 'message', false),
      msg('c1048-03', 'ЭК-1048', 'production', 'Цех · участок №2', 'hub', '2026-09-18T09:18:00.000Z',
        'Фасады ещё в окраске: сдвиг примерно на сутки. Корпуса, столешница и ящики уже готовы.', 'message', false),
      msg('c1048-04', 'ЭК-1048', 'manager', 'Система', 'hub', '2026-09-18T09:19:00.000Z',
        'Комплект: 4 из 5 групп. Фасады в работе.', 'system', false),
      msg('c1048-05', 'ЭК-1048', 'production', 'Цех · участок №2', 'hub', '2026-09-18T11:40:00.000Z',
        'Фасады готовы, передаём на комплектацию. Можно готовить выезд.', 'message', false),
      msg('c1048-06', 'ЭК-1048', 'logistics', 'Логистика', 'hub', '2026-09-18T12:10:00.000Z',
        'Бригада «Север» свободна 24.09 с 10:00. Подтверждаю слот для доставки и монтажа?', 'message', false),
      msg('c1048-07', 'ЭК-1048', 'manager', 'Анна · менеджер', 'hub', '2026-09-18T12:22:00.000Z',
        'Слот держим. Клиенту сообщим после вашего ОК.', 'message', false),
      msg('c1048-08', 'ЭК-1048', 'client', 'Клиент «Терра»', 'whatsapp', '2026-09-18T13:05:00.000Z',
        'Можно ли перенести доставку на вечер пятницы? Домофон 12Б.', 'message', true),

      msg('c1050-01', 'ЭК-1050', 'manager', 'Анна · менеджер', 'hub', '2026-09-18T10:12:00.000Z',
        'Комплектность подтверждена. Готовим назначение выезда.', 'message', false),
      msg('c1050-02', 'ЭК-1050', 'logistics', 'Логистика', 'hub', '2026-09-18T10:45:00.000Z',
        'Ищем бригаду на 25.09. Вернусь с слотом сегодня.', 'message', false),
      msg('c1050-03', 'ЭК-1050', 'production', 'Система', 'hub', '2026-09-18T10:05:00.000Z',
        'Комплект подтверждён.', 'system', false),

      msg('c1051-01', 'ЭК-1051', 'logistics', 'Логистика', 'hub', '2026-09-18T10:35:00.000Z',
        'Выезд 23.09 в 11:00 · бригада «Север» закреплён.', 'message', false),
      msg('c1051-02', 'ЭК-1051', 'crew', 'Бригада «Север»', 'hub', '2026-09-18T11:02:00.000Z',
        'Приняли. На объекте будем с 10:45, нужна парковка у подъезда.', 'message', false),
      msg('c1051-03', 'ЭК-1051', 'client', 'Клиент «Каскад»', 'email', '2026-09-18T11:40:00.000Z',
        'Ждём вас. Домофон 19В, охрана предупреждена.', 'message', false)
    ];
  }

  function createState() {
    return {
      schema: SCHEMA,
      orders: [
        {
          id: 'ЭК-1048',
          name: 'Кухня «Тёплый дуб»',
          client: 'Клиент «Терра»',
          district: 'Квартал «Речной»',
          address: 'Дом 12, секция Б',
          amount: 486000,
          due: '2026-09-28',
          owner: 'Участок №2',
          stage: 'production',
          material: 'Шпон тёплого дуба, матовый лак',
          dimensions: '3,4 × 2,6 м',
          parts: [
            part('frames', 'Корпуса и каркасы', 7, true),
            part('worktop', 'Столешница', 1, true),
            part('drawers', 'Ящики и направляющие', 8, true),
            part('appliances', 'Места под технику', 4, true),
            part('facades', 'Фасады', 12, false)
          ],
          installation: standardInstallation(false),
          issues: [],
          schedule: null,
          history: [history('2026-09-18T09:10:00.000Z', 'Фасады переданы в окраску.')]
        },
        {
          id: 'ЭК-1049',
          name: 'Кухня «Светлый лен»',
          client: 'Клиент «Маяк»',
          district: 'Квартал «Садовый»',
          address: 'Дом 7, подъезд 1',
          amount: 329000,
          due: '2026-10-02',
          owner: 'Участок №1',
          stage: 'production',
          material: 'МДФ в эмали, оттенок льна',
          dimensions: '2,8 × 2,4 м',
          parts: [
            part('frames', 'Корпуса', 6, true),
            part('worktop', 'Столешница', 1, true),
            part('facades', 'Фасады', 10, false),
            part('hardware', 'Фурнитура', 1, false)
          ],
          installation: standardInstallation(false),
          issues: [],
          schedule: null,
          history: [history('2026-09-18T08:35:00.000Z', 'Собраны корпуса нижнего ряда.')]
        },
        {
          id: 'ЭК-1050',
          name: 'Кухня «Графитовый ритм»',
          client: 'Клиент «Орион»',
          district: 'Квартал «Парковый»',
          address: 'Дом 4, секция А',
          amount: 412000,
          due: '2026-09-25',
          owner: 'Контроль комплектации',
          stage: 'ready',
          material: 'Пластик графит, кромка под латунь',
          dimensions: '3,1 × 2,2 м',
          parts: [
            part('frames', 'Корпуса', 8, true),
            part('worktop', 'Столешница', 1, true),
            part('facades', 'Фасады', 14, true),
            part('hardware', 'Фурнитура', 1, true)
          ],
          installation: standardInstallation(false),
          issues: [],
          schedule: null,
          history: [history('2026-09-18T10:05:00.000Z', 'Комплектность подтверждена.')]
        },
        {
          id: 'ЭК-1051',
          name: 'Кухня «Мягкая олива»',
          client: 'Клиент «Каскад»',
          district: 'Квартал «Северный»',
          address: 'Дом 19, секция В',
          amount: 378000,
          due: '2026-09-26',
          owner: 'Логистика',
          stage: 'scheduled',
          material: 'МДФ в эмали, мягкая олива',
          dimensions: '3,0 × 2,5 м',
          parts: [
            part('frames', 'Корпуса', 7, true),
            part('worktop', 'Столешница', 1, true),
            part('facades', 'Фасады', 12, true),
            part('hardware', 'Фурнитура', 1, true)
          ],
          installation: standardInstallation(false),
          issues: [],
          schedule: { date: '2026-09-23', time: '11:00', crew: 'Бригада «Север»' },
          history: [history('2026-09-18T10:30:00.000Z', 'Выезд подтверждён на 23 сентября.')]
        },
        {
          id: 'ЭК-1052',
          name: 'Кухня «Белый контур»',
          client: 'Клиент «Вектор»',
          district: 'Квартал «Восточный»',
          address: 'Дом 3, секция Г',
          amount: 295000,
          due: '2026-09-24',
          owner: 'Бригада «Восток»',
          stage: 'installation',
          material: 'Суперматовый белый МДФ',
          dimensions: '2,6 × 2,1 м',
          parts: [
            part('frames', 'Корпуса', 5, true),
            part('worktop', 'Столешница', 1, true),
            part('facades', 'Фасады', 9, true),
            part('hardware', 'Фурнитура', 1, true)
          ],
          installation: standardInstallation(false),
          issues: [],
          schedule: { date: '2026-09-21', time: '09:30', crew: 'Бригада «Восток»' },
          history: [history('2026-09-21T11:00Z', 'Монтажная бригада приступила к сборке.')]
        },
        {
          id: 'ЭК-1053',
          name: 'Кухня «Тихий песок»',
          client: 'Клиент «Сфера»',
          district: 'Квартал «Южный»',
          address: 'Дом 15, секция А',
          amount: 441000,
          due: '2026-09-22',
          owner: 'Сервисная группа',
          stage: 'accepted',
          material: 'Шпон ясеня, песочная эмаль',
          dimensions: '3,6 × 2,7 м',
          parts: [
            part('frames', 'Корпуса', 9, true),
            part('worktop', 'Столешница', 1, true),
            part('facades', 'Фасады', 15, true),
            part('hardware', 'Фурнитура', 1, true)
          ],
          installation: standardInstallation(true),
          issues: [
            { id: 'issue-1', text: 'Отметка по плинтусу закрыта на месте.', resolved: true }
          ],
          schedule: { date: '2026-09-21', time: '16:00', crew: 'Бригада «Юг»' },
          history: [history('2026-09-21T16:25Z', 'Работа принята по чек-листу.')]
        }
      ],
      comms: seedComms()
    };
  }

  function getReadiness(order) {
    var done = order.parts.filter(function (item) { return item.ready; }).length;
    var total = order.parts.length;
    return { done: done, total: total, ready: done === total };
  }

  function getStats(state) {
    return {
      active: state.orders.filter(function (order) { return order.stage !== 'accepted'; }).length,
      ready: state.orders.filter(function (order) { return order.stage === 'ready'; }).length,
      deliveries: state.orders.filter(function (order) { return order.stage === 'scheduled'; }).length,
      issues: state.orders.reduce(function (count, order) {
        return count + order.issues.filter(function (issue) { return !issue.resolved; }).length;
      }, 0),
      accepted: state.orders.filter(function (order) { return order.stage === 'accepted'; }).length,
      openDialogs: getOpenDialogOrderIds(state).length,
      unreadComms: getUnreadCount(state)
    };
  }

  function getComms(state, orderId) {
    var list = (state.comms || []).filter(function (item) {
      return !orderId || item.orderId === orderId;
    });
    return list.slice().sort(function (a, b) {
      return Date.parse(a.time) - Date.parse(b.time);
    });
  }

  function getOpenDialogOrderIds(state) {
    var ids = {};
    (state.comms || []).forEach(function (item) {
      ids[item.orderId] = true;
    });
    return Object.keys(ids).filter(function (id) {
      var order = getOrder(state, id);
      return order && order.stage !== 'accepted';
    });
  }

  function getUnreadCount(state, orderId) {
    return (state.comms || []).filter(function (item) {
      return item.unread && (!orderId || item.orderId === orderId);
    }).length;
  }

  function getThreadMeta(state) {
    return getOpenDialogOrderIds(state).concat(
      Object.keys((state.comms || []).reduce(function (acc, item) {
        acc[item.orderId] = true;
        return acc;
      }, {})).filter(function (id) {
        return getOpenDialogOrderIds(state).indexOf(id) === -1;
      })
    ).map(function (orderId) {
      var order = getOrder(state, orderId);
      var messages = getComms(state, orderId);
      var last = messages[messages.length - 1];
      return {
        orderId: orderId,
        order: order,
        messages: messages,
        last: last,
        unread: getUnreadCount(state, orderId)
      };
    }).filter(function (thread) {
      return thread.order && thread.messages.length;
    }).sort(function (a, b) {
      return Date.parse(b.last.time) - Date.parse(a.last.time);
    });
  }

  function addMessage(state, orderId, payload) {
    payload = payload || {};
    if (!validateState(state)) return { ok: false, state: state, message: 'Состояние не прошло проверку.' };
    var order = getOrder(state, orderId);
    if (!order) return { ok: false, state: state, message: 'Заказ не найден.' };
    var text = typeof payload.text === 'string' ? payload.text.trim() : '';
    if (!text) return { ok: false, state: state, message: 'Введите текст сообщения.' };
    var role = COMM_ROLES.indexOf(payload.role) !== -1 ? payload.role : 'manager';
    var author = isNonEmptyString(payload.author) ? payload.author.trim() : defaultAuthor(role);
    var kind = payload.kind === 'system' ? 'system' : 'message';
    var nextMsg = msg(
      'c-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000),
      orderId,
      role,
      author,
      'hub',
      eventTime(),
      text,
      kind,
      false
    );
    var next = {
      schema: state.schema,
      orders: state.orders,
      comms: state.comms.concat(nextMsg)
    };
    if (!validateState(next)) return { ok: false, state: state, message: 'Не удалось сохранить сообщение.' };
    return { ok: true, state: next, message: 'Сообщение отправлено в центр.', messageId: nextMsg.id };
  }

  function markThreadRead(state, orderId) {
    if (!validateState(state)) return { ok: false, state: state, message: 'Состояние не прошло проверку.' };
    var changed = false;
    var nextComms = state.comms.map(function (item) {
      if (item.orderId === orderId && item.unread) {
        changed = true;
        return Object.assign({}, item, { unread: false });
      }
      return item;
    });
    if (!changed) return { ok: true, state: state, message: 'Уже прочитано.' };
    var next = { schema: state.schema, orders: state.orders, comms: nextComms };
    if (!validateState(next)) return { ok: false, state: state, message: 'Не удалось обновить прочтение.' };
    return { ok: true, state: next, message: 'Диалог прочитан.' };
  }

  function defaultAuthor(role) {
    return {
      client: 'Клиент',
      manager: 'Менеджер',
      production: 'Производство',
      logistics: 'Логистика',
      crew: 'Бригада'
    }[role] || 'Команда';
  }

  function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value) &&
      (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  }

  function hasOnlyKeys(value, keys) {
    var actual = Object.keys(value).sort();
    var expected = keys.slice().sort();
    return actual.length === expected.length && actual.every(function (key, index) {
      return key === expected[index];
    });
  }

  function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  function isDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var fields = value.split('-').map(Number);
    var parsed = new Date(Date.UTC(fields[0], fields[1] - 1, fields[2]));
    return parsed.getUTCFullYear() === fields[0] && parsed.getUTCMonth() === fields[1] - 1 && parsed.getUTCDate() === fields[2];
  }

  function isTime(value) {
    if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return false;
    var fields = value.split(':').map(Number);
    return fields[0] >= 0 && fields[0] <= 23 && fields[1] >= 0 && fields[1] <= 59;
  }

  function isSchedule(value) {
    return isPlainObject(value) && hasOnlyKeys(value, ['date', 'time', 'crew']) &&
      isDate(value.date) && isTime(value.time) && isNonEmptyString(value.crew) && value.date >= VISIT_START;
  }

  function isHistory(value) {
    return isPlainObject(value) && hasOnlyKeys(value, ['time', 'text']) &&
      isNonEmptyString(value.time) && isNonEmptyString(value.text) && !Number.isNaN(Date.parse(value.time));
  }

  function isCommsMessage(value) {
    return isPlainObject(value) &&
      hasOnlyKeys(value, ['id', 'orderId', 'role', 'author', 'channel', 'time', 'text', 'kind', 'unread']) &&
      isNonEmptyString(value.id) && isNonEmptyString(value.orderId) && isNonEmptyString(value.author) &&
      isNonEmptyString(value.text) && isNonEmptyString(value.time) && !Number.isNaN(Date.parse(value.time)) &&
      COMM_ROLES.indexOf(value.role) !== -1 && COMM_CHANNELS.indexOf(value.channel) !== -1 &&
      COMM_KINDS.indexOf(value.kind) !== -1 && typeof value.unread === 'boolean';
  }

  function hasUniqueIds(items) {
    var ids = items.map(function (item) { return item.id; });
    return ids.length === new Set(ids).size;
  }

  function isOrder(order) {
    var textFields = ['id', 'name', 'client', 'district', 'address', 'due', 'owner', 'stage', 'material', 'dimensions'];
    var expected = ['id', 'name', 'client', 'district', 'address', 'amount', 'due', 'owner', 'stage', 'material', 'dimensions', 'parts', 'installation', 'issues', 'schedule', 'history'];
    if (!isPlainObject(order) || !hasOnlyKeys(order, expected) || !textFields.every(function (field) { return isNonEmptyString(order[field]); })) return false;
    if (!Number.isFinite(order.amount) || order.amount <= 0 || !isDate(order.due) || STAGES.indexOf(order.stage) === -1) return false;
    if (!Array.isArray(order.parts) || order.parts.length === 0 || !hasUniqueIds(order.parts)) return false;
    if (!order.parts.every(function (item) {
      return isPlainObject(item) && hasOnlyKeys(item, ['id', 'name', 'qty', 'ready']) &&
        isNonEmptyString(item.id) && isNonEmptyString(item.name) && Number.isInteger(item.qty) && item.qty > 0 && typeof item.ready === 'boolean';
    })) return false;
    if (!Array.isArray(order.installation) || order.installation.length === 0 || !hasUniqueIds(order.installation)) return false;
    if (!order.installation.every(function (item) {
      return isPlainObject(item) && hasOnlyKeys(item, ['id', 'label', 'done']) &&
        isNonEmptyString(item.id) && isNonEmptyString(item.label) && typeof item.done === 'boolean';
    })) return false;
    if (!Array.isArray(order.issues) || !hasUniqueIds(order.issues) || !order.issues.every(function (issue) {
      return isPlainObject(issue) && hasOnlyKeys(issue, ['id', 'text', 'resolved']) &&
        isNonEmptyString(issue.id) && isNonEmptyString(issue.text) && typeof issue.resolved === 'boolean';
    })) return false;
    if (!Array.isArray(order.history) || order.history.length === 0 || !order.history.every(isHistory)) return false;
    if (order.schedule !== null && !isSchedule(order.schedule)) return false;

    var requiresSchedule = ['scheduled', 'delivered', 'installation', 'accepted'].indexOf(order.stage) !== -1;
    if (requiresSchedule && !order.schedule) return false;
    if (!requiresSchedule && order.schedule !== null) return false;
    if (order.stage !== 'production' && !getReadiness(order).ready) return false;
    if (order.stage === 'accepted' && (!order.installation.every(function (item) { return item.done; }) || order.issues.some(function (issue) { return !issue.resolved; }))) return false;
    return true;
  }

  function validateState(candidate) {
    if (!isPlainObject(candidate) || !hasOnlyKeys(candidate, ['schema', 'orders', 'comms']) || candidate.schema !== SCHEMA || !Array.isArray(candidate.orders) || candidate.orders.length !== 6) return false;
    if (!Array.isArray(candidate.comms) || !candidate.comms.every(isCommsMessage) || !hasUniqueIds(candidate.comms)) return false;
    if (!candidate.orders.every(isOrder) || !hasUniqueIds(candidate.orders)) return false;
    if (!candidate.orders.every(function (order) { return SEED_IDS.indexOf(order.id) !== -1; })) return false;
    if (!candidate.comms.every(function (item) { return SEED_IDS.indexOf(item.orderId) !== -1; })) return false;
    var visits = new Set();
    return candidate.orders.every(function (order) {
      if (!order.schedule || order.stage === 'accepted') return true;
      var key = order.schedule.crew + '\u0000' + order.schedule.date + '\u0000' + order.schedule.time;
      if (visits.has(key)) return false;
      visits.add(key);
      return true;
    });
  }

  function result(ok, state, message) {
    return { ok: ok, state: state, message: message };
  }

  function eventTime() {
    return new Date().toISOString();
  }

  function withOrder(state, orderId, change, text) {
    var nextOrders = state.orders.map(function (order) {
      if (order.id !== orderId) return order;
      var next = change(order);
      return {
        ...next,
        history: next.history.concat(history(eventTime(), text))
      };
    });
    return { schema: state.schema, orders: nextOrders, comms: state.comms || [] };
  }

  function getOrder(state, orderId) {
    return state.orders.find(function (order) { return order.id === orderId; });
  }

  function blocked(state, message) {
    return result(false, state, message);
  }

  function activeScheduleCollision(state, orderId, schedule) {
    return state.orders.some(function (order) {
      return order.id !== orderId && order.stage !== 'accepted' && order.schedule &&
        order.schedule.crew === schedule.crew && order.schedule.date === schedule.date && order.schedule.time === schedule.time;
    });
  }

  function transition(state, orderId, action, payload) {
    payload = payload || {};
    if (!validateState(state)) return blocked(state, 'Состояние не прошло проверку.');
    var order = getOrder(state, orderId);
    if (!order) return blocked(state, 'Заказ не найден.');

    if (action === 'toggle-part') {
      if (order.stage !== 'production') return blocked(state, 'Менять готовность деталей можно только в производстве.');
      var partItem = order.parts.find(function (item) { return item.id === payload.partId; });
      if (!partItem) return blocked(state, 'Деталь не найдена.');
      return result(true, withOrder(state, orderId, function (current) {
        return {
          ...current,
          parts: current.parts.map(function (item) {
            return item.id === payload.partId ? { ...item, ready: !item.ready } : item;
          })
        };
      }, partItem.ready ? 'Готовность детали снята.' : 'Деталь отмечена готовой.'), 'Готовность детали обновлена.');
    }

    if (action === 'finish-production') {
      if (order.stage !== 'production') return blocked(state, 'Производство уже завершено или недоступно для этого этапа.');
      if (!getReadiness(order).ready) return blocked(state, 'Нельзя завершить производство: комплект ещё не полный.');
      return result(true, withOrder(state, orderId, function (current) {
        return { ...current, stage: 'ready' };
      }, 'Производство завершено, заказ готов к выезду.'), 'Производство завершено.');
    }

    if (action === 'schedule') {
      var schedule = { date: payload.date, time: payload.time, crew: payload.crew };
      if (order.stage !== 'ready') return blocked(state, 'Планировать выезд можно только для готового заказа.');
      if (!isSchedule(schedule)) return blocked(state, 'Укажите корректные дату, время и бригаду не ранее 21 сентября.');
      if (activeScheduleCollision(state, orderId, schedule)) return blocked(state, 'Бригада уже занята в это время: выберите другой выезд.');
      return result(true, withOrder(state, orderId, function (current) {
        return { ...current, stage: 'scheduled', schedule: schedule };
      }, 'Выезд назначен на ' + schedule.date + ' в ' + schedule.time + '.'), 'Выезд назначен.');
    }

    if (action === 'deliver') {
      if (order.stage !== 'scheduled') return blocked(state, 'Подтвердить доставку можно только для назначенного выезда.');
      if (!isSchedule(order.schedule)) return blocked(state, 'Для доставки нужны дата, время и бригада.');
      return result(true, withOrder(state, orderId, function (current) {
        return { ...current, stage: 'delivered' };
      }, 'Доставка подтверждена.'), 'Доставка подтверждена.');
    }

    if (action === 'start-installation') {
      if (order.stage !== 'delivered') return blocked(state, 'Начать установку можно после подтверждения доставки.');
      return result(true, withOrder(state, orderId, function (current) {
        return { ...current, stage: 'installation' };
      }, 'Монтажная бригада приступила к установке.'), 'Установка начата.');
    }

    if (action === 'toggle-installation') {
      if (order.stage !== 'installation') return blocked(state, 'Чек-лист доступен только во время установки.');
      var installationItem = order.installation.find(function (item) { return item.id === payload.itemId; });
      if (!installationItem) return blocked(state, 'Пункт чек-листа не найден.');
      return result(true, withOrder(state, orderId, function (current) {
        return {
          ...current,
          installation: current.installation.map(function (item) {
            return item.id === payload.itemId ? { ...item, done: !item.done } : item;
          })
        };
      }, installationItem.done ? 'Пункт чек-листа возвращён в работу.' : 'Пункт чек-листа выполнен.'), 'Чек-лист обновлён.');
    }

    if (action === 'add-issue') {
      var text = typeof payload.text === 'string' ? payload.text.trim() : '';
      if (order.stage !== 'installation') return blocked(state, 'Замечания можно вести только во время установки.');
      if (!text) return blocked(state, 'Опишите замечание.');
      if (order.issues.some(function (issue) { return !issue.resolved && issue.text === text; })) return blocked(state, 'Такое открытое замечание уже есть.');
      var issueId = 'issue-' + (order.issues.length + 1);
      return result(true, withOrder(state, orderId, function (current) {
        return { ...current, issues: current.issues.concat({ id: issueId, text: text, resolved: false }) };
      }, 'Добавлено замечание: ' + text), 'Замечание добавлено.');
    }

    if (action === 'resolve-issue') {
      if (order.stage !== 'installation') return blocked(state, 'Закрывать замечания можно только во время установки.');
      var issue = order.issues.find(function (item) { return item.id === payload.issueId; });
      if (!issue) return blocked(state, 'Замечание не найдено.');
      if (issue.resolved) return blocked(state, 'Замечание уже закрыто.');
      return result(true, withOrder(state, orderId, function (current) {
        return {
          ...current,
          issues: current.issues.map(function (item) {
            return item.id === payload.issueId ? { ...item, resolved: true } : item;
          })
        };
      }, 'Замечание закрыто.'), 'Замечание закрыто.');
    }

    if (action === 'accept') {
      if (order.stage !== 'installation') return blocked(state, 'Принять работу можно только после установки.');
      if (!order.installation.every(function (item) { return item.done; })) return blocked(state, 'Нельзя принять работу: чек-лист ещё не завершён.');
      if (order.issues.some(function (issue) { return !issue.resolved; })) return blocked(state, 'Нельзя принять работу: есть открытые замечания.');
      return result(true, withOrder(state, orderId, function (current) {
        return { ...current, stage: 'accepted' };
      }, 'Работа принята по чек-листу.'), 'Работа принята.');
    }

    return blocked(state, 'Неизвестное действие.');
  }

  return {
    createState: createState,
    transition: transition,
    getReadiness: getReadiness,
    getStats: getStats,
    validateState: validateState,
    getComms: getComms,
    addMessage: addMessage,
    markThreadRead: markThreadRead,
    getUnreadCount: getUnreadCount,
    getThreadMeta: getThreadMeta,
    getOpenDialogOrderIds: getOpenDialogOrderIds
  };
}));
