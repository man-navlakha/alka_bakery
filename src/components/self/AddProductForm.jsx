
import React, { useState, useEffect } from "react";
import { apiFetch } from "../../Context/apiFetch";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox"; // Assuming you have this
import { Loader2, XCircle, Trash2, PlusCircle } from "lucide-react";

// Helper component for a single variant row
const VariantInputRow = ({ index, variant, units, onChange, onRemove, disabled }) => { // Added disabled prop
    // This internal handleChange calls the onChange passed from the parent (which is handleVariantChange)
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        onChange(index, name, type === 'checkbox' ? checked : value);
    };

    return (
        <div className={`border p-3 rounded-md space-y-2 relative ${disabled ? 'opacity-70 bg-gray-100 dark:bg-zinc-800' : 'bg-gray-50 dark:bg-zinc-700'}`}>
             <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1 right-1 text-red-500 hover:bg-red-100 disabled:opacity-50"
                onClick={() => onRemove(index)}
                aria-label="Remove variant"
                disabled={disabled} // Disable remove button too
            >
                <Trash2 size={14} />
            </Button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <div>
                    <Label htmlFor={`variant-name-${index}`}>Variant Name*</Label>
                    <Input id={`variant-name-${index}`} name="name" value={variant.name || ''} onChange={handleChange} placeholder="e.g., 0.5 Kg, 6 pcs" required disabled={disabled} />
                 </div>
                 <div>
                     <Label htmlFor={`variant-unit-${index}`}>Unit*</Label>
                     <select id={`variant-unit-${index}`} name="unit_id" value={variant.unit_id || ''} onChange={handleChange} required disabled={disabled || units.length === 0} className="mt-1 w-full p-2 border rounded dark:bg-zinc-600 dark:border-zinc-500 disabled:opacity-50">
                        <option value="" disabled>Select Unit</option>
                        {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                     </select>
                 </div>
                 <div>
                    <Label htmlFor={`variant-price_modifier-${index}`}>Price Modifier (₹)*</Label>
                    <Input id={`variant-price_modifier-${index}`} type="number" name="price_modifier" value={variant.price_modifier ?? ''} onChange={handleChange} placeholder="0 for base, 400 for +₹400" required step="any" disabled={disabled}/>
                 </div>
                <div>
                    <Label htmlFor={`variant-sku-${index}`}>SKU (Optional)</Label>
                    <Input id={`variant-sku-${index}`} name="sku" value={variant.sku || ''} onChange={handleChange} placeholder="e.g., CAKE-CHOC-05" disabled={disabled} />
                 </div>
                 <div>
                    <Label htmlFor={`variant-min_quantity-${index}`}>Min Quantity*</Label>
                    <Input id={`variant-min_quantity-${index}`} type="number" name="min_quantity" value={variant.min_quantity || ''} onChange={handleChange} placeholder="e.g., 1 or 0.5" required step="any" min="0" disabled={disabled}/>
                 </div>
                 <div>
                    <Label htmlFor={`variant-quantity_step-${index}`}>Quantity Step*</Label>
                    <Input id={`variant-quantity_step-${index}`} type="number" name="quantity_step" value={variant.quantity_step || ''} onChange={handleChange} placeholder="e.g., 1 or 0.5" required step="any" min="0.01" disabled={disabled}/>
                 </div>
                 <div>
                    <Label htmlFor={`variant-max_quantity-${index}`}>Max Quantity (Optional)</Label>
                    <Input id={`variant-max_quantity-${index}`} type="number" name="max_quantity" value={variant.max_quantity || ''} onChange={handleChange} placeholder="e.g., 5" step="any" min="0" disabled={disabled}/>
                 </div>
                 <div className="flex items-center space-x-2 pt-2 sm:col-span-2">
                     <Checkbox id={`variant-is_available-${index}`} name="is_available" checked={variant.is_available ?? true} onCheckedChange={(checked) => onChange(index, 'is_available', checked)} disabled={disabled} />
                     <Label htmlFor={`variant-is_available-${index}`}>Is Available</Label>
                 </div>
            </div>
        </div>
    );
};


