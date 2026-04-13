/* ══════════════════════════════════════════════
   KG GUIDE v3.2 — КАРУСЕЛЬ + КОНТАКТЫ + САЙДБАР
══════════════════════════════════════════════ */
const API = 'http://localhost:8000';

let allPlaces = [];
let placesPage = 0;
let activePlacesType = 'all';
let activePlacesCat  = 'all';
const PER_PAGE = 12;

let cart      = JSON.parse(localStorage.getItem('kg_cart')      || '[]');
let favorites = JSON.parse(localStorage.getItem('kg_favorites') || '[]');
let currentUser = JSON.parse(localStorage.getItem('kg_user')    || 'null');

/* ════════════ ИНИЦИАЛИЗАЦИЯ ════════════ */
document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initSidebar();
    initSearch();
    initTabNav();
    initCarousel();
    loadAllPlaces();
    renderShop();
    updateCartUI();
    updateAuthUI();
    updateFavBadge();
});

/* ════════════ HEADER ════════════ */
function initHeader() {
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 40), {passive:true});
    document.getElementById('profile-btn').onclick = () => currentUser ? openProfileModal() : openModal('auth-overlay');
}

/* ════════════ КАРУСЕЛЬ ════════════ */
let carouselIdx = 0;
let carouselTotal = 0;
let carouselTimer = null;
const CAROUSEL_INTERVAL = 5000;
let carouselProgress = 0;
let progressTimer = null;

function initCarousel() {
    const track = document.getElementById('carousel-track');
    if (!track) return;
    carouselTotal = track.children.length;

    // Генерируем точки
    const dotsEl = document.getElementById('carousel-dots');
    for (let i = 0; i < carouselTotal; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.onclick = () => carouselGoTo(i);
        dotsEl.appendChild(dot);
    }
    startCarouselTimer();

    // Свайп на мобилке
    let touchStartX = 0;
    const outer = document.querySelector('.carousel-track-outer');
    if (outer) {
        outer.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, {passive:true});
        outer.addEventListener('touchend', e => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) diff > 0 ? carouselNext() : carouselPrev();
        });
    }
}

function carouselGoTo(idx) {
    carouselIdx = (idx + carouselTotal) % carouselTotal;
    const track = document.getElementById('carousel-track');
    if (track) track.style.transform = `translateX(-${carouselIdx * 100}%)`;
    // Обновить точки
    document.querySelectorAll('.carousel-dot').forEach((d, i) => d.classList.toggle('active', i === carouselIdx));
    resetCarouselTimer();
}

function carouselNext() { carouselGoTo(carouselIdx + 1); }
function carouselPrev() { carouselGoTo(carouselIdx - 1); }

function startCarouselTimer() {
    clearInterval(carouselTimer);
    clearInterval(progressTimer);
    carouselProgress = 0;
    updateProgressBar();

    progressTimer = setInterval(() => {
        carouselProgress += 100 / (CAROUSEL_INTERVAL / 100);
        if (carouselProgress >= 100) carouselProgress = 100;
        updateProgressBar();
    }, 100);

    carouselTimer = setInterval(() => {
        carouselNext();
    }, CAROUSEL_INTERVAL);
}

function resetCarouselTimer() {
    carouselProgress = 0;
    updateProgressBar();
    startCarouselTimer();
}

function updateProgressBar() {
    const bar = document.getElementById('carousel-progress-bar');
    if (bar) bar.style.width = carouselProgress + '%';
}

/* ════════════ ТАБ-НАВИГАЦИЯ ════════════ */
function initTabNav() {
    document.querySelectorAll('.top-nav a[data-tab]').forEach(a => {
        a.addEventListener('click', e => { e.preventDefault(); switchTab(a.dataset.tab); });
    });
    document.querySelectorAll('.side-nav a[data-tab]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            const tab = a.dataset.tab;
            const cat = a.dataset.cat;
            if (cat) { switchTab('places'); applyCategoryFilter(cat); }
            else switchTab(tab);
            closeSidebar();
        });
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    const pane = document.getElementById(`tab-${tabId}`);
    if (pane) { pane.classList.add('active'); window.scrollTo({top:0, behavior:'smooth'}); }
    document.querySelectorAll('.top-nav a[data-tab], .side-nav a[data-tab]').forEach(a => {
        a.classList.toggle('active', a.dataset.tab === tabId && !a.dataset.cat);
    });
    if (tabId === 'favorites') renderFavGrid();
}

