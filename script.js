/**
 * KG GUIDE v2 — script.js
 */

const API = 'http://localhost:8000';

// ════ STATE ════
const state = {
    favorites: new Set(JSON.parse(localStorage.getItem('kg_fav') || '[]')),
    user:      JSON.parse(localStorage.getItem('kg_user') || 'null'),
    filters:   { cat:'all', type:'all', city:'all', search:'' },
    timer:     null,
};

// ════ UTILS ════
const $ = (s, ctx=document) => ctx.querySelector(s);
const $$ = (s, ctx=document) => [...ctx.querySelectorAll(s)];
const parseTypes = (t) => { if (!t) return []; if (Array.isArray(t)) return t; try{return JSON.parse(t);}catch{return [];} };
const typeLabel = (t) => ({ romance:'❤ Романтика', friends:'👥 Друзья', family:'👨‍👩‍👧 Семья' }[t] || t);
const getRecMap = () => ({ romance:{icon:'❤️',text:'Идеально для романтического свидания'}, friends:{icon:'🎉',text:'Отлично для компании и праздников'}, family:{icon:'👨‍👩‍👧',text:'Прекрасно для всей семьи'} });

// ════ API ════
async function fetchPlaces(params={}) {
    const url = new URL(`${API}/places`);
    Object.entries(params).forEach(([k,v]) => { if (v && v!=='all') url.searchParams.append(k,v); });
    const r = await fetch(url); if (!r.ok) throw new Error(); return r.json();
}
async function fetchPlace(id) { const r = await fetch(`${API}/places/${id}`); if (!r.ok) throw new Error(); return r.json(); }
async function fetchCategories() { try{const r=await fetch(`${API}/categories`);return r.ok?r.json():[];}catch{return[];} }
async function fetchCities() { try{const r=await fetch(`${API}/cities`);return r.ok?r.json():[];}catch{return[];} }

// ════ RENDER CARD ════
function renderCard(p, delay=0) {
    const types = parseTypes(p.types);
    const isFav = state.favorites.has(p.id);
    const rating = p.rating ? p.rating.toFixed(1) : '—';
    const typeTags = types.map(t=>`<span class="type-tag ${t}">${typeLabel(t)}</span>`).join('');

    const card = document.createElement('div');
    card.className = 'place-card';
    card.style.animationDelay = `${delay}ms`;
    card.dataset.id = p.id;
    card.innerHTML = `
        <div class="card-img-wrap">
            <img class="card-img" src="${p.image_url||'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800'}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=800'">
            <span class="card-badge">${p.category}</span>
            <button class="card-fav ${isFav?'active':''}" data-id="${p.id}">${isFav?'❤️':'🤍'}</button>
        </div>
        <div class="card-body">
            <h3 class="card-title">${p.name}</h3>
            <p class="card-desc">${p.description}</p>
            <div class="card-meta">
                <span class="card-rating">⭐ ${rating}</span>
                ${p.city?`<span class="card-city">📍 ${p.city}</span>`:''}
            </div>
            ${typeTags?`<div class="card-types">${typeTags}</div>`:''}
        </div>
        <div class="card-footer">
            <span class="card-price">${p.price_range||''}</span>
            <button class="btn-more" data-id="${p.id}">Подробнее →</button>
        </div>`;

    card.querySelector('.card-fav').addEventListener('click', e => { e.stopPropagation(); toggleFav(p.id, card.querySelector('.card-fav')); });
    card.querySelector('.btn-more').addEventListener('click', e => { e.stopPropagation(); openPlaceModal(p.id); });
    card.addEventListener('click', () => openPlaceModal(p.id));
    return card;
}

function renderGrid(places, container) {
    container.innerHTML = '';
    if (!places.length) { $('#no-results') && ($('#no-results').style.display='block'); return; }
    $('#no-results') && ($('#no-results').style.display='none');
    places.forEach((p,i) => container.appendChild(renderCard(p, i*55)));
}

