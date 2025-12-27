
export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  price: string;
  category_id: string;
  available: boolean;
  description?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export type ViewState = 'catalog' | 'login' | 'admin';
