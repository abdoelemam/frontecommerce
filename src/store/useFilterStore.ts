import { create } from 'zustand';

interface FilterState {
  // Selected filter values
  selectedCategories: string[];
  selectedBrands: string[];
  selectedColors: string[];
  selectedSizes: string[];
  selectedAttributes: Record<string, string[]>;
  priceRange: [number, number];
  search: string;
  sort: string;
  page: number;

  // Actions
  toggleCategory: (id: string) => void;
  toggleBrand: (id: string) => void;
  toggleColor: (color: string) => void;
  toggleSize: (size: string) => void;
  toggleAttribute: (key: string, value: string) => void;
  setPriceRange: (range: [number, number]) => void;
  setSearch: (q: string) => void;
  setSort: (sort: string) => void;
  setPage: (page: number) => void;
  clearAll: () => void;
  toQueryParams: () => Record<string, string>;
  fromQueryParams: (params: URLSearchParams) => void;
}

const toggleInArray = (arr: string[], val: string): string[] =>
  arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

export const useFilterStore = create<FilterState>((set, get) => ({
  selectedCategories: [],
  selectedBrands: [],
  selectedColors: [],
  selectedSizes: [],
  selectedAttributes: {},
  priceRange: [0, 99999],
  search: '',
  sort: '-createdAt',
  page: 1,

  toggleCategory: (id) => set((s) => ({
    // Single-select: clicking same category deselects, clicking different replaces
    selectedCategories: s.selectedCategories.includes(id) ? [] : [id],
    page: 1,
  })),
  toggleBrand: (id) => set((s) => ({ selectedBrands: toggleInArray(s.selectedBrands, id), page: 1 })),
  toggleColor: (color) => set((s) => ({ selectedColors: toggleInArray(s.selectedColors, color), page: 1 })),
  toggleSize: (size) => set((s) => ({ selectedSizes: toggleInArray(s.selectedSizes, size), page: 1 })),
  toggleAttribute: (key, value) =>
    set((s) => {
      const current = s.selectedAttributes[key] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      const newAttrs = { ...s.selectedAttributes };
      if (updated.length === 0) {
        delete newAttrs[key];
      } else {
        newAttrs[key] = updated;
      }
      return { selectedAttributes: newAttrs, page: 1 };
    }),
  setPriceRange: (range) => set({ priceRange: range, page: 1 }),
  setSearch: (q) => set({ search: q, page: 1 }),
  setSort: (sort) => set({ sort, page: 1 }),
  setPage: (page) => set({ page }),

  clearAll: () =>
    set({
      selectedCategories: [],
      selectedBrands: [],
      selectedColors: [],
      selectedSizes: [],
      selectedAttributes: {},
      priceRange: [0, 99999],
      search: '',
      sort: '-createdAt',
      page: 1,
    }),

  toQueryParams: () => {
    const s = get();
    const params: Record<string, string> = {};

    if (s.selectedCategories.length > 0) params.categoryId = s.selectedCategories[0];
    if (s.selectedBrands.length > 0) params.brandId = s.selectedBrands.join(',');
    if (s.selectedColors.length > 0) params.color = s.selectedColors.join(',');
    if (s.selectedSizes.length > 0) params.size = s.selectedSizes.join(',');
    if (s.search) params.search = s.search;
    if (s.sort !== '-createdAt') params.sort = s.sort;
    if (s.page > 1) params.page = String(s.page);
    if (s.priceRange[0] > 0) params.minPrice = String(s.priceRange[0]);
    if (s.priceRange[1] < 99999) params.maxPrice = String(s.priceRange[1]);

    // Dynamic attributes
    if (Object.keys(s.selectedAttributes).length > 0) {
      params.attrs = JSON.stringify(s.selectedAttributes);
    }

    params.limit = '20';
    return params;
  },

  fromQueryParams: (params) => {
    const update: Partial<FilterState> = {};

    const categoryId = params.get('categoryId') || params.get('category');
    if (categoryId) update.selectedCategories = [categoryId];
    else update.selectedCategories = [];

    const brandId = params.get('brandId') || params.get('brand');
    if (brandId) update.selectedBrands = brandId.split(',');
    else update.selectedBrands = [];

    const color = params.get('color');
    if (color) update.selectedColors = color.split(',');
    else update.selectedColors = [];

    const size = params.get('size');
    if (size) update.selectedSizes = size.split(',');
    else update.selectedSizes = [];

    const search = params.get('search');
    update.search = search || '';

    const sort = params.get('sort');
    update.sort = sort || '-createdAt';

    const page = params.get('page');
    update.page = page ? parseInt(page) : 1;

    const minPrice = params.get('minPrice');
    const maxPrice = params.get('maxPrice');
    update.priceRange = [
      minPrice ? Number(minPrice) : 0,
      maxPrice ? Number(maxPrice) : 99999,
    ];

    const attrs = params.get('attrs');
    if (attrs) {
      try {
        update.selectedAttributes = JSON.parse(attrs);
      } catch {
        update.selectedAttributes = {};
      }
    } else {
      update.selectedAttributes = {};
    }

    set(update as any);
  },
}));
