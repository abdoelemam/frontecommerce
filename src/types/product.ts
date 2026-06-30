export interface ProductImage {
  secure_url: string;
  key: string;
  _id?: string;
}

export interface ProductVariant {
  _id?: string;
  color?: string;
  size?: string;
  stock: number;
  priceDiff: number;
  images?: ProductImage[];
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount: number;
  finalPrice: number;
  variants: ProductVariant[];
  images: ProductImage[];
  categoryId: string;
  brandId?: string;
  createdBy: string;
  rateAvg: number;
  rateCount: number;
  createdAt: string;
  updatedAt: string;
  attributes?: Record<string, string | string[]>;
}

export interface ProductsResponse {
  message: string;
  data: {
    products: Product[];
  };
}

export interface FacetFilter {
  key: string;
  values: string[];
}

export interface BrandFacet {
  _id: string;
  name: string;
  count: number;
}

export interface FacetedFilters {
  colors: string[];
  sizes: string[];
  priceRange: { min: number; max: number };
  brands: BrandFacet[];
  attributes: FacetFilter[];
}

export interface FacetedResponse {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: FacetedFilters;
}