// ════ FAVORITES ════
function toggleFav(id, btn) {
    if (state.favorites.has(id)) { state.favorites.delete(id); btn.innerHTML='🤍'; btn.classList.remove('active'); }
    else { state.favorites.add(id); btn.innerHTML='❤️'; btn.classList.add('active'); }
    localStorage.setItem('kg_fav', JSON.stringify([...state.favorites]));
    updateFavBadge();
}
function updateFavBadge() {
    const n = state.favorites.size;
    $$('.fav-badge-count').forEach(b => { b.textContent=n; b.style.display=n>0?'inline-flex':'none'; });
}
async function renderFavorites() {
    const grid = $('#favorites-grid');
    if (!grid) return;
    if (!state.favorites.size) { grid.innerHTML=`<div class="empty-state"><span>🗺</span><h3>Список пуст</h3><p>Нажмите ❤ на карточке</p><button class="btn-gold tab-link" data-target="places">Найти места</button></div>`; attachTabLinks(); return; }
    grid.innerHTML='<div class="loading-state"><div class="spinner"></div><p>Загружаем...</p></div>';
    try {
        const items = (await Promise.all([...state.favorites].map(id=>fetchPlace(id).catch(()=>null)))).filter(Boolean);
        renderGrid(items, grid);
        const sub=$('#fav-subtitle'); if(sub) sub.textContent=`${items.length} мест сохранено`;
    } catch { grid.innerHTML='<div class="loading-state"><p>Ошибка загрузки</p></div>'; }
}

// ════ PLACE MODAL ════
async function openPlaceModal(id) {
    const overlay=$('#place-overlay'), body=$('#place-modal-body');
    overlay.classList.add('open'); document.body.style.overflow='hidden';
    body.innerHTML='<div class="loading-state"><div class="spinner"></div></div>';
    try {
        const p = await fetchPlace(id);
        const types = parseTypes(p.types);
        const recMap = getRecMap();
        const recs = types.map(t=>recMap[t]).filter(Boolean);
        const mapUrl = p.location ? `https://www.google.com/maps/search/?api=1&query=${p.location}` : null;

        body.innerHTML = `
            <img class="pm-img" src="${p.image_url||'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200'}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=1200'">
            <div class="pm-body">
                <div class="pm-top"><span class="pm-cat">${p.category}</span><span class="pm-rating">⭐ ${p.rating?p.rating.toFixed(1):'—'}</span></div>
                <h2 class="pm-title">${p.name}</h2>
                <p class="pm-desc">${p.description}</p>
                <div class="pm-grid">
                    ${p.address?`<div class="pm-info"><div class="lbl">📍 Адрес</div><div class="val">${p.address}</div></div>`:''}
                    ${p.city?`<div class="pm-info"><div class="lbl">🏙 Город</div><div class="val">${p.city}</div></div>`:''}
                    ${p.price_range?`<div class="pm-info"><div class="lbl">💰 Стоимость</div><div class="val">${p.price_range}</div></div>`:''}
                    ${p.rating?`<div class="pm-info"><div class="lbl">⭐ Рейтинг</div><div class="val">${p.rating.toFixed(1)} / 5.0</div></div>`:''}
                </div>
                <div class="pm-tags">${types.map(t=>`<span class="type-tag ${t}">${typeLabel(t)}</span>`).join('')}</div>
                ${recs.length?`<div class="pm-recs"><h4>Рекомендации</h4>${recs.map(r=>`<div class="pm-rec"><span style="font-size:20px">${r.icon}</span>${r.text}</div>`).join('')}</div>`:''}
                ${mapUrl?`<a href="${mapUrl}" target="_blank" class="pm-map">🗺 Открыть на Google Maps</a>`:''}
            </div>`;
    } catch { body.innerHTML='<div class="loading-state"><p>Ошибка загрузки</p></div>'; }
}
function closePlaceModal() { $('#place-overlay').classList.remove('open'); document.body.style.overflow=''; }

