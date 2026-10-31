export type Category = 'Burgers' | 'Drinks' | 'Desserts';
export type Status = 'New' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
export interface Product { id: number; name: string; category: Category; price: number; description: string; active: boolean }
export interface OrderItem { name: string; price: number; qty: number }
export interface Order { id: number; items: OrderItem[]; total: number; status: Status; createdAt?: string; isDemo?: boolean }
export interface CartLine { productId: number; qty: number }
export type ProductInput = Omit<Product, 'id'> & { id?: number };
