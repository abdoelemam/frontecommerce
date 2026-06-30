"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { brandService } from "@/services/brandService";
import { toast } from "@/store/useToastStore";

const AVAILABLE_COLORS = [
  { name: "Oatmeal", value: "#F5F5DC" },
  { name: "Midnight Blue", value: "#2C3E50" },
  { name: "Black", value: "#000000" },
  { name: "Ivory", value: "#FFFFFF" },
  { name: "Charcoal", value: "#4A4A4A" },
  { name: "Burgundy", value: "#800020" },
  { name: "Forest Green", value: "#228B22" },
  { name: "Camel", value: "#C19A6B" }
];

const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

interface SizeStock {
  size: string;
  stock: number;
}

interface ColorGroup {
  id: string;
  colorName: string;
  colorValue: string;
  files: File[];
  sizes: SizeStock[];
  customSizeInput: string;
  existingImagesCount?: number;
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch product to edit
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["adminProduct", params.id],
    queryFn: () => productService.getProductById(params.id),
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["adminCategories"],
    queryFn: () => categoryService.getCategories(),
  });

  // Fetch brands
  const { data: brands = [] } = useQuery({
    queryKey: ["adminBrands"],
    queryFn: () => brandService.getBrands(),
  });

  // Form States
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("0");
  const [status, setStatus] = useState("active");

  // Dynamic Attributes State
  const [attributes, setAttributes] = useState<{key: string; value: string}[]>([]);

  // Variant Groups State
  const [colorGroups, setColorGroups] = useState<ColorGroup[]>([]);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [customColorName, setCustomColorName] = useState("");
  const [customColorValue, setCustomColorValue] = useState("#000000");

  // Populate form when product data arrives
  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || "");
      setCategoryId((product.categoryId as any)?._id || product.categoryId || "");
      setBrandId((product.brandId as any)?._id || product.brandId || "");
      setPrice(product.price?.toString() || "");
      setDiscount(product.discount?.toString() || "0");

      if (product.variants && product.variants.length > 0) {
        const groupsMap = new Map<string, ColorGroup>();

        product.variants.forEach((v: any) => {
          const cName = v.color || "Default";
          
          if (!groupsMap.has(cName)) {
            const existingColor = AVAILABLE_COLORS.find(ac => ac.name.toLowerCase() === cName.toLowerCase());
            
            groupsMap.set(cName, {
              id: Math.random().toString(36).substring(7),
              colorName: cName,
              colorValue: existingColor ? existingColor.value : "#000000",
              files: [], 
              sizes: [],
              customSizeInput: "",
              existingImagesCount: v.images?.length || 0
            });
          }

          if (v.size) {
            groupsMap.get(cName)!.sizes.push({ size: v.size, stock: v.stock || 0 });
            // ensure existingImagesCount is populated if missing on the first variant check
            const currentCount = groupsMap.get(cName)!.existingImagesCount;
            if (!currentCount && v.images?.length) {
              groupsMap.get(cName)!.existingImagesCount = v.images.length;
            }
          }
        });

        setColorGroups(Array.from(groupsMap.values()));
      }

      // Populate attributes
      if (product.attributes) {
        const attrsObj = product.attributes instanceof Map 
          ? Object.fromEntries(product.attributes) 
          : (typeof product.attributes === 'object' ? product.attributes : {});
        const attrPairs = Object.entries(attrsObj).map(([key, value]) => ({
          key,
          value: String(value),
        }));
        setAttributes(attrPairs);
      }
    }
  }, [product]);

  // Set default category if none
  useEffect(() => {
    if (categories.length > 0 && !categoryId && !product) {
      setCategoryId(categories[0]._id);
    }
  }, [categories, categoryId, product]);

  // Handle Adding a Color Group
  const addColorGroup = (name: string, value: string) => {
    if (colorGroups.some(cg => cg.colorName.toLowerCase() === name.toLowerCase())) {
      toast.error(`Color ${name} is already added.`);
      return;
    }
    setColorGroups([
      ...colorGroups,
      {
        id: Math.random().toString(36).substring(7),
        colorName: name,
        colorValue: value,
        files: [],
        sizes: [{ size: "M", stock: 10 }],
        customSizeInput: "",
        existingImagesCount: 0,
      }
    ]);
    setShowColorDropdown(false);
  };

  const handleAddCustomColor = () => {
    if (customColorName.trim()) {
      addColorGroup(customColorName.trim(), customColorValue);
      setCustomColorName("");
    }
  };

  const removeColorGroup = (id: string) => {
    setColorGroups(colorGroups.filter(cg => cg.id !== id));
  };

  // Handle Files per Color
  const handleFilesChange = (groupId: string, files: FileList | null) => {
    if (!files) return;
    setColorGroups(colorGroups.map(cg => {
      if (cg.id === groupId) {
        return { ...cg, files: Array.from(files) };
      }
      return cg;
    }));
  };

  // Handle Sizes per Color
  const toggleSize = (groupId: string, size: string) => {
    setColorGroups(colorGroups.map(cg => {
      if (cg.id === groupId) {
        const hasSize = cg.sizes.some(s => s.size === size);
        if (hasSize) {
          return { ...cg, sizes: cg.sizes.filter(s => s.size !== size) };
        } else {
          return { ...cg, sizes: [...cg.sizes, { size, stock: 10 }] };
        }
      }
      return cg;
    }));
  };

  const updateSizeStock = (groupId: string, size: string, stock: number) => {
    setColorGroups(colorGroups.map(cg => {
      if (cg.id === groupId) {
        return {
          ...cg,
          sizes: cg.sizes.map(s => s.size === size ? { ...s, stock } : s)
        };
      }
      return cg;
    }));
  };

  const handleCustomSizeInput = (groupId: string, value: string) => {
    setColorGroups(colorGroups.map(cg => cg.id === groupId ? { ...cg, customSizeInput: value } : cg));
  };

  const addCustomSize = (groupId: string) => {
    setColorGroups(colorGroups.map(cg => {
      if (cg.id === groupId && cg.customSizeInput.trim()) {
        const sz = cg.customSizeInput.trim();
        if (!cg.sizes.some(s => s.size.toLowerCase() === sz.toLowerCase())) {
          return {
            ...cg,
            sizes: [...cg.sizes, { size: sz, stock: 10 }],
            customSizeInput: ""
          };
        }
      }
      return cg;
    }));
  };

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: (formData: FormData) => productService.updateProduct(params.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      queryClient.invalidateQueries({ queryKey: ["adminProduct", params.id] });
      toast.success(`Product "${name}" has been successfully updated.`);
      router.push("/admin/products");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update product. Ensure all details are correct.");
    }
  });

  // Form Submit Handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Product name is required.");
      return;
    }

    if (!categoryId) {
      toast.error("Please select a category.");
      return;
    }

    if (colorGroups.length === 0) {
      toast.error("Please add at least one color variant.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("description", description.trim() || "Quiet luxury item.");
    formData.append("price", price);
    formData.append("discount", discount);
    formData.append("categoryId", categoryId);
    if (brandId) {
      formData.append("brandId", brandId);
    }

    // Build variants array and file mappings
    const variantsList: any[] = [];
    const colorImageMapping: Record<string, number[]> = {};
    let fileIndex = 0;

    colorGroups.forEach((cg) => {
      // Add sizes for this color
      if (cg.sizes.length === 0) {
        variantsList.push({
          color: cg.colorName,
          size: "One Size",
          stock: 0,
          priceDiff: 0,
        });
      } else {
        cg.sizes.forEach((sz) => {
          variantsList.push({
            color: cg.colorName,
            size: sz.size,
            stock: sz.stock,
            priceDiff: 0,
          });
        });
      }

      // Add files and map them
      if (cg.files.length > 0) {
        colorImageMapping[cg.colorName] = [];
        cg.files.forEach((f) => {
          formData.append("images", f);
          colorImageMapping[cg.colorName].push(fileIndex);
          fileIndex++;
        });
      }
    });

    formData.append("variants", JSON.stringify(variantsList));
    
    // Only send colorImageMapping if there are new files uploaded, 
    // otherwise backend might retain the existing ones (depending on its implementation).
    if (fileIndex > 0) {
      formData.append("colorImageMapping", JSON.stringify(colorImageMapping));
    }

    // Add dynamic attributes
    const attrsObj: Record<string, string> = {};
    attributes.forEach((attr) => {
      if (attr.key.trim() && attr.value.trim()) {
        attrsObj[attr.key.trim()] = attr.value.trim();
      }
    });
    formData.append("attributes", JSON.stringify(attrsObj));

    updateProductMutation.mutate(formData);
  };

  if (isLoadingProduct) {
    return <div className="p-10 text-center text-slate-500 font-body">Loading product details...</div>;
  }

  return (
    <form onSubmit={handleSave} className="min-h-screen text-[14px] font-body text-on-surface animate-fade-in-up pb-20">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-xl">
        <div>
          <nav className="flex items-center gap-xs text-outline mb-sm font-semibold tracking-wider text-[11px] uppercase">
            <Link href="/admin/products" className="hover:text-primary transition-colors">Products</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary">Edit</span>
          </nav>
          <h2 className="font-display text-headline-lg text-on-surface leading-tight">Edit Product</h2>
        </div>
        <div className="flex items-center gap-md">
          <Link
            href="/admin/products"
            className="px-lg py-[12px] rounded border border-outline text-on-surface font-semibold tracking-wider text-[12px] uppercase bg-transparent hover:bg-surface-container transition-colors duration-300 cursor-pointer"
          >
            Discard
          </Link>
          <button
            type="submit"
            disabled={updateProductMutation.isPending}
            className="px-lg py-[12px] rounded bg-tertiary text-on-tertiary font-semibold tracking-wider text-[12px] uppercase shadow-[0_4px_14px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] hover:-translate-y-[1px] transition-all duration-300 cursor-pointer disabled:opacity-50"
          >
            {updateProductMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-xl">
        {/* Left Column: Primary Information (2 spans) */}
        <div className="xl:col-span-2 flex flex-col gap-xl">
          {/* General Information */}
          <section className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-xl shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
            <h3 className="font-display text-[20px] text-on-surface font-semibold mb-lg">General Information</h3>
            <div className="flex flex-col gap-lg">
              <div className="flex flex-col gap-xs">
                <label className="font-semibold tracking-wider text-[11px] uppercase text-on-surface-variant">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cashmere Turtleneck Sweater"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/60 rounded px-md py-[14px] font-body text-[16px] text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all placeholder:text-outline-variant"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-semibold tracking-wider text-[11px] uppercase text-on-surface-variant">Description</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Describe the product details, materials, and origin..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/60 rounded p-md font-body text-[16px] text-on-surface resize-y outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary transition-all placeholder:text-outline-variant"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div className="flex flex-col gap-xs">
                  <label className="font-semibold tracking-wider text-[11px] uppercase text-on-surface-variant">Category</label>
                  <div className="relative">
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/60 rounded pl-md pr-10 py-[14px] font-body text-[16px] text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all appearance-none cursor-pointer"
                    >
                      {categories.length === 0 && <option value="">No categories available</option>}
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-semibold tracking-wider text-[11px] uppercase text-on-surface-variant">Brand</label>
                  <div className="relative">
                    <select
                      value={brandId}
                      onChange={(e) => setBrandId(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/60 rounded pl-md pr-10 py-[14px] font-body text-[16px] text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select a Brand</option>
                      {brands.map((brand) => (
                        <option key={brand._id} value={brand._id}>{brand.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Variant Builder */}
          <section className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-xl shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
            <div className="flex items-center justify-between mb-lg">
              <h3 className="font-display text-[20px] text-on-surface font-semibold">Variant Builder</h3>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorDropdown(!showColorDropdown)}
                  className="bg-primary text-white px-md py-sm rounded font-semibold text-[12px] uppercase tracking-wider flex items-center gap-xs cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Add Color
                </button>
                {/* Color dropdown popover */}
                {showColorDropdown && (
                  <div className="absolute right-0 top-12 w-72 bg-white border border-outline-variant/60 rounded-lg shadow-xl p-md z-30 animate-fade-in-up">
                    <div className="mb-md pb-sm border-b border-outline-variant/30">
                      <p className="text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase mb-xs">Standard Colors</p>
                      <div className="grid grid-cols-2 gap-xs max-h-40 overflow-y-auto">
                        {AVAILABLE_COLORS.filter(c => !colorGroups.some(cg => cg.colorName === c.name)).map((col) => (
                          <button
                            key={col.name}
                            type="button"
                            onClick={() => addColorGroup(col.name, col.value)}
                            className="flex items-center gap-xs p-1.5 hover:bg-surface-container rounded text-left text-[12px] font-semibold transition-colors cursor-pointer"
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-outline-variant shrink-0" style={{ backgroundColor: col.value }}></span>
                            <span className="truncate">{col.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase mb-xs">Custom Color</p>
                      <div className="flex flex-col gap-sm">
                        <input 
                          type="text" 
                          placeholder="Color Name (e.g. Rose Gold)" 
                          value={customColorName}
                          onChange={(e) => setCustomColorName(e.target.value)}
                          className="w-full px-sm py-2 border border-outline-variant/60 rounded bg-surface text-[12px] focus:border-tertiary outline-none"
                        />
                        <div className="flex items-center gap-xs">
                          <input 
                            type="color" 
                            value={customColorValue}
                            onChange={(e) => setCustomColorValue(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                          />
                          <button 
                            type="button"
                            onClick={handleAddCustomColor}
                            className="flex-grow py-1.5 bg-tertiary text-on-tertiary rounded text-[11px] font-semibold hover:opacity-90 cursor-pointer"
                          >
                            Add Custom
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {colorGroups.length === 0 ? (
              <div className="py-xl text-center border-2 border-dashed border-outline-variant/50 rounded-lg">
                <span className="material-symbols-outlined text-[40px] text-outline-variant mb-xs">palette</span>
                <p className="text-on-surface-variant text-[14px]">No colors added yet.</p>
                <p className="text-outline text-[12px] mt-1">Add a color to define specific images, sizes, and stock.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-xl">
                {colorGroups.map((cg) => (
                  <div key={cg.id} className="border border-outline-variant/60 rounded-xl overflow-hidden shadow-sm bg-surface">
                    {/* Color Header */}
                    <div className="bg-surface-container-low px-lg py-md border-b border-outline-variant/60 flex items-center justify-between">
                      <div className="flex items-center gap-sm">
                        <span className="w-5 h-5 rounded-full border shadow-sm" style={{ backgroundColor: cg.colorValue }}></span>
                        <h4 className="font-display font-semibold text-[16px]">{cg.colorName}</h4>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeColorGroup(cg.id)}
                        className="text-[#BA1A1A] hover:bg-red-50 p-1.5 rounded transition-colors cursor-pointer flex items-center"
                        title="Remove Color"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>

                    <div className="p-lg grid grid-cols-1 md:grid-cols-2 gap-lg">
                      {/* Left: Images */}
                      <div className="flex flex-col gap-xs">
                        <label className="font-semibold tracking-wider text-[11px] uppercase text-on-surface-variant">Images for {cg.colorName}</label>
                        <label className="border-2 border-dashed border-outline-variant/60 rounded-lg p-xl flex flex-col items-center justify-center bg-surface hover:bg-surface-container-low transition-colors duration-300 cursor-pointer min-h-[160px] relative">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFilesChange(cg.id, e.target.files)}
                          />
                          <span className="material-symbols-outlined text-outline text-[28px] mb-xs">cloud_upload</span>
                          <p className="font-semibold text-[12px] text-center px-4">
                            {cg.files.length > 0 
                              ? `${cg.files.length} new images selected` 
                              : `Click to upload new images (${cg.existingImagesCount || 0} existing)`}
                          </p>
                          <p className="text-[11px] text-outline-variant text-center mt-1">
                            Uploading new images will replace existing ones for this color.
                          </p>
                        </label>
                      </div>

                      {/* Right: Sizes & Stock */}
                      <div className="flex flex-col gap-xs">
                        <label className="font-semibold tracking-wider text-[11px] uppercase text-on-surface-variant">Sizes & Stock for {cg.colorName}</label>
                        
                        {/* Size selector */}
                        <div className="flex flex-wrap gap-xs mb-md">
                          {Array.from(new Set([...STANDARD_SIZES, ...cg.sizes.map(s => s.size)])).map((sz) => {
                            const isSelected = cg.sizes.some(s => s.size === sz);
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => toggleSize(cg.id, sz)}
                                className={`px-2.5 py-1.5 rounded border text-[11px] font-bold cursor-pointer transition-colors ${
                                  isSelected 
                                    ? "bg-tertiary border-tertiary text-on-tertiary shadow-sm" 
                                    : "bg-surface border-outline-variant text-on-surface hover:border-tertiary"
                                }`}
                              >
                                {sz}
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Custom size input */}
                        <div className="flex items-center gap-xs mb-md">
                          <input 
                            type="text" 
                            placeholder="Custom size (e.g. 125GB)" 
                            value={cg.customSizeInput}
                            onChange={(e) => handleCustomSizeInput(cg.id, e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSize(cg.id); } }}
                            className="flex-grow px-sm py-1.5 border border-outline-variant/60 rounded text-[12px] focus:border-tertiary outline-none"
                          />
                          <button 
                            type="button"
                            onClick={() => addCustomSize(cg.id)}
                            className="bg-surface-container-high px-3 py-1.5 rounded text-[11px] font-bold cursor-pointer hover:bg-surface-container-highest"
                          >
                            Add Size
                          </button>
                        </div>

                        {/* Stock Inputs per selected size */}
                        {cg.sizes.length > 0 && (
                          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded p-sm max-h-[150px] overflow-y-auto flex flex-col gap-xs">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-outline mb-1">Stock Quantity</p>
                            {cg.sizes.map(s => (
                              <div key={s.size} className="flex items-center justify-between text-[12px]">
                                <span className="font-semibold w-12 truncate">{s.size}</span>
                                <input 
                                  type="number" 
                                  min={0}
                                  value={s.stock}
                                  onChange={(e) => updateSizeStock(cg.id, s.size, Number(e.target.value))}
                                  className="w-20 px-2 py-1 border border-outline-variant/60 rounded outline-none focus:border-tertiary text-right"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        {cg.sizes.length === 0 && (
                          <p className="text-[11px] text-[#BA1A1A] font-semibold mt-auto">Please select at least one size.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Dynamic Attributes Section */}
          <section className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-xl shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
            <div className="flex items-center justify-between mb-lg">
              <div>
                <h3 className="font-display text-[20px] text-on-surface font-semibold">Product Attributes</h3>
                <p className="text-[12px] text-outline-variant mt-1">Add custom filterable attributes (e.g., Material, Storage, Screen Size)</p>
              </div>
              <button
                type="button"
                onClick={() => setAttributes([...attributes, { key: "", value: "" }])}
                className="flex items-center gap-1 px-3 py-2 border border-dashed border-tertiary/60 rounded text-tertiary hover:bg-tertiary/5 font-semibold text-[11px] uppercase tracking-wider cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add Attribute
              </button>
            </div>

            {attributes.length === 0 ? (
              <div className="py-8 text-center bg-surface border border-dashed border-outline-variant/30 rounded-lg">
                <span className="material-symbols-outlined text-[32px] text-outline-variant/40 mb-2 block">tune</span>
                <p className="text-[13px] text-outline-variant">No attributes added yet.</p>
                <p className="text-[11px] text-outline-variant/60 mt-1">Attributes help customers filter products (e.g., Material: Cotton)</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {attributes.map((attr, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-surface border border-outline-variant/30 rounded-lg p-3">
                    <div className="flex-1">
                      <label className="font-semibold tracking-wider text-[10px] uppercase text-outline-variant block mb-1">Attribute Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Material, Storage, RAM"
                        value={attr.key}
                        onChange={(e) => {
                          const updated = [...attributes];
                          updated[idx].key = e.target.value;
                          setAttributes(updated);
                        }}
                        className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded px-3 py-2 font-body text-[14px] text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="font-semibold tracking-wider text-[10px] uppercase text-outline-variant block mb-1">Value</label>
                      <input
                        type="text"
                        placeholder="e.g. Cotton, 128GB, 8GB"
                        value={attr.value}
                        onChange={(e) => {
                          const updated = [...attributes];
                          updated[idx].value = e.target.value;
                          setAttributes(updated);
                        }}
                        className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded px-3 py-2 font-body text-[14px] text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttributes(attributes.filter((_, i) => i !== idx))}
                      className="mt-5 w-8 h-8 flex items-center justify-center text-[#BA1A1A] hover:bg-[#BA1A1A]/10 rounded cursor-pointer transition-colors flex-shrink-0"
                      title="Remove attribute"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Pricing & Status */}
        <div className="flex flex-col gap-xl">
          {/* Pricing Card */}
          <section className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-xl shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
            <h3 className="font-display text-[20px] text-on-surface font-semibold mb-lg">Pricing</h3>
            <div className="flex flex-col gap-lg">
              <div className="flex flex-col gap-xs relative">
                <label className="font-semibold tracking-wider text-[11px] uppercase text-on-surface-variant">Retail Price</label>
                <div className="relative">
                  <span className="absolute left-md top-1/2 -translate-y-1/2 font-semibold text-outline-variant">$</span>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-surface border border-outline-variant/60 rounded pl-[32px] pr-md py-[14px] font-body text-[16px] text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all font-semibold"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-xs relative">
                <label className="font-semibold tracking-wider text-[11px] uppercase text-on-surface-variant">Discount Percentage</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="e.g. 10 for 10%"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/60 rounded px-md py-[14px] font-body text-[16px] text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all font-semibold"
                />
              </div>
            </div>
          </section>

          {/* Status Card */}
          <section className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-xl shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
            <h3 className="font-display text-[20px] text-on-surface font-semibold mb-lg">Product Status</h3>
            <div className="flex flex-col gap-xs">
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-surface border border-outline-variant/60 rounded px-md py-[14px] font-body text-[16px] text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all appearance-none cursor-pointer font-semibold"
                >
                  <option value="active">Active (Published)</option>
                  <option value="draft">Draft</option>
                </select>
                <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
              </div>
              <p className="text-[12px] text-outline-variant mt-xs leading-relaxed">
                This product will be visible on the storefront immediately upon saving if status is set to Active.
              </p>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