// ════ PLACES PAGE ════
async function loadPlaces() {
    const grid=$('#places-grid'), noR=$('#no-results'), cnt=$('#places-count');
    if (!grid) return;
    grid.innerHTML='<div class="loading-state"><div class="spinner"></div><p>Загружаем...</p></div>';
    if(noR) noR.style.display='none';
    try {
        const params={};
        if(state.filters.cat!=='all')    params.category=state.filters.cat;
        if(state.filters.type!=='all')   params.type=state.filters.type;
        if(state.filters.city!=='all')   params.city=state.filters.city;
        if(state.filters.search)         params.search=state.filters.search;
        const places = await fetchPlaces(params);
        renderGrid(places, grid);
        if(cnt) cnt.textContent=`Найдено: ${places.length} мест`;
    } catch {
        grid.innerHTML='<div class="loading-state"><p>⚠ Backend не запущен. Запустите:<br><code>uvicorn main:app --reload --port 8000</code></p></div>';
    }
}

// ════ FEATURED ════
async function loadFeatured() {
    const grid=$('#featured-grid'); if(!grid) return;
    try {
        const all = await fetchPlaces({limit:20});
        const top = all.filter(p=>(p.rating||0)>=4.7).slice(0,6);
        renderGrid(top.length?top:all.slice(0,6), grid);
    } catch {
        grid.innerHTML='<div class="loading-state"><p>⚠ Backend не запущен</p></div>';
    }
}

// ════ FILTERS INIT ════
async function initFilters() {
    const catChips = $('#category-chips');
    const cats = await fetchCategories();
    cats.forEach(cat => {
        const b=document.createElement('button');
        b.className='chip'; b.dataset.cat=cat;
        b.textContent=cat.charAt(0).toUpperCase()+cat.slice(1);
        catChips.appendChild(b);
    });
    const citySelect=$('#city-filter');
    const cities = await fetchCities();
    cities.forEach(c => {
        const o=document.createElement('option');
        o.value=c; o.textContent=c; citySelect.appendChild(o);
    });

    $$('.filter-chips').forEach(group => {
        group.addEventListener('click', e => {
            const chip=e.target.closest('.chip'); if(!chip) return;
            if(chip.dataset.cat!==undefined) { $$('.chip[data-cat]').forEach(c=>c.classList.remove('active')); chip.classList.add('active'); state.filters.cat=chip.dataset.cat; }
            if(chip.dataset.type!==undefined) { $$('.chip[data-type]').forEach(c=>c.classList.remove('active')); chip.classList.add('active'); state.filters.type=chip.dataset.type; }
            loadPlaces();
        });
    });
    citySelect && citySelect.addEventListener('change', () => { state.filters.city=citySelect.value; loadPlaces(); });
}