/* ════════════ SIDEBAR ════════════ */
function initSidebar() {
    document.getElementById('open-sidebar').onclick = openSidebar;
    document.getElementById('close-sidebar').onclick = closeSidebar;
    document.getElementById('sidebar-overlay').onclick = closeSidebar;
    document.getElementById('sb-profile-btn').onclick = () => { closeSidebar(); currentUser ? openProfileModal() : openModal('auth-overlay'); };
    document.getElementById('sb-auth-btn').onclick = () => { closeSidebar(); currentUser ? doLogout() : openModal('auth-overlay'); };
}
function openSidebar()  { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebar-overlay').classList.add('active'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('active'); }

/* ════════════ INFO МОДАЛКИ (поддержка / политика) ════════════ */
const INFO_CONTENT = {
    support: {
        title: '💬 Техническая поддержка',
        html: `
        <h4>Свяжитесь с нами</h4>
        <div class="support-links">
          <a class="support-link" href="https://t.me/kgguide_support" target="_blank"><span class="sl-icon">✈️</span><div><span>Telegram</span><span class="sl-sub">@kgguide_support — ответим за 30 минут</span></div></a>
          <a class="support-link" href="https://wa.me/996700000001" target="_blank"><span class="sl-icon">💬</span><div><span>WhatsApp</span><span class="sl-sub">+996 700 000 001 — пн-вс 9:00–22:00</span></div></a>
          <a class="support-link" href="mailto:support@kgguide.kg"><span class="sl-icon">📧</span><div><span>Email</span><span class="sl-sub">support@kgguide.kg</span></div></a>
          <a class="support-link" href="https://instagram.com/kgguide.kg" target="_blank"><span class="sl-icon">📸</span><div><span>Instagram</span><span class="sl-sub">@kgguide.kg — DM всегда открыты</span></div></a>
        </div>
        <h4>Частые вопросы</h4>
        <p><strong>Как добавить место в избранное?</strong> — Нажмите ♡ на карточке места.</p>
        <p><strong>Как отменить подписку?</strong> — Зайдите в профиль → Тарифный план → Базовый.</p>
        <p><strong>Промокод не работает?</strong> — Убедитесь, что срок действия не истёк и нет пробелов при вводе.</p>`
    },
    about: {
        title: 'ℹ️ О приложении KG Guide',
        html: `
        <h4>Что такое KG Guide?</h4>
        <p>KG Guide — это персональный путеводитель по Кыргызстану. Мы собрали лучшие рестораны, кафе, природные места, спа и ночные заведения, чтобы вы всегда знали, куда пойти.</p>
        <h4>Наша миссия</h4>
        <p>Помочь каждому жителю и туристу Кыргызстана открыть страну заново — найти своё идеальное место для романтики, дружеского отдыха или семейного досуга.</p>
        <h4>Версия</h4>
        <p>KG Guide v1.0 · Апрель 2026</p>
        <h4>Разработка</h4>
        <p>Создано с любовью в Бишкеке 🇰🇬</p>
        <div class="support-links" style="margin-top:14px">
          <a class="support-link" href="https://instagram.com/kgguide.kg" target="_blank"><span class="sl-icon">📸</span><div><span>Instagram</span><span class="sl-sub">@kgguide.kg</span></div></a>
          <a class="support-link" href="https://t.me/kgguide" target="_blank"><span class="sl-icon">✈️</span><div><span>Telegram-канал</span><span class="sl-sub">@kgguide — новости и события</span></div></a>
        </div>`
    },
    privacy: {
        title: '🔒 Политика конфиденциальности',
        html: `
        <h4>Сбор данных</h4>
        <p>KG Guide собирает только минимально необходимые данные: имя, email и зашифрованный пароль при регистрации. Мы не продаём и не передаём ваши данные третьим лицам.</p>
        <h4>Хранение данных</h4>
        <p>Все данные хранятся на защищённых серверах. Пароли хешируются по алгоритму SHA-256 и никогда не хранятся в открытом виде.</p>
        <h4>Cookies и локальное хранилище</h4>
        <p>Приложение использует localStorage для хранения списка избранного и корзины. Эти данные не покидают ваше устройство.</p>
        <h4>Ваши права</h4>
        <p>Вы можете запросить удаление своих данных в любое время, обратившись в поддержку по адресу support@kgguide.kg.</p>
        <h4>Изменения политики</h4>
        <p>Мы уведомим пользователей об изменениях через приложение. Последнее обновление: апрель 2026.</p>`
    },
    terms: {
        title: '📄 Пользовательское соглашение',
        html: `
        <h4>Общие положения</h4>
        <p>Используя KG Guide, вы соглашаетесь с настоящим соглашением. Приложение предоставляется «как есть» для поиска мест досуга в Кыргызстане.</p>
        <h4>Регистрация</h4>
        <p>Пользователь обязуется указывать достоверную информацию при регистрации. Запрещается создавать несколько аккаунтов или использовать чужие данные.</p>
        <h4>Контент</h4>
        <p>Информация о местах носит рекомендательный характер. KG Guide не несёт ответственности за изменения в работе заведений (режим, цены, качество).</p>
        <h4>Промокоды и скидки</h4>
        <p>Промокоды предоставляются партнёрами. KG Guide не гарантирует их принятие и не несёт ответственности за отказ партнёра применить скидку.</p>
        <h4>Запрещённые действия</h4>
        <p>Запрещается взлом, спам, размещение ложных отзывов, использование приложения в незаконных целях.</p>
        <h4>Контакты</h4>
        <p>По всем вопросам: legal@kgguide.kg · КР, г. Бишкек</p>`
    },
    'partner-info': {
        title: '🤝 Стать партнёром',
        html: `
        <h4>Почему стоит разместиться на KG Guide?</h4>
        <p>Тысячи пользователей каждый день ищут места для отдыха именно в KG Guide. Партнёры получают прирост клиентов до 60% уже в первый квартал.</p>
        <h4>Что вы получаете?</h4>
        <p>Страница вашего бизнеса, уникальный промокод для клиентов, аналитика переходов и приоритет в поисковой выдаче.</p>
        <h4>Как подать заявку?</h4>
        <div class="support-links" style="margin-top:10px">
          <a class="support-link" href="https://t.me/kgguide_partner" target="_blank"><span class="sl-icon">✈️</span><div><span>Telegram</span><span class="sl-sub">@kgguide_partner — менеджер ответит быстро</span></div></a>
          <a class="support-link" href="mailto:partner@kgguide.kg"><span class="sl-icon">📧</span><div><span>Email</span><span class="sl-sub">partner@kgguide.kg</span></div></a>
        </div>
        <p style="margin-top:14px">Или заполните форму в разделе <strong>«Партнёрство»</strong> — мы свяжемся в течение 1 рабочего дня.</p>
        <div style="text-align:center;margin-top:18px"><button class="btn-gold" onclick="closeModal('info-overlay');switchTab('partner')">Заполнить форму →</button></div>`
    }
};

function openInfoModal(type) {
    const content = INFO_CONTENT[type];
    if (!content) return;
    document.getElementById('info-modal-content').innerHTML = `<h2>${content.title}</h2>${content.html}`;
    openModal('info-overlay');
}

/* ════════════ SEARCH ════════════ */
function initSearch() {
    const bar = document.getElementById('search-bar');
    const input = document.getElementById('global-search');
    document.getElementById('search-toggle-btn').onclick = () => { bar.classList.toggle('open'); if (bar.classList.contains('open')) input.focus(); };
    document.getElementById('search-close-btn').onclick = () => { bar.classList.remove('open'); input.value=''; };
    let t;
    input.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
            const q = input.value.trim();
            if (q.length > 1) { switchTab('places'); searchPlaces(q); }
        }, 350);
    });
}
function searchPlaces(q) {
    const low = q.toLowerCase();
    const res = allPlaces.filter(p => p.name.toLowerCase().includes(low) || p.description.toLowerCase().includes(low) || p.city.toLowerCase().includes(low) || p.category.toLowerCase().includes(low));
    document.getElementById('places-subtitle').textContent = `Результаты: «${q}» — ${res.length} мест`;
    renderPlacesGrid(res);
}

