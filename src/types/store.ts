export interface StoreDto {
    id: number;
    name?: string;
    address?: string;
    latitude?: string;
    longitude?: string;
    imageSrc?: string;
    foodStores?: FoodStoreDto[];
}

export interface FoodStoreDto {
    id: string;
    storeId: number;
    store: StoreDto;
    foodId: number;
    food: FoodDto;
    price: number;
}

export interface FoodDto {
    id: number;
    name?: string;
    foodTypeId: number;
    foodTypeName?: string;
    imageSrc?: string;
    isAvailable: boolean;
}