// ════ AUTH ════
function initAuth() {
    const authOverlay = $('#auth-overlay');

    function openAuth(tab='login') {
        authOverlay.classList.add('open');
        document.body.style.overflow='hidden';
        $$('.auth-tab').forEach(t=>t.classList.remove('active'));
        $$('.auth-pane').forEach(p=>p.classList.remove('active'));
        $(`.auth-tab[data-auth="${tab}"]`).classList.add('active');
        $(`#auth-${tab}`).classList.add('active');
    }
    function closeAuth() { authOverlay.classList.remove('open'); document.body.style.overflow=''; }

    // Open triggers
    $('#profile-btn').addEventListener('click', () => state.user ? openProfileMenu() : openAuth('login'));
    $('#sb-auth-btn').addEventListener('click', () => openAuth('login'));
    $('#sb-profile-area').addEventListener('click', () => !state.user && openAuth('login'));
    $('#auth-close').addEventListener('click', closeAuth);
    authOverlay.addEventListener('click', e => { if(e.target===authOverlay) closeAuth(); });

    // Switch tabs
    $$('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            $$('.auth-tab').forEach(t=>t.classList.remove('active'));
            $$('.auth-pane').forEach(p=>p.classList.remove('active'));
            tab.classList.add('active');
            $(`#auth-${tab.dataset.auth}`).classList.add('active');
        });
    });

    $('#go-register').addEventListener('click', e => { e.preventDefault(); openAuth('register'); });
    $('#go-login').addEventListener('click', e => { e.preventDefault(); openAuth('login'); });

    // LOGIN
    $('#btn-login').addEventListener('click', () => {
        const email=$('#login-email').value.trim();
        const pass=$('#login-pass').value;
        if(!email||!pass) { alert('Заполните все поля'); return; }
        const users = JSON.parse(localStorage.getItem('kg_users')||'[]');
        const found = users.find(u=>u.email===email&&u.pass===pass);
        if(!found) { alert('Неверный email или пароль'); return; }
        loginUser(found); closeAuth();
    });

    // REGISTER
    $('#btn-register').addEventListener('click', () => {
        const name=$('#reg-name').value.trim();
        const email=$('#reg-email').value.trim();
        const pass=$('#reg-pass').value;
        if(!name||!email||!pass) { alert('Заполните все поля'); return; }
        if(pass.length<6) { alert('Пароль минимум 6 символов'); return; }
        const users = JSON.parse(localStorage.getItem('kg_users')||'[]');
        if(users.find(u=>u.email===email)) { alert('Этот email уже зарегистрирован'); return; }
        const user = { id:Date.now(), name, email, pass };
        users.push(user); localStorage.setItem('kg_users', JSON.stringify(users));
        loginUser(user); closeAuth();
    });
}

function loginUser(user) {
    state.user = user;
    localStorage.setItem('kg_user', JSON.stringify(user));
    updateProfileUI();
}

function logoutUser() {
    state.user = null;
    localStorage.removeItem('kg_user');
    updateProfileUI();
}

function updateProfileUI() {
    const u = state.user;
    const initial = u ? u.name.charAt(0).toUpperCase() : '?';
    const name    = u ? u.name : 'Войти';

    // Header
    const ha=$('#header-avatar'), hn=$('#header-name');
    if(ha) ha.textContent=initial;
    if(hn) hn.textContent=name;

    // Sidebar
    const sa=$('#sb-avatar'), sn=$('#sb-name-text'), ss=$('#sb-sub-text');
    if(sa) sa.textContent=initial;
    if(sn) sn.textContent=u ? u.name : 'Войдите в аккаунт';
    if(ss) ss.textContent=u ? u.email : 'для доступа к профилю';

    // Auth button in sidebar
    const sbBtn=$('#sb-auth-btn');
    if(sbBtn) sbBtn.textContent=u ? 'Выйти из аккаунта' : 'Войти / Регистрация';
    if(u) {
        sbBtn && sbBtn.removeEventListener('click', sbBtn._handler);
        sbBtn && (sbBtn._handler=()=>{ logoutUser(); });
        sbBtn && sbBtn.addEventListener('click', sbBtn._handler);
    }
}

function openProfileMenu() {
    if(!state.user) return;
    if(confirm(`Вы вошли как ${state.user.name}.\nВыйти из аккаунта?`)) logoutUser();
}

// ════ SIDEBAR ════
function initSidebar() {
    const sb=$('#sidebar'), ov=$('#sidebar-overlay');
    const open=()=>{ sb.classList.add('open'); ov.classList.add('active'); document.body.style.overflow='hidden'; };
    const close=()=>{ sb.classList.remove('open'); ov.classList.remove('active'); document.body.style.overflow=''; };
    $('.open-sidebar') && $('.open-sidebar').addEventListener('click', open);
    $('.close-sidebar') && $('.close-sidebar').addEventListener('click', close);
    ov && ov.addEventListener('click', close);
    document.addEventListener('keydown', e => { if(e.key==='Escape'){ close(); closePlaceModal(); $('#auth-overlay').classList.remove('open'); document.body.style.overflow=''; } });
}

