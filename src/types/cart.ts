import type { FoodStoreDto } from "./store";

export interface CartItem {
    quantity: number;
    foodStore: FoodStoreDto;
}

export interface Cart {
    orderList: {
        [key: string]: CartItem;
    };
}