export default function AddProductForm({ product, onProductAdded, onCancel }) {
  const [form, setForm] = useState({ /* ... initial state ... */ });
  const [variants, setVariants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [existingGalleryImages, setExistingGalleryImages] = useState([]);
  const isEdit = Boolean(product && product.id);

  // --- Fetch Categories and Units ---
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [catData, unitData] = await Promise.all([
          apiFetch("http://localhost:3000/api/categories"),
          apiFetch("http://localhost:3000/api/units")
        ]);
        setCategories(catData || []);
        setUnits(unitData || []);
      } catch (err) {
        console.error("Failed to load categories/units:", err);
        setError("Could not load categories or units. Please try again.");
        toast.error("Failed to load categories/units.");
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // --- Populate form if editing ---
  useEffect(() => {
    if (product) { // Editing
      setForm({
        name: product.name || "", price: product.price || "", category_id: product.category_id || "", description: product.description || "",
        is_published: product.is_published ?? true, is_available: product.is_available ?? true, is_featured: product.is_featured ?? false,
        on_sale: product.on_sale ?? false, sale_price: product.sale_price || "",
        preparation_time: product.preparation_time || "24 hours", shelf_life: product.shelf_life || "",
        is_customizable: product.is_customizable ?? false, is_gift_wrappable: product.is_gift_wrappable ?? false,
        gift_wrap_price: product.gift_wrap_price || "", personalization_message_limit: product.personalization_message_limit || "",
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : "",
        image: null, images: [],
      });
      setVariants([]); // Variants not editable via PUT /products/:id
      setPreview(product.image || null);
      setExistingGalleryImages(product.product_images || []);
      setGalleryPreviews([]);
    } else { // Adding
      setForm({
          name: "", price: "", category_id: "", description: "",
          is_published: true, is_available: true, is_featured: false, on_sale: false, sale_price: "",
          preparation_time: "24 hours", shelf_life: "", is_customizable: false, is_gift_wrappable: false,
          gift_wrap_price: "", personalization_message_limit: "", tags: "",
          image: null, images: []
      });
      setVariants([{
          name: "", price_modifier: 0, sku: "", is_available: true,
          min_quantity: 1, max_quantity: "", quantity_step: 1, unit_id: ""
      }]);
      setPreview(null);
      setGalleryPreviews([]);
      setExistingGalleryImages([]);
    }
  }, [product, categories, units]); // Dependencies

  // --- Handlers ---

  // ✅ THIS IS THE MAIN handleChange for regular inputs/selects in the core form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleCheckboxChange = (name, checked) => {
    setForm({ ...form, [name]: checked === 'indeterminate' ? false : checked }); // Handle indeterminate state if Checkbox provides it
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    setForm({ ...form, image: file });
    setPreview(file ? URL.createObjectURL(file) : (product?.image || null));
  };

  const handleGalleryImagesChange = (e) => {
      const files = Array.from(e.target.files);
      setForm(prev => ({ ...prev, images: [...prev.images, ...files] }));
      const newPreviews = files.map(file => ({ url: URL.createObjectURL(file), file: file }));
      setGalleryPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeNewGalleryImage = (fileObj) => {
    setForm(prev => ({ ...prev, images: prev.images.filter(f => f !== fileObj.file) }));
    setGalleryPreviews(prev => prev.filter(p => p.url !== fileObj.url));
    URL.revokeObjectURL(fileObj.url);
  };

  const removeExistingGalleryImage = async (imageId) => {
      if (!isEdit || !product || !imageId || !window.confirm("Delete existing image permanently?")) return;
      try {
          setLoading(true);
          await apiFetch(`http://localhost:3000/api/products/images/${imageId}`, { method: 'DELETE' });
          setExistingGalleryImages(prev => prev.filter(img => img.id !== imageId));
          toast.success("Gallery image deleted.");
      } catch (err) { /* ... error handling ... */ }
      finally { setLoading(false); }
  };

  // Handler for changes within VariantInputRow components
  const handleVariantChange = (index, name, value) => {
      const updatedVariants = [...variants];
      // Ensure numeric fields are stored as numbers if possible, or handle conversion on submit
      const numFields = ['price_modifier', 'min_quantity', 'max_quantity', 'quantity_step', 'unit_id'];
      if (numFields.includes(name) && value !== '') {
          updatedVariants[index] = { ...updatedVariants[index], [name]: parseFloat(value) || value }; // Attempt conversion
      } else {
          updatedVariants[index] = { ...updatedVariants[index], [name]: value };
      }
      setVariants(updatedVariants);
  };

  const addVariant = () => {
      setVariants([...variants, {
          name: "", price_modifier: 0, sku: "", is_available: true,
          min_quantity: 1, max_quantity: "", quantity_step: 1, unit_id: ""
      }]);
  };

  const removeVariant = (index) => {
      if (!isEdit && variants.length <= 1) { // Prevent removing last variant only when adding
          toast.error("Product must have at least one variant.");
          return;
      }
      setVariants(variants.filter((_, i) => i !== index));
  };


  // --- Submit Handler (Corrected Version) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    // --- Basic Validations ---
    if (!form.category_id) {
       setError("Category is required."); toast.error("Category is required."); return;
    }
    // Variant validation only needed when adding a new product
    if (!isEdit && variants.length === 0) {
       setError("At least one product variant is required."); toast.error("At least one product variant is required."); return;
    }
    if (!isEdit) {
        const invalidVariant = variants.some(v =>
            !v.name?.trim() || // Name is required
            v.price_modifier === undefined || v.price_modifier === null || String(v.price_modifier).trim() === '' || // Modifier required (allow 0)
            !v.unit_id || // Unit is required
            !v.min_quantity || // Min quantity is required
            !v.quantity_step // Step is required
        );
        if(invalidVariant){
            setError("Please fill all required fields (*) for each variant.");
            toast.error("Missing required variant information.");
            return; // Stop submission
        }
    }

    // --- Optional Quantity Control Validations ---
     const min = parseFloat(form.min_quantity);
     const max = parseFloat(form.max_quantity);
     const step = parseFloat(form.quantity_step);
     if (form.min_quantity && (isNaN(min) || min < 0)) {
        setError("Minimum quantity must be a non-negative number."); toast.error("Invalid Minimum Quantity."); return;
     }
     if (form.max_quantity && (isNaN(max) || max <= 0 || (form.min_quantity && !isNaN(min) && max < min))) {
          setError("Maximum quantity must be a positive number and >= minimum."); toast.error("Invalid Maximum Quantity."); return;
     }
      if (form.quantity_step && (isNaN(step) || step <= 0)) {
          setError("Quantity step must be a positive number."); toast.error("Invalid Quantity Step."); return;
     }

    setLoading(true); // Start loading indicator

    try {
      const formData = new FormData();

      // Append Core Product Fields (ensure booleans are strings)
      Object.entries(form).forEach(([key, value]) => {
        if (key !== 'image' && key !== 'images' && key !== 'tags') {
          if (value !== null && value !== undefined && value !== '') {
            formData.append(key, typeof value === 'boolean' ? String(value) : value);
          }
        }
      });

      // Append Tags individually
      if (form.tags) {
        form.tags.split(',').map(tag => tag.trim()).filter(tag => tag).forEach(tag => {
          formData.append('tags', tag);
        });
      }

      // Append Main Image
      if (form.image instanceof File) {
        formData.append("image", form.image);
      }

      // Append Variants (ONLY FOR ADD/POST)
      if (!isEdit) {
        formData.append("variants", JSON.stringify(variants));
      }

      // Append Gallery Images
      if (form.images.length > 0) {
        form.images.forEach((file) => formData.append("images", file));
      }

      // Determine API Endpoint and Method
      const url = isEdit
        ? `http://localhost:3000/api/products/${product.id}`
        : `http://localhost:3000/api/products`;
      const method = isEdit ? "PUT" : "POST";

      // API Call
      const data = await apiFetch(url, { method: method, body: formData });

      // Re-fetch product data for consistency
      const finalProductData = await apiFetch(`http://localhost:3000/api/products/${data.product.id}`);

      toast.success(`Product ${isEdit ? "core details updated" : "added"} successfully!`);
      if (onProductAdded) { onProductAdded(finalProductData); }

      // Form Reset Logic
      if (!isEdit) {
        setForm({ name: "", price: "", category_id: "", description: "", is_published: true, is_available: true, is_featured: false, on_sale: false, sale_price: "", preparation_time: "24 hours", shelf_life: "", is_customizable: false, is_gift_wrappable: false, gift_wrap_price: "", personalization_message_limit: "", tags: "", image: null, images: [] });
        setVariants([{ name: "", price_modifier: 0, sku: "", is_available: true, min_quantity: 1, max_quantity: "", quantity_step: 1, unit_id: "" }]);
        setPreview(null);
        setGalleryPreviews([]);
        setExistingGalleryImages([]);
      } else {
        setForm(prev => ({ ...prev, image: null, images: [] }));
        setPreview(finalProductData.image || null);
        setExistingGalleryImages(finalProductData.product_images || []);
        setGalleryPreviews([]);
      }

      // Cleanup Previews
      galleryPreviews.forEach(p => URL.revokeObjectURL(p.url));

    } catch (err) {
      console.error("Product submission failed:", err);
      const errorMessage = err.message || (isEdit ? "Failed to update product" : "Failed to add product");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  if (loadingData) {
      return (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />
                  <p>Loading form data...</p>
              </div>
          </div>
      );
  }
return (
    // Modal structure (fixed, bg overlay, content div)
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start z-50 p-4 pt-10 overflow-y-auto"> {/* Allow scrolling */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-2xl p-6 relative mb-10"> {/* Added margin bottom */}
        <h2 className="text-2xl font-bold text-pink-600 mb-6 text-center">
          {isEdit ? "Edit Product Core Details" : "Add New Product"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* --- Core Product Details --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="name">Name*</Label><Input id="name" name="name" value={form.name} onChange={handleChange} required disabled={loading} /></div>
              <div><Label htmlFor="price">Base Price (₹)*</Label><Input id="price" type="number" name="price" value={form.price} onChange={handleChange} required disabled={loading} step="any" /></div>
              <div>
                  <Label htmlFor="category_id">Category*</Label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={form.category_id}
                    onChange={handleChange}
                    required
                    disabled={loading || categories.length === 0}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-input border rounded-md focus:outline-none focus:ring-ring focus:border-ring sm:text-sm bg-transparent disabled:opacity-50 dark:bg-zinc-700 dark:border-zinc-600"
                   >
                     <option value="" disabled>Select a category</option>
                     {categories.map((cat) => ( <option key={cat.id} value={cat.id}>{cat.name}</option> ))}
                  </select>
                   {categories.length === 0 && !loadingData && <p className="text-xs text-red-500 mt-1">No categories loaded. <a href="/admin/categories" className="underline">Add categories here</a>.</p>}
              </div>
              {/* Removed Unit dropdown from core */}
          </div>
          <div><Label htmlFor="description">Description*</Label><Textarea id="description" name="description" value={form.description} onChange={handleChange} rows={4} required disabled={loading}/></div>

          {/* --- Flags & Optional Fields --- */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4 dark:border-zinc-700">
                <div className="space-y-3">
                    <div className="flex items-center space-x-2"><Checkbox id="is_published" name="is_published" checked={form.is_published} onCheckedChange={(c)=>handleCheckboxChange('is_published',c)} disabled={loading} /><Label htmlFor="is_published">Published</Label></div>
                    <div className="flex items-center space-x-2"><Checkbox id="is_available" name="is_available" checked={form.is_available} onCheckedChange={(c)=>handleCheckboxChange('is_available',c)} disabled={loading} /><Label htmlFor="is_available">Available for Sale</Label></div>
                    <div className="flex items-center space-x-2"><Checkbox id="is_featured" name="is_featured" checked={form.is_featured} onCheckedChange={(c)=>handleCheckboxChange('is_featured',c)} disabled={loading} /><Label htmlFor="is_featured">Featured Product</Label></div>
                    <div className="flex items-center space-x-2"><Checkbox id="on_sale" name="on_sale" checked={form.on_sale} onCheckedChange={(c)=>handleCheckboxChange('on_sale',c)} disabled={loading} /><Label htmlFor="on_sale">On Sale</Label></div>
                    {form.on_sale && <div><Label htmlFor="sale_price">Sale Price (₹)</Label><Input id="sale_price" type="number" name="sale_price" value={form.sale_price} onChange={handleChange} step="any" disabled={loading} /></div>}
                </div>
                <div className="space-y-3">
                    <div><Label htmlFor="preparation_time">Preparation Time</Label><Input id="preparation_time" name="preparation_time" value={form.preparation_time} onChange={handleChange} placeholder="e.g., 24 hours" disabled={loading} /></div>
                    <div><Label htmlFor="shelf_life">Shelf Life (Optional)</Label><Input id="shelf_life" name="shelf_life" value={form.shelf_life} onChange={handleChange} placeholder="e.g., 3 days refrigerated" disabled={loading} /></div>
                    <div className="flex items-center space-x-2"><Checkbox id="is_customizable" name="is_customizable" checked={form.is_customizable} onCheckedChange={(c)=>handleCheckboxChange('is_customizable',c)} disabled={loading} /><Label htmlFor="is_customizable">Customizable</Label></div>
                    {form.is_customizable && <div><Label htmlFor="personalization_message_limit">Personalization Limit (chars)</Label><Input id="personalization_message_limit" type="number" name="personalization_message_limit" value={form.personalization_message_limit} onChange={handleChange} placeholder="0 for none" disabled={loading} /></div>}
                    <div className="flex items-center space-x-2"><Checkbox id="is_gift_wrappable" name="is_gift_wrappable" checked={form.is_gift_wrappable} onCheckedChange={(c)=>handleCheckboxChange('is_gift_wrappable',c)} disabled={loading} /><Label htmlFor="is_gift_wrappable">Gift Wrappable</Label></div>
                    {form.is_gift_wrappable && <div><Label htmlFor="gift_wrap_price">Gift Wrap Price (₹)</Label><Input id="gift_wrap_price" type="number" name="gift_wrap_price" value={form.gift_wrap_price} onChange={handleChange} step="any" placeholder="0 for free" disabled={loading} /></div>}
                </div>
           </div>

           {/* --- Tags --- */}
            <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" name="tags" value={form.tags} onChange={handleChange} placeholder="e.g., birthday, chocolate, eggless" disabled={loading} />
            </div>


          {/* --- Images --- */}
          <div className="border-t pt-4 dark:border-zinc-700">
            <Label htmlFor="main-image">Main Image {isEdit ? '(Leave blank to keep current)' : ''}</Label>
            <Input id="main-image" type="file" name="image" accept="image/*" onChange={handleMainImageChange} disabled={loading} className="mt-1"/>
            {preview && <img src={preview} alt="Main Preview" className="mt-2 w-48 h-32 object-cover rounded border" />}
          </div>
          <div>
             <Label htmlFor="gallery-images">Gallery Images {isEdit ? '(Add more or delete existing)' : '(Optional)'}</Label>
             <Input id="gallery-images" type="file" name="images" accept="image/*" multiple onChange={handleGalleryImagesChange} disabled={loading} className="mt-1"/>

             {/* Display Existing Gallery Images (Edit mode) */}
             {isEdit && existingGalleryImages.length > 0 && (
                 <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                     {existingGalleryImages.map(img => (
                         <div key={img.id} className="relative group">
                             <img src={img.image_url} alt="Existing gallery" className="w-full h-24 object-cover rounded border" />
                             <Button
                                 type="button"
                                 variant="destructive"
                                 size="icon-sm"
                                 className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                                 onClick={() => removeExistingGalleryImage(img.id)}
                                 aria-label="Delete existing gallery image"
                                 disabled={loading}
                             >
                                 <Trash2 size={14} />
                             </Button>
                         </div>
                     ))}
                 </div>
             )}

             {/* Display New Gallery Image Previews */}
             {galleryPreviews.length > 0 && (
                 <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                     {galleryPreviews.map((p, index) => (
                         <div key={index} className="relative group">
                             <img src={p.url} alt={`New gallery preview ${index + 1}`} className="w-full h-24 object-cover rounded border" />
                             <Button
                                 type="button"
                                 variant="destructive"
                                 size="icon-sm"
                                 className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                                 onClick={() => removeNewGalleryImage(p)}
                                 aria-label="Remove new gallery image"
                                 disabled={loading}
                             >
                                 <XCircle size={14} />
                             </Button>
                         </div>
                     ))}
                 </div>
             )}
          </div>

          {/* --- Variants Section (ONLY FOR ADD MODE) --- */}
          {!isEdit && (
               <div className="space-y-4 pt-4 border-t dark:border-zinc-700">
                    <div className="flex justify-between items-center">
                       <h3 className="text-lg font-semibold">Product Variants*</h3>
                       <Button type="button" size="sm" variant="outline" onClick={addVariant} disabled={loading || units.length === 0}><PlusCircle size={16} className="mr-1"/> Add Variant</Button>
                    </div>
                     {units.length === 0 && !loadingData && <p className="text-xs text-red-500 -mt-2">Cannot add variants: No units loaded. <a href="/admin/units" className="underline">Add units here</a>.</p>}
                    {variants.map((variant, index) => (
                       <VariantInputRow
                          key={index}
                          index={index}
                          variant={variant}
                          units={units} // Pass units down
                          onChange={handleVariantChange}
                          onRemove={removeVariant}
                          disabled={loading} // Disable row if main form is loading
                       />
                    ))}
                    {variants.length === 0 && <p className="text-red-500 text-sm">At least one variant is required.</p>}
               </div>
           )}
           {isEdit && <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700/50">Variant editing is not supported on this form. Use dedicated variant management if needed.</p>}


          {error && <p className="text-red-600 text-center text-sm">{error}</p>}

          {/* --- Submit/Cancel Buttons --- */}
          <div className="flex justify-end items-center gap-3 mt-6 pt-6 border-t dark:border-zinc-700">
              <Button type="button" onClick={onCancel} variant="outline" disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading || loadingData} className="bg-pink-600 hover:bg-pink-700 text-white min-w-[120px]">
                 {loading ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> ) : (isEdit ? "Update Core Details" : "Add Product")}
              </Button>
          </div>
        </form>
      </div>
    </div>
  );
}