// ════ NAVIGATION ════
function switchTab(targetId, opts={}) {
    $('#sidebar').classList.remove('open');
    $('#sidebar-overlay').classList.remove('active');
    document.body.style.overflow='';

    $$('.tab-pane').forEach(p=>p.classList.remove('active'));
    $$('.tab-link').forEach(l=>l.classList.remove('active'));
    const target=$(`#${targetId}`); if(target) target.classList.add('active');
    $$(`.tab-link[data-target="${targetId}"]`).forEach(l=>l.classList.add('active'));
    window.scrollTo({top:0,behavior:'smooth'});

    if(targetId==='places') {
        if(opts.cat)  { state.filters.cat=opts.cat; state.filters.type='all'; }
        if(opts.type) { state.filters.type=opts.type; state.filters.cat='all'; }
        loadPlaces();
    }
    if(targetId==='favorites') renderFavorites();
}

function attachTabLinks() {
    $$('.tab-link').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const target=link.dataset.target; if(!target) return;
            switchTab(target, { cat:link.dataset.cat, type:link.dataset.type });
        };
    });
}

// ════ SEARCH ════
function initSearch() {
    const toggle=$('#search-toggle'), bar=$('#search-bar'), input=$('#global-search'), close=$('#search-close-btn');
    toggle && toggle.addEventListener('click', () => { bar.classList.toggle('open'); if(bar.classList.contains('open')) input.focus(); });
    close  && close.addEventListener('click', () => { bar.classList.remove('open'); input.value=''; state.filters.search=''; });
    input  && input.addEventListener('input', () => {
        clearTimeout(state.timer);
        state.timer = setTimeout(() => { state.filters.search=input.value.trim(); switchTab('places'); }, 400);
    });
}

// ════ BOOKING FORM ════
function initBookingForm() {
    const btn=$('#bf-submit'), res=$('#bf-result');
    btn && btn.addEventListener('click', () => {
        const name=$('#bf-name').value.trim(), phone=$('#bf-phone').value.trim(), msg=$('#bf-msg').value.trim();
        if(!name||!phone) { res.className=''; res.textContent='Пожалуйста, заполните имя и телефон.'; return; }
        btn.disabled=true; btn.textContent='Отправка...';
        setTimeout(() => {
            res.className='ok'; res.textContent='✓ Заявка принята! Свяжемся с вами в течение часа.';
            btn.disabled=false; btn.textContent='Отправить заявку';
            $('#bf-name').value=''; $('#bf-phone').value=''; $('#bf-msg').value='';
        }, 1500);
    });
}

// ════ HEADER SCROLL ════
window.addEventListener('scroll', () => $('#main-header').classList.toggle('scrolled', scrollY>50), {passive:true});

// ════ BENTO ════
function initBento() {
    $$('.bento-item').forEach(item => {
        item.addEventListener('click', () => {
            switchTab('places', { cat:item.dataset.cat, type:item.dataset.type });
        });
    });
}

// ════ BOOT ════
document.addEventListener('DOMContentLoaded', async () => {
    initSidebar();
    initAuth();
    initSearch();
    initBento();
    initBookingForm();

    $('#place-modal-close') && $('#place-modal-close').addEventListener('click', closePlaceModal);
    $('#place-overlay') && $('#place-overlay').addEventListener('click', e => { if(e.target===$('#place-overlay')) closePlaceModal(); });

    attachTabLinks();
    updateProfileUI();
    updateFavBadge();

    await initFilters();
    await loadFeatured();
});

// ════ SHOP ════
const cart = JSON.parse(localStorage.getItem('kg_cart') || '[]');

function updateCartUI() {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const count = cart.reduce((s, i) => s + i.qty, 0);
    const fab = document.getElementById('cart-fab');
    const display = document.getElementById('cart-total-display');
    if (fab) {
        if (count > 0) { fab.classList.add('visible'); }
        else { fab.classList.remove('visible'); }
    }
    if (display) display.textContent = total.toLocaleString('ru') + ' сом';
    localStorage.setItem('kg_cart', JSON.stringify(cart));
}

