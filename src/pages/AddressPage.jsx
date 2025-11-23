import React, { useEffect, useState, useRef } from "react";
import { apiFetch } from "../Context/apiFetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"; // Added DialogDescription
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Pencil, Trash2, MapPin, Home, Briefcase, Building, Search } from "lucide-react";
import toast from "react-hot-toast";
import debounce from 'lodash.debounce';

// --- Constants ---
const ADDRESS_TYPES = [
  { value: "Home", icon: Home },
  { value: "Work", icon: Briefcase },
  { value: "Other", icon: Building },
];

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function AddressPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => { loadAddresses(); }, []);

  async function loadAddresses() {
    setLoading(true);
    try {
      const data = await apiFetch(`${API_BASE}/api/addresses`);
      setAddresses(data || []);
    } catch (error) {
      console.error("Failed to load addresses", error);
      toast.error("Could not load addresses");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await apiFetch(`${API_BASE}/api/addresses/${id}`, { method: "DELETE" });
      toast.success("Address deleted");
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      toast.error(error.message || "Failed to delete");
    }
  };

  const handleOpenCreate = () => {
    setEditingAddress(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (addr) => {
    setEditingAddress(addr);
    setIsDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    loadAddresses();
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-stone-900">My Addresses</h1>
            <p className="text-stone-500 mt-1">Manage your delivery locations</p>
          </div>
          <Button onClick={handleOpenCreate} className="bg-orange-600 hover:bg-orange-700 text-white shadow-md">
            <Plus className="w-4 h-4 mr-2" /> Add New
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-300">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-medium text-stone-900">No addresses saved</h3>
            <p className="text-stone-500 mb-6">Add an address to speed up your checkout.</p>
            <Button variant="outline" onClick={handleOpenCreate}>Add Address</Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {addresses.map((addr) => (
              <AddressCard key={addr.id} address={addr} onEdit={() => handleOpenEdit(addr)} onDelete={() => handleDelete(addr.id)} />
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
              {/* Fix for Missing Description Warning */}
              <DialogDescription>
                {editingAddress ? "Update your delivery details below." : "Enter details for your new delivery location."}
              </DialogDescription>
            </DialogHeader>
            <AddressForm 
              initialData={editingAddress} 
              onSuccess={handleFormSuccess} 
              onCancel={() => setIsDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function AddressCard({ address, onEdit, onDelete }) {
  const Icon = ADDRESS_TYPES.find(t => t.value === address.type)?.icon || MapPin;
  return (
    <Card className={`relative border transition-all hover:shadow-md ${address.is_default ? 'border-orange-500 bg-orange-50/30' : 'border-stone-200 bg-white'}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-white p-2 rounded-full border border-stone-100 shadow-sm">
              <Icon className="w-4 h-4 text-stone-600" />
            </div>
            <span className="font-bold text-stone-800">{address.type}</span>
            {address.is_default && <span className="bg-orange-100 text-orange-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wide">Default</span>}
          </div>
          <div className="flex gap-1">
            <button onClick={onEdit} className="p-2 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"><Pencil className="w-4 h-4" /></button>
            <button onClick={onDelete} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="space-y-1 text-sm text-stone-600">
          <p className="font-semibold text-stone-900 text-base">{address.recipient_name}</p>
          <p>{address.house_no}{address.floor_no ? `, ${address.floor_no}` : ''} {address.society_building}</p>
          <p>{address.street_address}</p>
          {address.landmark && <p className="text-xs text-stone-500">Near {address.landmark}</p>}
          <p className="font-medium text-stone-800 mt-2">{address.city}, {address.state} - {address.pincode}</p>
          <p className="pt-2 flex items-center gap-2 text-xs"><span className="font-bold uppercase tracking-wider text-stone-400">Phone:</span> {address.recipient_phone}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AddressForm({ initialData, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    recipient_name: "", recipient_phone: "", pincode: "", state: "", city: "",
    house_no: "", floor_no: "", society_building: "", street_address: "", landmark: "",
    type: "Home", is_default: false,
  });
  const [loading, setLoading] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        floor_no: initialData.floor_no || "",
        landmark: initialData.landmark || "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Mappls Autosuggest Logic ---
  const fetchSuggestions = async (input) => {
    if (!input || input.length < 3) {
        setSuggestions([]);
        return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/places/search?query=${encodeURIComponent(input)}`);
      const data = await res.json();
      setSuggestions(data.suggestedLocations || []);
    } catch (error) {
      console.error("Search error", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const debouncedSearch = useRef(debounce((q) => fetchSuggestions(q), 400)).current;

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleSelectPlace = async (eloc, placeName) => {
    setSearchQuery(placeName); // Keep the search input matched
    setSuggestions([]); // Hide suggestions
    setSearchLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/places/details/${eloc}`);
      const details = await res.json();
      console.log("Mappls Details:", details);

      let extractedPincode = details.pincode || "";
      let extractedCity = details.city || details.district || "";
      let extractedState = details.state || "";
      let extractedStreet = details.street || details.subLocality || details.address || "";

      // --- FALLBACK PARSER ---
      // If the API returns just a formatted address string (e.g., "Vasna, Ahmedabad, Gujarat, 380007")
      // we try to split it to find the missing pieces.
      if (details.address && (!extractedPincode || !extractedCity || !extractedState)) {
        const parts = details.address.split(",").map(s => s.trim());
        // Heuristic: Last part is usually Pincode, second last is State, third last is City
        if (parts.length >= 3) {
            const potentialPincode = parts[parts.length - 1];
            if (/^\d{6}$/.test(potentialPincode)) {
                if (!extractedPincode) extractedPincode = potentialPincode;
                if (!extractedState) extractedState = parts[parts.length - 2];
                if (!extractedCity) extractedCity = parts[parts.length - 3];
            }
        }
      }

      setFormData(prev => ({
        ...prev,
        pincode: extractedPincode || prev.pincode,
        city: extractedCity || prev.city,
        state: extractedState || prev.state,
        street_address: extractedStreet || prev.street_address,
        
        // Use the Place Name (from search) or House Name for Society/Building
        society_building: placeName || details.name || details.houseName || prev.society_building,
        
        landmark: details.poi || details.subSubLocality || prev.landmark,
        house_no: details.houseNumber || prev.house_no
      }));
      
      toast.success("Address details autofilled!");
    } catch (error) {
      console.error("Details error", error);
      toast.error("Failed to fetch place details");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const url = initialData 
      ? `${API_BASE}/api/addresses/${initialData.id}`
      : `${API_BASE}/api/addresses`;
    const method = initialData ? "PUT" : "POST";

    try {
      await apiFetch(url, { method, body: JSON.stringify(formData) });
      toast.success(initialData ? "Address updated" : "Address created");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2 relative">
      {/* --- AutoSuggest Input --- */}
      <div className="space-y-2 relative z-50">
        <Label>Search Address (Auto-fill)</Label>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input 
                value={searchQuery} 
                onChange={handleSearchChange} 
                placeholder="Type to search places..." 
                className="pl-9"
            />
            {searchLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-orange-500" />}
        </div>
        
        {suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white border border-stone-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 mt-1">
                {suggestions.map((item) => (
                    <li 
                        key={item.eLoc} 
                        onClick={() => handleSelectPlace(item.eLoc, item.placeName)}
                        className="px-4 py-3 hover:bg-stone-50 cursor-pointer border-b border-stone-50 last:border-0"
                    >
                        <div className="font-bold text-sm text-stone-800">{item.placeName}</div>
                        <div className="text-xs text-stone-500 truncate">{item.placeAddress}</div>
                    </li>
                ))}
            </ul>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="recipient_name">Recipient Name *</Label>
          <Input id="recipient_name" name="recipient_name" required value={formData.recipient_name} onChange={handleChange} placeholder="e.g. John Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipient_phone">Phone Number *</Label>
          <Input id="recipient_phone" name="recipient_phone" required value={formData.recipient_phone} onChange={handleChange} placeholder="10-digit number" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pincode">Pincode *</Label>
          <Input id="pincode" name="pincode" required value={formData.pincode} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input id="city" name="city" required value={formData.city} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Input id="state" name="state" required value={formData.state} onChange={handleChange} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="house_no">House / Flat No *</Label>
          <Input id="house_no" name="house_no" required value={formData.house_no} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="floor_no">Floor No</Label>
          <Input id="floor_no" name="floor_no" value={formData.floor_no} onChange={handleChange} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="society_building">Building / Society *</Label>
        <Input id="society_building" name="society_building" required value={formData.society_building} onChange={handleChange} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="street_address">Street Address / Area *</Label>
        <Textarea id="street_address" name="street_address" required value={formData.street_address} onChange={handleChange} className="min-h-[80px]" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="landmark">Landmark (Optional)</Label>
        <Input id="landmark" name="landmark" value={formData.landmark} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
        <div className="space-y-2">
          <Label>Address Type</Label>
          <div className="flex gap-2">
            {ADDRESS_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: t.value }))}
                className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-all ${
                  formData.type === t.value ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-600 border-stone-200 hover:border-orange-300"
                }`}
              >
                {t.value}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Checkbox id="is_default" checked={formData.is_default} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))} />
          <Label htmlFor="is_default" className="font-normal cursor-pointer">Make this my default address</Label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-stone-100 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white min-w-[120px]">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : initialData ? "Update Address" : "Save Address"}
        </Button>
      </div>
    </form>
  );
}