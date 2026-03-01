/**
 * Local cart store — uses localStorage as primary storage.
 * API sync is optional (will try but won't break if it fails).
 *
 * Cart shape: { [foodStoreId: string]: { quantity: number, foodStore: FoodStoreDto } }
 */
import { userApi } from '../api/api';

const CART_KEY = 'grab_cart';
const CART_COUNT_KEY = 'cartCount';

export interface CartEntry {
    quantity: number;
    foodStore: any; // FoodStoreDto
}

export type CartOrderList = Record<string, CartEntry>;

function read(): CartOrderList {
    try {
        const raw = localStorage.getItem(CART_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as CartOrderList;
    } catch {
        return {};
    }
}

function write(orderList: CartOrderList) {
    localStorage.setItem(CART_KEY, JSON.stringify(orderList));
    const count = Object.values(orderList).reduce((s, e) => s + (e.quantity || 0), 0);
    localStorage.setItem(CART_COUNT_KEY, String(count));
    window.dispatchEvent(new Event('cartUpdate'));
}

/** Try to sync cart to backend (fire-and-forget) */
function syncToApi(orderList: CartOrderList) {
    userApi.updateCart({ orderList }).catch((err) => {
        console.warn('[cartStore] API sync failed (non-critical):', err?.message);
    });
}

// ─── Public API ───────────────────────────────────────────

export const cartStore = {
    /** Get current cart */
    getItems(): CartOrderList {
        return read();
    },

    /** Get cart items as an array (for rendering) */
    getItemsArray() {
        const orderList = read();
        return Object.entries(orderList).map(([key, val]) => ({
            id: key,
            quantity: val.quantity,
            foodStore: val.foodStore,
            price: val.foodStore?.price || val.foodStore?.Price || 0,
            name: val.foodStore?.food?.name || val.foodStore?.Food?.Name || 'Sản phẩm',
            image: val.foodStore?.food?.imageSrc || val.foodStore?.Food?.ImageSrc ||
                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
        }));
    },

    /** Get total item count */
    getCount(): number {
        const orderList = read();
        return Object.values(orderList).reduce((s, e) => s + (e.quantity || 0), 0);
    },

    /** Add item to cart (handles cross-store conflict detection) */
    addItem(foodStoreId: string, foodStore: any, quantity = 1): 'added' | 'conflict' {
        const orderList = read();
        const existing = Object.values(orderList);

        // Check for different-store conflict
        if (existing.length > 0) {
            const existingStoreId = existing[0]?.foodStore?.storeId || existing[0]?.foodStore?.StoreId;
            const newStoreId = foodStore?.storeId || foodStore?.StoreId;
            if (existingStoreId && newStoreId && existingStoreId !== newStoreId) {
                return 'conflict';
            }
        }

        const currentQty = orderList[foodStoreId]?.quantity || 0;
        orderList[foodStoreId] = { quantity: currentQty + quantity, foodStore };
        write(orderList);
        syncToApi(orderList);
        return 'added';
    },

    /** Force-add item (clears cart first — used after conflict confirmation) */
    forceAddItem(foodStoreId: string, foodStore: any, quantity = 1) {
        const orderList: CartOrderList = {
            [foodStoreId]: { quantity, foodStore },
        };
        write(orderList);
        syncToApi(orderList);
    },

    /** Update item quantity */
    updateQuantity(foodStoreId: string, newQuantity: number) {
        const orderList = read();
        if (newQuantity <= 0) {
            delete orderList[foodStoreId];
        } else if (orderList[foodStoreId]) {
            orderList[foodStoreId].quantity = newQuantity;
        }
        write(orderList);
        syncToApi(orderList);
    },

    /** Remove item */
    removeItem(foodStoreId: string) {
        const orderList = read();
        delete orderList[foodStoreId];
        write(orderList);
        syncToApi(orderList);
    },

    /** Clear entire cart */
    clear() {
        localStorage.removeItem(CART_KEY);
        localStorage.setItem(CART_COUNT_KEY, '0');
        window.dispatchEvent(new Event('cartUpdate'));
        userApi.clearCart().catch(() => { });
    },

    /** Try to load cart from API (for initial sync on login) */
    async syncFromApi() {
        try {
            const res = await userApi.getCart();
            const d = res.data as any;
            const apiOrderList = d?.orderList || d?.OrderList || {};
            const entries = Object.entries(apiOrderList);
            if (entries.length > 0) {
                // API has data → merge into local storage (API wins if local is empty)
                const localOrderList = read();
                if (Object.keys(localOrderList).length === 0) {
                    write(apiOrderList);
                }
            }
        } catch {
            // API unavailable — local storage is the source of truth
        }
    },
};
