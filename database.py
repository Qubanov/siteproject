import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "kyrgyzstan.db")

SEED_PLACES = [
    {
        "name": "Ала-Арча",
        "description": "Национальный природный парк в 40 км от Бишкека. Живописные горные ущелья, водопады, альпийские луга и треккинговые маршруты разной сложности. Идеальное место для побега от городской суеты.",
        "category": "природа",
        "location": "42.5662,74.4884",
        "address": "Ала-Арчинское ущелье, 40 км к югу от Бишкека",
        "city": "Бишкек",
        "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200",
        "types": ["friends", "family", "romance"],
        "rating": 4.9,
        "price_range": "бесплатно"
    },
    {
        "name": "Ресторан «Дастархан»",
        "description": "Аутентичный кыргызский ресторан с традиционным интерьером юрт и живой этно-музыкой. Обязательно попробуйте бешбармак, шурпу и курут. Лучшее место для знакомства с кухней страны.",
        "category": "ресторан",
        "location": "42.8746,74.6122",
        "address": "ул. Московская 57, Бишкек",
        "city": "Бишкек",
        "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200",
        "types": ["family", "friends"],
        "rating": 4.7,
        "price_range": "1000–3000 сом"
    },
    {
        "name": "Иссык-Куль — Чолпон-Ата",
        "description": "Жемчужина Кыргызстана — горное озеро с кристально чистой водой, никогда не замерзающее зимой. Пляжи Чолпон-Аты — лучшее место для пляжного отдыха. Здесь также находятся наскальные рисунки петроглифы.",
        "category": "природа",
        "location": "42.6500,77.0833",
        "address": "г. Чолпон-Ата, побережье Иссык-Куля",
        "city": "Чолпон-Ата",
        "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200",
        "types": ["family", "romance", "friends"],
        "rating": 4.9,
        "price_range": "бесплатно"
    },
    {
        "name": "Bazaar Osh — Ошский рынок",
        "description": "Крупнейший центральноазиатский базар в сердце Бишкека. Сотни лавок со специями, сухофруктами, сувенирами, войлочными изделиями и традиционными кыргызскими товарами. Атмосфера настоящего Востока.",
        "category": "шоппинг",
        "location": "42.8801,74.5895",
        "address": "ул. Ибраимова, Бишкек (Ошский рынок)",
        "city": "Бишкек",
        "image_url": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1200",
        "types": ["family", "friends"],
        "rating": 4.5,
        "price_range": "любой бюджет"
    },
    {
        "name": "Кафе «Faiza»",
        "description": "Уютное кафе с домашней атмосферой, где подают лучшие лагман и манты в городе. Порции щедрые, цены честные, а хозяйка встречает каждого гостя как родного. Неизменный фаворит местных жителей.",
        "category": "кафе",
        "location": "42.8720,74.5980",
        "address": "ул. Чуй 125, Бишкек",
        "city": "Бишкек",
        "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200",
        "types": ["family", "friends"],
        "rating": 4.6,
        "price_range": "300–800 сом"
    },
    {
        "name": "Каньон Конорчек",
        "description": "Красные марсианские скалы в двух часах от Бишкека. Этот маленький «кыргызский Марс» поражает своими внеземными пейзажами: бурые каньоны, узкие проходы и оранжевые горы на фоне синего неба.",
        "category": "природа",
        "location": "42.6780,74.8901",
        "address": "Боомское ущелье, Чуйская область",
        "city": "Чуйская область",
        "image_url": "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200",
        "types": ["friends", "romance"],
        "rating": 4.8,
        "price_range": "200 сом / вход"
    },
    {
        "name": "Panorama Rooftop Bar",
        "description": "Стильный руфтоп-бар на крыше одного из высотных зданий Бишкека. Коктейли с видом на панораму города и горы Ала-Тоо на горизонте. Лучшее место для романтического вечера или встречи с друзьями.",
        "category": "кафе",
        "location": "42.8700,74.6050",
        "address": "пр. Чуй 200 (пентхаус, 18 этаж), Бишкек",
        "city": "Бишкек",
        "image_url": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1200",
        "types": ["romance", "friends"],
        "rating": 4.7,
        "price_range": "1500–4000 сом"
    },
    {
        "name": "Сувенирный магазин «Дордой Ар»",
        "description": "Лучшее место для покупки аутентичных кыргызских сувениров: войлочные шыйраки, кийизы, серебряные украшения, деревянные изделия с национальными орнаментами и ароматные специи. Всё ручной работы.",
        "category": "подарки",
        "location": "42.8765,74.6010",
        "address": "ул. Токтогула 88, Бишкек",
        "city": "Бишкек",
        "image_url": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200",
        "types": ["family", "friends"],
        "rating": 4.6,
        "price_range": "любой бюджет"
    },
    {
        "name": "Парк Ататюрка",
        "description": "Любимый городской парк Бишкека. Красивые аллеи, фонтаны, кафе под открытым небом и большой пруд. Вечерами здесь играет живая музыка. Идеально для прогулок с семьёй или неспешных свиданий.",
        "category": "парк",
        "location": "42.8780,74.6100",
        "address": "пр. Эркиндик, Бишкек",
        "city": "Бишкек",
        "image_url": "https://images.unsplash.com/photo-1534767882966-25abdb91e3a6?q=80&w=1200",
        "types": ["family", "romance", "friends"],
        "rating": 4.5,
        "price_range": "бесплатно"
    },
    {
        "name": "Долина Джеты-Огуз",
        "description": "«Семь быков» — живописная долина с красными скалами необычной формы на южном берегу Иссык-Куля. Трекинг по цветущим лугам Сказка, горячие источники и традиционные юрты. Место, которое меняет взгляд на мир.",
        "category": "природа",
        "location": "42.3700,78.1500",
        "address": "Джеты-Огузский район, Иссык-Кульская область",
        "city": "Иссык-Куль",
        "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200",
        "types": ["romance", "friends", "family"],
        "rating": 4.9,
        "price_range": "бесплатно"
    },
    {
        "name": "Музей Манаса — Национальный исторический",
        "description": "Главный исторический музей страны с богатейшей коллекцией артефактов кочевой культуры, оружия, украшений и одежды кыргызов разных эпох. Особая гордость — экспозиция, посвящённая эпосу «Манас».",
        "category": "достопримечательность",
        "location": "42.8740,74.6070",
        "address": "пр. Эркиндик 56, Бишкек",
        "city": "Бишкек",
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1200",
        "types": ["family", "friends"],
        "rating": 4.4,
        "price_range": "100 сом / вход"
    },
    {
        "name": "Caramel Patisserie",
        "description": "Элегантная кондитерская с лучшими тортами и пирожными Бишкека. Французские макаруны, медовики, нежные эклеры и сезонные десерты из местных ягод. Интерьер в стиле парижского кафе — идеал для свидания.",
        "category": "кафе",
        "location": "42.8710,74.6120",
        "address": "ул. Боконбаева 107, Бишкек",
        "city": "Бишкек",
        "image_url": "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?q=80&w=1200",
        "types": ["romance", "friends"],
        "rating": 4.8,
        "price_range": "500–1500 сом"
    },
    {
        "name": "Озеро Сон-Куль",
        "description": "Высокогорное озеро на высоте 3016 метров — «Небесное пастбище» Кыргызстана. Летом здесь разбивают лагерь пастухи-кочевники. Ночёвка в юрте, лошади, звёздное небо — незабываемое приключение.",
        "category": "природа",
        "location": "41.8200,75.1100",
        "address": "Нарынская область, Кочкорский район",
        "city": "Нарын",
        "image_url": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200",
        "types": ["romance", "friends", "family"],
        "rating": 5.0,
        "price_range": "500–3000 сом / ночь"
    },
    {
        "name": "Craft Store KG",
        "description": "Современный концептуальный магазин с товарами от местных дизайнеров и мастеров. Здесь можно найти уникальные подарки: принты с видами Кыргызстана, одежда с национальными мотивами, украшения и керамика.",
        "category": "подарки",
        "location": "42.8730,74.6090",
        "address": "ул. Панфилова 44, Бишкек",
        "city": "Бишкек",
        "image_url": "https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=1200",
        "types": ["friends", "family"],
        "rating": 4.7,
        "price_range": "500–5000 сом"
    },
    {
        "name": "Каракол — Город у подножия Тянь-Шаня",
        "description": "Живописный городок на восточном берегу Иссык-Куля — ворота в Тянь-Шань. Деревянная православная церковь и уникальная китайско-кыргызская мечеть, базар с домашним каракольским дунганским пловом.",
        "category": "достопримечательность",
        "location": "42.4900,78.3800",
        "address": "г. Каракол, Иссык-Кульская область",
        "city": "Каракол",
        "image_url": "https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=1200",
        "types": ["friends", "family"],
        "rating": 4.6,
        "price_range": "бесплатно"
    },
    {
        "name": "Sky Bar «Ала-Тоо»",
        "description": "Уникальный ресторан с панорамными окнами и видом на заснеженный горный хребет Ала-Тоо. Авторская кухня, сочетающая кыргызские традиции и европейские техники. Романтический ужин здесь — незабываемое событие.",
        "category": "ресторан",
        "location": "42.8695,74.6030",
        "address": "ул. Абдрахманова 192 (21 этаж), Бишкек",
        "city": "Бишкек",
        "image_url": "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1200",
        "types": ["romance"],
        "rating": 4.8,
        "price_range": "3000–8000 сом"
    },
]

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS places (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            description TEXT    NOT NULL,
            category    TEXT    NOT NULL,
            location    TEXT,
            address     TEXT,
            city        TEXT,
            image_url   TEXT,
            types       TEXT    DEFAULT '[]',
            rating      REAL    DEFAULT 0,
            price_range TEXT,
            created_at  TEXT    DEFAULT (datetime('now'))
        )
    """)
    conn.commit()

    count = conn.execute("SELECT COUNT(*) FROM places").fetchone()[0]
    if count == 0:
        for p in SEED_PLACES:
            conn.execute(
                """INSERT INTO places (name, description, category, location, address, city, image_url, types, rating, price_range)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (p["name"], p["description"], p["category"], p["location"],
                 p["address"], p["city"], p["image_url"],
                 json.dumps(p["types"], ensure_ascii=False),
                 p["rating"], p["price_range"])
            )
        conn.commit()

    conn.close()