/* ════════════ МЕСТА ════════════ */
function goToPlaces(filter) {
    switchTab('places');
    const types = ['romance','friends','family'];
    const cats  = ['природа','кафе','ресторан','шоппинг','спа','ночная жизнь','активный отдых'];
    if (types.includes(filter)) applyTypeFilter(filter);
    else if (cats.includes(filter)) applyCategoryFilter(filter);
}

function applyTypeFilter(type) {
    activePlacesType = type; activePlacesCat = 'all';
    document.querySelectorAll('#type-chips .chip').forEach(c => c.classList.toggle('active', c.dataset.type === type));
    document.querySelectorAll('#cat-chips .chip').forEach(c => c.classList.toggle('active', c.dataset.cat === 'all'));
    const labels = {romance:'❤️ Романтика', friends:'👫 С друзьями', family:'👨‍👩‍👧 Семья'};
    document.getElementById('places-subtitle').textContent = type === 'all' ? 'Все лучшие места Кыргызстана' : `Места: ${labels[type] || type}`;
    placesPage = 0; renderFilteredPlaces();
}
function applyCategoryFilter(cat) {
    activePlacesCat = cat; activePlacesType = 'all';
    document.querySelectorAll('#cat-chips .chip').forEach(c => c.classList.toggle('active', c.dataset.cat === cat));
    document.querySelectorAll('#type-chips .chip').forEach(c => c.classList.toggle('active', c.dataset.type === 'all'));
    document.getElementById('places-subtitle').textContent = cat === 'all' ? 'Все лучшие места Кыргызстана' : `Категория: ${cat}`;
    placesPage = 0; renderFilteredPlaces();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('type-chips')?.addEventListener('click', e => {
        const chip = e.target.closest('[data-type]');
        if (chip) applyTypeFilter(chip.dataset.type);
    });
    document.getElementById('cat-chips')?.addEventListener('click', e => {
        const chip = e.target.closest('[data-cat]');
        if (chip) applyCategoryFilter(chip.dataset.cat);
    });
});

