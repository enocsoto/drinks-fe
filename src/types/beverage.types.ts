export enum DrinkType {
  ALCOHOLIC = 'ALCOHOLICA',
  SODA = 'GASEOSA',
  WATER = 'AGUA',
  JUICE = 'JUGO',
  OTHER = 'OTRO',
}

export const DRINK_TYPE_LABELS: Record<string, string> = {
  ALCOHOLICA: 'Alcohólica',
  GASEOSA: 'Gaseosa',
  AGUA: 'Agua',
  JUGO: 'Jugo',
  OTRO: 'Otro',
};

export enum ContainerType {
  LATA_350 = 'LATA_350',
  BOTELLA_250 = 'BOTELLA_250',
  BOTELLA_330 = 'BOTELLA_330',
  BOTELLA_500 = 'BOTELLA_500',
  LITRO = 'LITRO',
  LITRO_1_5 = 'LITRO_1_5',
  LITRO_2 = 'LITRO_2',
  LITRO_2_5 = 'LITRO_2_5',
  LITRO_REFILL = 'LITRO_REFILL',
  BOTELLA_375 = 'BOTELLA_375',
  OTRO = 'OTRO',
}

export const CONTAINER_TYPE_LABELS: Record<ContainerType, string> = {
  [ContainerType.LATA_350]: 'Lata 350 ml',
  [ContainerType.BOTELLA_250]: 'Botella 250 ml',
  [ContainerType.BOTELLA_330]: 'Botella 330 ml',
  [ContainerType.BOTELLA_500]: 'Botella 500 ml',
  [ContainerType.LITRO]: '1 L',
  [ContainerType.LITRO_1_5]: '1.5 L',
  [ContainerType.LITRO_2]: '2 L',
  [ContainerType.LITRO_2_5]: '2.5 L',
  [ContainerType.LITRO_REFILL]: 'Litro retornable',
  [ContainerType.BOTELLA_375]: 'Botella 375 ml',
  [ContainerType.OTRO]: 'Otro',
};

export interface BeverageDto {
  id: string;
  name: string;
  price: number;
  type: DrinkType | string;
  containerType?: ContainerType | string;
  containerSize?: string;
  isActive?: boolean;
  /** Ruta de la imagen (ej. /beverages/agua-cristal.png) */
  imageUrl?: string;
  /** Cantidad en inventario (unidades) */
  stock?: number;
  /** Precio de coste unitario en COP (para margen de ganancia) */
  costPrice?: number;
}

const BEVERAGES_IMG_BASE = '/beverages';

/**
 * Ruta de imagen por nombre y envase (misma lógica que el backend).
 * Solo devuelve ruta si hay imagen en public/beverages/.
 */
export function getBeverageImageUrl(name: string, containerType?: ContainerType | string | null): string {
  const n = (name ?? '').trim().toLowerCase();
  const ct = containerType ?? '';
  if (n.includes('agua cristal')) {
    return ct === ContainerType.BOTELLA_330
      ? `${BEVERAGES_IMG_BASE}/agua-cristal-pequena.png`
      : `${BEVERAGES_IMG_BASE}/agua-cristal.png`;
  }
  if (n.includes('aguila negra')) {
    return ct === ContainerType.LATA_350 ? `${BEVERAGES_IMG_BASE}/aguila-negra-lata.png` : '';
  }
  if (n === 'aguila' && ct === ContainerType.LATA_350) {
    return `${BEVERAGES_IMG_BASE}/aguila-ligth-lata.png`;
  }
  if (n.includes('club colombia') && !n.includes('negra')) {
    if (ct === ContainerType.LATA_350) return `${BEVERAGES_IMG_BASE}/club-colombia-lata-med.png`;
    if (ct === ContainerType.BOTELLA_330) return `${BEVERAGES_IMG_BASE}/club-colombia-lata-peq.png`;
  }
  if (n.includes('budweiser')) return `${BEVERAGES_IMG_BASE}/budweiser.png`;
  return '';
}

export interface CreateBeverageDto {
  name: string;
  price: number;
  type: DrinkType | string;
  containerType?: ContainerType | string;
  containerSize?: string;
  imageUrl?: string;
  stock?: number;
  costPrice?: number;
}

export interface UpdateBeverageDto {
  name?: string;
  price?: number;
  type?: DrinkType | string;
  containerType?: ContainerType | string;
  containerSize?: string;
  imageUrl?: string;
  stock?: number;
  costPrice?: number;
}

/** Respuesta paginada del listado de bebidas */
export interface BeveragesPaginatedResponse {
  data: BeverageDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
