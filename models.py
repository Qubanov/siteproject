from pydantic import BaseModel, Field
from typing import List, Optional

class PlaceBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=10)
    category: str = Field(..., description="природа / кафе / ресторан / парк / шоппинг / подарки / достопримечательность")
    location: Optional[str] = Field(None, description="lat,lng")
    address: Optional[str] = None
    city: Optional[str] = None
    image_url: Optional[str] = None
    types: List[str] = Field(default=[], description="friends / romance / family")
    rating: Optional[float] = Field(None, ge=0, le=5)
    price_range: Optional[str] = None

class PlaceCreate(PlaceBase):
    pass

class PlaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    image_url: Optional[str] = None
    types: Optional[List[str]] = None
    rating: Optional[float] = None
    price_range: Optional[str] = None

class PlaceResponse(BaseModel):
    id: int
    name: str
    description: str
    category: str
    location: Optional[str]
    address: Optional[str]
    city: Optional[str]
    image_url: Optional[str]
    types: str  # JSON string from DB
    rating: Optional[float]
    price_range: Optional[str]
    created_at: Optional[str]

    class Config:
        from_attributes = True