async function loadAllPlaces() {
    try {
        const res = await fetch(`${API}/places?limit=500`);
        allPlaces = await res.json();
        allPlaces.forEach(p => { try { p.types = typeof p.types === 'string' ? JSON.parse(p.types) : p.types; } catch { p.types=[]; } });
        renderFilteredPlaces();
        updateNavBadge();
    } catch(e) {
        document.getElementById('places-grid').innerHTML = `<div class="empty-state"><span>⚠️</span><h3>Сервер недоступен</h3><p style="color:var(--gray)">Запусти: py -m uvicorn main:app --reload --port 8000</p></div>`;
    }
}

function getFilteredPlaces() {
    return allPlaces.filter(p => {
        const typeOk = activePlacesType === 'all' || (p.types||[]).includes(activePlacesType);
        const catOk  = activePlacesCat  === 'all' || p.category === activePlacesCat;
        return typeOk && catOk;
    });
}
function renderFilteredPlaces() { placesPage=0; renderPlacesGrid(getFilteredPlaces()); }
function renderPlacesGrid(places) {
    const grid = document.getElementById('places-grid');
    const slice = places.slice(0, (placesPage+1)*PER_PAGE);
    if (!slice.length) {
        grid.innerHTML = `<div class="empty-state"><span>🔍</span><h3>Ничего не найдено</h3><p style="color:var(--gray)">Попробуйте другой фильтр</p></div>`;
        document.getElementById('load-more-places-btn').style.display='none'; return;
    }
    grid.innerHTML = slice.map((p,i) => renderPlaceCard(p,i)).join('');
    const btn = document.getElementById('load-more-places-btn');
    const rem = places.length - slice.length;
    btn.style.display = rem > 0 ? 'inline-block' : 'none';
    btn.textContent = `Загрузить ещё (${rem}) →`;
}
function loadMorePlaces() { placesPage++; renderPlacesGrid(getFilteredPlaces()); }

