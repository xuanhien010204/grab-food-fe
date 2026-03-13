/**
 * Local cart store — uses localStorage as primary storage.
 * API sync is optional (will try but won't break if it fails).
 *
 * Cart shape: { [foodStoreId: string]: { quantity: number, foodStore: FoodStoreDto } }
 */
import { userApi } from '../api/api';

const CART_KEY = 'grab_cart';
const CART_COUNT_KEY = 'cartCount';
const CART_USER_KEY = 'grab_cart_userId';

export interface CartEntry {
    quantity: number;
    foodStore: any; // FoodStoreDto
}

export type CartOrderList = Record<string, CartEntry>;

function read(): CartOrderList {
    try {
        const raw = localStorage.getItem(CART_KEY);
        if (!raw) return {};
        const data = JSON.parse(raw) as CartOrderList;
        
        // Self-healing: Remove entries with numeric keys (should be GUIDs)
        let healed = false;
        const keys = Object.keys(data);
        for (const key of keys) {
            if (!isNaN(Number(key)) && key.length < 5) {
                console.warn('[cartStore] Removing invalid numeric key:', key);
                delete data[key];
                healed = true;
            } else {
                // Ensure foodStore object also has a string ID
                const entry = data[key];
                if (entry?.foodStore && typeof entry.foodStore.id === 'number') {
                    console.warn('[cartStore] Healing numeric foodStore.id to string:', entry.foodStore.id);
                    entry.foodStore.id = String(entry.foodStore.id);
                    healed = true;
                }
            }
        }
        if (healed) write(data);
        
        return data;
    } catch {
        return {};
    }
}

function write(orderList: CartOrderList) {
    localStorage.setItem(CART_KEY, JSON.stringify(orderList));
    const count = Object.values(orderList).reduce((s, e) => s + (e.quantity || 0), 0);
    localStorage.setItem(CART_COUNT_KEY, String(count));
    window.dispatchEvent(new CustomEvent('cartUpdate', { detail: { count } }));
}

/** Try to sync cart to backend (fire-and-forget) */
function syncToApi(orderList: CartOrderList) {
    // Make sync silent so it doesn't annoy the user with toasts if it fails
    userApi.updateCart({ orderList }, { silent: true } as any).catch((err) => {
        console.warn('[cartStore] API sync failed (non-critical):', err?.message);
    });
}

// ─── Public API ───────────────────────────────────────────

export const cartStore = {
    /** Set the userId that owns the current cart */
    setCartUser(userId: string) {
        localStorage.setItem(CART_USER_KEY, userId);
    },

    /** Get the userId that owns the current cart (or null) */
    getCartUser(): string | null {
        return localStorage.getItem(CART_USER_KEY);
    },
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
        localStorage.removeItem(CART_USER_KEY);
        localStorage.setItem(CART_COUNT_KEY, '0');
        window.dispatchEvent(new CustomEvent('cartUpdate', { detail: { count: 0 } }));
        userApi.clearCart().catch(() => { });
    },

    /** Try to load cart from API and merge with local cart (B02) */
    async syncFromApi() {
        try {
            const res = await userApi.getCart();
            const d = res.data as any;
            const apiOrderList: CartOrderList = d?.orderList || d?.OrderList || {};
            const localOrderList = read();

            const localHasItems = Object.keys(localOrderList).length > 0;
            const apiHasItems = Object.keys(apiOrderList).length > 0;

            if (!localHasItems && apiHasItems) {
                // Local is empty, use API cart
                write(apiOrderList);
            } else if (localHasItems && apiHasItems) {
                // Both have items — LOCAL WINS strategy (avoid double-counting)
                // Since we sync local→API on every addItem, the API copy is always
                // a mirror of local. Summing them would double the quantities.
                const localStoreId = Object.values(localOrderList)[0]?.foodStore?.storeId || Object.values(localOrderList)[0]?.foodStore?.StoreId;
                const apiStoreId = Object.values(apiOrderList)[0]?.foodStore?.storeId || Object.values(apiOrderList)[0]?.foodStore?.StoreId;

                if (localStoreId && apiStoreId && localStoreId !== apiStoreId) {
                    // Different stores — keep local cart (user's most recent action)
                    syncToApi(localOrderList);
                } else {
                    // Same store — local quantity always wins, only add API-only items
                    const merged: CartOrderList = { ...localOrderList };
                    for (const [key, apiEntry] of Object.entries(apiOrderList)) {
                        if (!merged[key]) {
                            // Item only in API (e.g. added from another device) — add it
                            merged[key] = apiEntry;
                        }
                        // If item exists in both → keep local quantity (no summing)
                    }
                    write(merged);
                    syncToApi(merged);
                }
            } else if (localHasItems && !apiHasItems) {
                // API is empty, sync local to API
                syncToApi(localOrderList);
            }
            // Both empty — nothing to do
        } catch {
            // API unavailable — local storage is the source of truth
        }
    },
};