function addToCart(btn, name, price) {
    const existing = cart.find(i => i.name === name);
    if (existing) { existing.qty++; }
    else { cart.push({ name, price, qty: 1 }); }
    btn.textContent = '✓ Добавлено';
    btn.classList.add('in-cart');
    setTimeout(() => { btn.textContent = 'В корзину'; btn.classList.remove('in-cart'); }, 1800);
    updateCartUI();
}

function openCartModal() {
    if (!cart.length) { alert('Корзина пуста'); return; }
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const items = cart.map(i => `• ${i.name} × ${i.qty} — ${(i.price*i.qty).toLocaleString('ru')} сом`).join('\n');
    if (confirm(`🛒 Ваш заказ:\n\n${items}\n\nИтого: ${total.toLocaleString('ru')} сом\n\nОформить заказ?`)) {
        cart.length = 0;
        updateCartUI();
        alert('✓ Заказ принят! Менеджер свяжется с вами в течение часа по номеру в профиле.');
    }
}

// ════ PROMO COPY ════
function copyPromo(code, el) {
    navigator.clipboard.writeText(code).then(() => {
        const orig = el.textContent;
        el.textContent = '✓ Скопировано!';
        el.style.background = 'rgba(80,220,130,0.15)';
        el.style.borderColor = 'rgba(80,220,130,0.4)';
        el.style.color = '#70e0a0';
        setTimeout(() => {
            el.textContent = orig;
            el.style.background = '';
            el.style.borderColor = '';
            el.style.color = '';
        }, 2000);
    }).catch(() => {
        el.textContent = code; // fallback
        alert('Промокод: ' + code);
    });
}

// ════ SHOP FILTER ════
function initShopFilter() {
    document.addEventListener('click', e => {
        const chip = e.target.closest('[data-shop-cat]');
        if (!chip) return;
        document.querySelectorAll('[data-shop-cat]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const cat = chip.dataset.shopCat;
        document.querySelectorAll('.product-card').forEach(card => {
            card.style.display = (cat === 'all' || card.dataset.shopCat === cat) ? '' : 'none';
        });
    });
}

// ════ PLAN MODAL ════
function showPlanModal(plan) {
    if (state.user) {
        alert(`✓ Тариф «${plan}» активирован!\n\nПромокоды и скидки появятся в вашем профиле.\nЕсли возникнут вопросы — напишите нам.`);
    } else {
        if (confirm(`Для оформления тарифа «${plan}» необходимо войти в аккаунт.\n\nВойти сейчас?`)) {
            document.getElementById('auth-overlay').classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    }
}

// ════ PARTNERSHIP FORM ════
function initPartnershipForm() {
    const btn = document.getElementById('pf-submit');
    const res = document.getElementById('pf-result');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const company = document.getElementById('pf-company').value.trim();
        const name = document.getElementById('pf-name').value.trim();
        const phone = document.getElementById('pf-phone').value.trim();
        if (!company || !name || !phone) {
            res.style.color = 'var(--primary)';
            res.textContent = 'Пожалуйста, заполните обязательные поля.';
            return;
        }
        btn.disabled = true; btn.textContent = 'Отправка...';
        setTimeout(() => {
            res.style.color = 'var(--gold)';
            res.textContent = '✓ Заявка принята! Наш менеджер свяжется с вами в течение 2 часов.';
            btn.disabled = false; btn.textContent = 'Отправить заявку';
            document.getElementById('pf-company').value = '';
            document.getElementById('pf-name').value = '';
            document.getElementById('pf-phone').value = '';
            document.getElementById('pf-email').value = '';
            document.getElementById('pf-msg').value = '';
        }, 1500);
    });
}

// ════ INIT NEW FEATURES ════
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    initShopFilter();
    initPartnershipForm();
    // SPC cards as tab-links already handled by attachTabLinks
});