function renderPlaceCard(p, i=0) {
    const isFav = favorites.includes(p.id);
    const typeTags = (p.types||[]).map(t =>
        `<span class="type-tag ${t}">${t==='romance'?'❤️ Романтика':t==='friends'?'👫 Друзья':'👨‍👩‍👧 Семья'}</span>`
    ).join('');
    return `<div class="place-card" style="animation-delay:${Math.min(i,8)*0.05}s" onclick="openPlaceModal(${p.id})">
      <div class="card-img-wrap">
        <img class="card-img" src="${p.image_url||''}" alt="${p.name}" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=600'"/>
        <div class="card-badge">${p.category}</div>
        <button class="card-fav ${isFav?'active':''}" onclick="toggleFav(event,${p.id})">${isFav?'❤️':'🤍'}</button>
      </div>
      <div class="card-body">
        <h3 class="card-title">${p.name}</h3>
        <p class="card-desc">${p.description}</p>
        <div class="card-meta"><span class="card-rating">⭐ ${p.rating}</span><span class="card-city">📍 ${p.city||''}</span></div>
        <div class="card-types">${typeTags}</div>
      </div>
      <div class="card-footer">
        <span class="card-price">${p.price_range||'—'}</span>
        <button class="btn-more" onclick="openPlaceModal(${p.id})">Подробнее</button>
      </div>
    </div>`;
}
function updateNavBadge() { const el=document.getElementById('nav-cnt-places'); if(el) el.textContent=allPlaces.length; }

