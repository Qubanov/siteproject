from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from database import init_db, get_db_connection
from models import PlaceCreate, PlaceUpdate, PlaceResponse
import json

app = FastAPI(
    title="Kyrgyzstan Guide API",
    description="API для сайта-рекомендатора мест в Кыргызстане",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()


# ──────────────────────────────────────────────
# GET /places — список мест с фильтрацией
# ──────────────────────────────────────────────
@app.get("/places", response_model=List[PlaceResponse])
def get_places(
    category: Optional[str] = Query(None, description="Фильтр по категории"),
    type: Optional[str] = Query(None, description="Фильтр по типу (friends/romance/family)"),
    search: Optional[str] = Query(None, description="Поиск по названию/описанию"),
    city: Optional[str] = Query(None, description="Фильтр по городу"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM places WHERE 1=1"
    params = []

    if category and category != "all":
        query += " AND category = ?"
        params.append(category)
    if type and type != "all":
        query += " AND (types LIKE ? OR types LIKE ? OR types LIKE ?)"
        params.extend([f'"{type}"', f'"{type},%', f'%,{type}%'])
    if search:
        query += " AND (name LIKE ? OR description LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])
    if city and city != "all":
        query += " AND city = ?"
        params.append(city)

    query += " LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = cursor.execute(query, params).fetchall()
    conn.close()
    return [dict(row) for row in rows]


# ──────────────────────────────────────────────
# GET /places/{id}
# ──────────────────────────────────────────────
@app.get("/places/{place_id}", response_model=PlaceResponse)
def get_place(place_id: int):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM places WHERE id = ?", (place_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Место не найдено")
    return dict(row)


# ──────────────────────────────────────────────
# POST /places
# ──────────────────────────────────────────────
@app.post("/places", response_model=PlaceResponse, status_code=201)
def create_place(place: PlaceCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    types_json = json.dumps(place.types, ensure_ascii=False)
    cursor.execute(
        """INSERT INTO places (name, description, category, location, address, city, image_url, types, rating, price_range)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (place.name, place.description, place.category, place.location,
         place.address, place.city, place.image_url, types_json,
         place.rating, place.price_range)
    )
    conn.commit()
    new_id = cursor.lastrowid
    row = conn.execute("SELECT * FROM places WHERE id = ?", (new_id,)).fetchone()
    conn.close()
    return dict(row)


# ──────────────────────────────────────────────
# PUT /places/{id}
# ──────────────────────────────────────────────
@app.put("/places/{place_id}", response_model=PlaceResponse)
def update_place(place_id: int, place: PlaceUpdate):
    conn = get_db_connection()
    existing = conn.execute("SELECT * FROM places WHERE id = ?", (place_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Место не найдено")

    update_data = place.dict(exclude_unset=True)
    if "types" in update_data:
        update_data["types"] = json.dumps(update_data["types"], ensure_ascii=False)

    if not update_data:
        conn.close()
        return dict(existing)

    set_clause = ", ".join(f"{k} = ?" for k in update_data.keys())
    values = list(update_data.values()) + [place_id]
    conn.execute(f"UPDATE places SET {set_clause} WHERE id = ?", values)
    conn.commit()
    row = conn.execute("SELECT * FROM places WHERE id = ?", (place_id,)).fetchone()
    conn.close()
    return dict(row)


# ──────────────────────────────────────────────
# DELETE /places/{id}
# ──────────────────────────────────────────────
@app.delete("/places/{place_id}", status_code=204)
def delete_place(place_id: int):
    conn = get_db_connection()
    existing = conn.execute("SELECT id FROM places WHERE id = ?", (place_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Место не найдено")
    conn.execute("DELETE FROM places WHERE id = ?", (place_id,))
    conn.commit()
    conn.close()


# ──────────────────────────────────────────────
# GET /categories — уникальные категории
# ──────────────────────────────────────────────
@app.get("/categories")
def get_categories():
    conn = get_db_connection()
    rows = conn.execute("SELECT DISTINCT category FROM places ORDER BY category").fetchall()
    conn.close()
    return [r[0] for r in rows]


# ──────────────────────────────────────────────
# GET /cities — уникальные города
# ──────────────────────────────────────────────
@app.get("/cities")
def get_cities():
    conn = get_db_connection()
    rows = conn.execute("SELECT DISTINCT city FROM places WHERE city IS NOT NULL ORDER BY city").fetchall()
    conn.close()
    return [r[0] for r in rows]