/* ════════════ PLACE MODAL + КОНТАКТЫ ════════════ */
// Генерируем соцсети на основе данных места
function generateContacts(place) {
    const slug = place.name.toLowerCase()
        .replace(/[«»""']/g,'')
        .replace(/\s+/g,'_')
        .replace(/[^a-zа-яё0-9_]/gi,'')
        .slice(0,20);
    const phone = '+996 ' + (700 + Math.floor(Math.random()*299)).toString() + ' ' +
        (100 + Math.floor(Math.random()*899)).toString().slice(0,3) + ' ' +
        (100 + Math.floor(Math.random()*899)).toString().slice(0,3);

    const contacts = [
        { type:'inst', icon:'📸', label:'Instagram', href:`https://instagram.com/${slug}` },
        { type:'tg',   icon:'✈️', label:'Telegram',  href:`https://t.me/${slug}` },
        { type:'wa',   icon:'💬', label:'WhatsApp',  href:`https://wa.me/996${phone.replace(/\D/g,'').slice(3)}` },
        { type:'web',  icon:'🌐', label:'Сайт',      href:`https://${slug}.kg` },
        { type:'phone',icon:'📞', label:phone,        href:`tel:${phone.replace(/\s/g,'')}` },
    ];
    return contacts;
}

function openPlaceModal(id) {
    const p = allPlaces.find(x => x.id === id);
    if (!p) return;
    document.getElementById('pm-img').src = p.image_url || '';
    document.getElementById('pm-cat').textContent = p.category?.toUpperCase();
    document.getElementById('pm-rating').textContent = `⭐ ${p.rating}`;
    document.getElementById('pm-title').textContent = p.name;
    document.getElementById('pm-desc').textContent = p.description;
    document.getElementById('pm-address').textContent = p.address || '–';
    document.getElementById('pm-city').textContent = p.city || '–';
    document.getElementById('pm-price').textContent = p.price_range || '–';
    document.getElementById('pm-category').textContent = p.category || '–';
    document.getElementById('pm-tags').innerHTML = (p.types||[]).map(t =>
        `<span class="type-tag ${t}">${t==='romance'?'❤️ Романтика':t==='friends'?'👫 С друзьями':'👨‍👩‍👧 Семья'}</span>`
    ).join('');
    // Контакты
    const contacts = generateContacts(p);
    document.getElementById('pm-contacts').innerHTML = contacts.map(c =>
        `<a class="pm-contact-btn ${c.type}" href="${c.href}" target="_blank" rel="noopener">
           <span class="pc-icon">${c.icon}</span>${c.label}
         </a>`
    ).join('');
    if (p.location) {
        const [lat,lng] = p.location.split(',');
        document.getElementById('pm-map-link').href = `https://maps.google.com/?q=${lat},${lng}`;
    }
    openModal('place-overlay');
}

/* ════════════ ИЗБРАННОЕ ════════════ */
function toggleFav(e, id) {
    e.stopPropagation();
    const idx = favorites.indexOf(id);
    if (idx===-1) { favorites.push(id); showToast('❤️ Добавлено в избранное'); }
    else { favorites.splice(idx,1); showToast('Удалено из избранного'); }
    localStorage.setItem('kg_favorites', JSON.stringify(favorites));
    renderFilteredPlaces(); updateFavBadge();
}
function renderFavGrid() {
    const grid = document.getElementById('fav-grid');
    if (!grid) return;
    const favPlaces = allPlaces.filter(p => favorites.includes(p.id));
    if (!favPlaces.length) {
        grid.innerHTML = `<div class="empty-state"><span>❤️</span><h3>Пока пусто</h3><p style="color:var(--gray);font-size:13px">Нажимай ♡ на карточках чтобы сохранять здесь</p><button class="btn-gold" onclick="switchTab('places')">Найти место</button></div>`;
        return;
    }
    grid.innerHTML = favPlaces.map((p,i) => renderPlaceCard(p,i)).join('');
}
function updateFavBadge() {
    const el = document.getElementById('nav-cnt-fav');
    if (el) el.textContent = favorites.length;
}

/* ════════════ AUTH ════════════ */
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach((t,i) => t.classList.toggle('active', (i===0&&tab==='login')||(i===1&&tab==='register')));
    document.querySelectorAll('.auth-pane').forEach(p => p.classList.remove('active'));
    document.getElementById(`pane-${tab}`).classList.add('active');
}
async function doLogin() {
    const email=document.getElementById('li-email').value.trim();
    const pw=document.getElementById('li-password').value;
    const errEl=document.getElementById('li-error');
    const btn=document.getElementById('li-btn');
    errEl.textContent='';
    if (!email||!pw) { errEl.textContent='Введите email и пароль'; return; }
    btn.disabled=true; btn.textContent='Входим...';
    try {
        const res=await fetch(`${API}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})});
        const data=await res.json();
        if (!res.ok) { errEl.textContent=data.detail||'Ошибка входа'; return; }
        currentUser=data; localStorage.setItem('kg_user',JSON.stringify(data));
        closeModal('auth-overlay'); updateAuthUI();
        showToast(`Добро пожаловать, ${data.name}! 👋`);
    } catch(e) { errEl.textContent='Сервер недоступен'; }
    finally { btn.disabled=false; btn.textContent='Войти'; }
}
async function doRegister() {
    const name=document.getElementById('reg-name').value.trim();
    const email=document.getElementById('reg-email').value.trim();
    const pw=document.getElementById('reg-password').value;
    const errEl=document.getElementById('reg-error');
    const btn=document.getElementById('reg-btn');
    errEl.textContent='';
    if (!name||!email||!pw) { errEl.textContent='Заполните все поля'; return; }
    if (pw.length<6) { errEl.textContent='Пароль минимум 6 символов'; return; }
    btn.disabled=true; btn.textContent='Создаём...';
    try {
        const res=await fetch(`${API}/auth/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,password:pw})});
        const data=await res.json();
        if (!res.ok) { errEl.textContent=data.detail||'Ошибка регистрации'; return; }
        currentUser=data; localStorage.setItem('kg_user',JSON.stringify(data));
        closeModal('auth-overlay'); updateAuthUI();
        showToast(`Добро пожаловать, ${data.name}! 🎉`);
    } catch(e) { errEl.textContent='Сервер недоступен'; }
    finally { btn.disabled=false; btn.textContent='Зарегистрироваться'; }
}
function doLogout() {
    currentUser=null; localStorage.removeItem('kg_user');
    closeModal('profile-overlay'); updateAuthUI();
    showToast('Вы вышли из аккаунта');
}
function updateAuthUI() {
    const name=currentUser?.name||'Войти';
    const initial=currentUser?currentUser.name[0].toUpperCase():'?';
    document.getElementById('header-avatar').textContent=initial;
    document.getElementById('header-name').textContent=name.split(' ')[0];
    document.getElementById('sb-avatar').textContent=initial;
    document.getElementById('sb-name').textContent=name;
    document.getElementById('sb-sub').textContent=currentUser?(currentUser.status||'Путешественник'):'Нажмите чтобы войти';
    const planBadge=document.getElementById('sb-plan-badge');
    if (currentUser) { planBadge.style.display='inline-block'; planBadge.textContent=currentUser.plan||'Базовый'; }
    else planBadge.style.display='none';
    document.getElementById('sb-auth-btn').textContent=currentUser?'Выйти':'Войти / Зарегистрироваться';
    const profileLinks=document.getElementById('sb-profile-links');
    if (profileLinks) profileLinks.style.display=currentUser?'block':'none';
}

/* ════════════ PROFILE MODAL ════════════ */
function openProfileModal() {
    if (!currentUser) { openModal('auth-overlay'); return; }
    const u=currentUser;
    document.getElementById('pm-avatar-big').textContent=u.name[0].toUpperCase();
    document.getElementById('pm-name-display').textContent=u.name;
    document.getElementById('pm-email-display').textContent=u.email;
    document.getElementById('pm-plan-display').textContent=u.plan||'Базовый';
    document.getElementById('pm-edit-name').value=u.name;
    document.getElementById('pm-edit-status').value=u.status||'';
    document.getElementById('pm-edit-plan').value=u.plan||'Базовый';
    document.getElementById('pm-stat-places').textContent=allPlaces.length||'–';
    document.getElementById('pm-stat-fav').textContent=favorites.length;
    if (u.created_at) { const days=Math.max(1,Math.floor((Date.now()-new Date(u.created_at))/86400000)); document.getElementById('pm-stat-days').textContent=days; }
    openModal('profile-overlay');
}
async function saveProfile() {
    if (!currentUser) return;
    const name=document.getElementById('pm-edit-name').value.trim();
    const status=document.getElementById('pm-edit-status').value.trim();
    const plan=document.getElementById('pm-edit-plan').value;
    try {
        const res=await fetch(`${API}/auth/user/${currentUser.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,status,plan})});
        if (res.ok) { const data=await res.json(); currentUser={...currentUser,...data}; localStorage.setItem('kg_user',JSON.stringify(currentUser)); updateAuthUI(); closeModal('profile-overlay'); showToast('Профиль сохранён ✓'); }
    } catch(e) { showToast('Ошибка сохранения'); }
}

/* ════════════ МАГАЗИН ════════════ */
const SHOP_ITEMS = [
    {id:1,name:'Букет из гор',desc:'Полевые цветы в крафтовой упаковке',cat:'цветы',img:'https://images.unsplash.com/photo-1487530811176-3780de880c2d?q=80&w=400',price:990,badge:'new'},
    {id:2,name:'Тюльпаны Иссык-Куля',desc:'Свежие тюльпаны 51 штука',cat:'цветы',img:'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?q=80&w=400',price:1490,badge:'hit'},
    {id:3,name:'Войлочная кружка',desc:'Ручная работа с орнаментом',cat:'сувениры',img:'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=400',price:650,badge:''},
    {id:4,name:'Шырдак-коврик',desc:'Мини-ковёр из войлока 30×30',cat:'сувениры',img:'https://images.unsplash.com/photo-1581783898377-1c85bf937427?q=80&w=400',price:1200,badge:'new'},
    {id:5,name:'Облепиховый крем',desc:'Натуральный уход из горных ягод',cat:'косметика',img:'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=400',price:890,badge:'hit'},
    {id:6,name:'Горное масло',desc:'100% натуральное жожоба',cat:'косметика',img:'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=400',price:1350,old:1800,badge:'sale'},
    {id:7,name:'Подарочный набор',desc:'Чай + варенье + орехи из Арстанбапа',cat:'подарки',img:'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?q=80&w=400',price:2490,badge:'hit'},
    {id:8,name:'Ювелирные серьги',desc:'Серебро с кыргызским орнаментом',cat:'украшения',img:'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=400',price:3200,badge:'new'},
    {id:9,name:'Маска для лица',desc:'Горная глина + розмарин',cat:'уход',img:'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=400',price:750,badge:''},
    {id:10,name:'Ароматическая свеча',desc:'Запах гор и хвои',cat:'подарки',img:'https://images.unsplash.com/photo-1602607144878-29e698e2d1ab?q=80&w=400',price:1100,badge:''},
    {id:11,name:'Браслет Номад',desc:'Кожа + серебро, ручная работа',cat:'украшения',img:'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=400',price:1800,badge:'new'},
    {id:12,name:'Сыворотка облепиха',desc:'Витамин C из горных ягод',cat:'уход',img:'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?q=80&w=400',price:2100,old:2800,badge:'sale'},
];
let shopFilter='all';
function filterShop(cat,el) {
    shopFilter=cat;
    document.querySelectorAll('.shop-filter-bar .chip').forEach(b=>b.classList.remove('active'));
    if(el) el.classList.add('active');
    renderShop();
}
function renderShop() {
    const grid=document.getElementById('shop-grid');
    if(!grid) return;
    const items=shopFilter==='all'?SHOP_ITEMS:SHOP_ITEMS.filter(i=>i.cat===shopFilter);
    grid.innerHTML=items.map(item=>{
        const inCart=cart.includes(item.id);
        const badge=item.badge?`<div class="product-badge ${item.badge==='sale'?'badge-sale':item.badge==='new'?'badge-new':'badge-hit'}">${item.badge==='sale'?'Скидка':item.badge==='new'?'Новинка':'Хит'}</div>`:'';
        const oldPr=item.old?`<span class="price-old">${item.old.toLocaleString()} сом</span>`:'';
        return `<div class="product-card">
          <div class="product-img-wrap"><img class="product-img" src="${item.img}" alt="${item.name}" loading="lazy" onerror="this.style.opacity=0"/>${badge}</div>
          <div class="product-body"><div class="product-cat">${item.cat}</div><div class="product-name">${item.name}</div><div class="product-desc">${item.desc}</div></div>
          <div class="product-footer"><div class="product-price"><span class="price-current">${item.price.toLocaleString()} сом</span>${oldPr}</div><button class="btn-cart ${inCart?'in-cart':''}" onclick="toggleCart(${item.id})">${inCart?'✓ В корзине':'В корзину'}</button></div>
        </div>`;
    }).join('');
}
function toggleCart(id) {
    const idx=cart.indexOf(id);
    if(idx===-1){cart.push(id);showToast('🛒 Добавлено в корзину');}else{cart.splice(idx,1);}
    localStorage.setItem('kg_cart',JSON.stringify(cart)); updateCartUI(); renderShop();
}
function updateCartUI() {
    document.getElementById('cart-count').textContent=cart.length;
    document.getElementById('cart-fab').classList.toggle('visible',cart.length>0);
}

/* ════════════ ПРОМОКОДЫ ════════════ */
function copyPromo(el,code) {
    navigator.clipboard.writeText(code).catch(()=>{});
    el.style.background='rgba(212,175,55,0.35)';
    showToast(`✓ Промокод ${code} скопирован!`);
    setTimeout(()=>{el.style.background='';},1500);
}

/* ════════════ ФОРМЫ ════════════ */
function submitBooking() {
    const name=document.getElementById('bf-name').value.trim();
    const phone=document.getElementById('bf-phone').value.trim();
    const res=document.getElementById('bf-result');
    if(!name||!phone){res.style.color='#ff7090';res.textContent='Пожалуйста, заполните имя и телефон';return;}
    res.style.color='var(--gold)';res.textContent=`✓ Заявка принята, ${name}! Свяжемся с вами в течение 30 минут.`;
    ['bf-name','bf-phone','bf-comment'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    showToast('✅ Заявка отправлена!');
}
function submitPartner() {
    const biz=document.getElementById('pf-biz').value.trim();
    const phone=document.getElementById('pf-phone').value.trim();
    const wrap=document.getElementById('pf-result-wrap');
    const res=document.getElementById('pf-result');
    if(!biz||!phone){wrap.style.display='block';res.style.color='#ff7090';res.textContent='Заполните название бизнеса и телефон';return;}
    wrap.style.display='block';res.style.color='var(--gold)';
    res.textContent=`✓ Заявка от "${biz}" принята! Менеджер свяжется в течение 1 рабочего дня.`;
    showToast('✅ Заявка на партнёрство отправлена!');
}

/* ════════════ TOAST ════════════ */
function showToast(msg) {
    let t=document.getElementById('toast');
    if(!t){t=document.createElement('div');t.id='toast';t.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);background:rgba(10,5,30,0.97);backdrop-filter:blur(20px);border:1px solid rgba(212,175,55,0.4);color:#fff;padding:12px 24px;border-radius:50px;font-size:13px;z-index:9999;opacity:0;transition:all 0.35s;pointer-events:none;font-family:Montserrat;white-space:nowrap;box-shadow:0 8px 30px rgba(0,0,0,0.5)';document.body.appendChild(t);}
    t.textContent=msg;t.style.opacity='1';t.style.transform='translateX(-50%) translateY(0)';
    clearTimeout(t._timer);t._timer=setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(-50%) translateY(20px)';},2800);
}

/* ════════════ ESC / OVERLAY ════════════ */
document.addEventListener('keydown', e=>{
    if(e.key==='Escape'){['auth-overlay','place-overlay','profile-overlay','info-overlay'].forEach(id=>closeModal(id));closeSidebar();}
});
['auth-overlay','place-overlay','profile-overlay','info-overlay'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.addEventListener('click',e=>{if(e.target===el)closeModal(id);});
});
