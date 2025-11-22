import React, { useEffect, useState, useRef } from "react";
import AddressAutocomplete from "./AddressAutocomplete"; // keep your component
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

// Note: ensure you imported leaflet CSS in your project once, e.g. in index.css:
// @import "leaflet/dist/leaflet.css";

const SHOP_DEFAULT = { lat: 23.0225, lon: 72.5714 }; // replace with your bakery/shop coords

// Small helper to programmatically set map view when coords change
function SetView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat != null && center.lon != null) {
      try {
        map.setView([center.lat, center.lon], 16);
      } catch (e) {
        // ignore setView errors
        console.warn("Set view failed:", e);
      }
    }
  }, [center, map]);
  return null;
}

// Inline DraggableMarker to avoid dependency headaches
function DraggableMarker({ position, onDragEnd }) {
  const markerRef = useRef(null);

  return (
    <Marker
      draggable={true}
      position={[position.lat, position.lon]}
      ref={markerRef}
      eventHandlers={{
        dragend: (e) => {
          try {
            const m = markerRef.current;
            if (!m) return;
            const latlng = m.getLatLng();
            onDragEnd({ lat: latlng.lat, lon: latlng.lng });
          } catch (err) {
            console.error("Marker drag error:", err);
          }
        },
      }}
    />
  );
}

export default function AddressForm({ userId }) {
  // form state
  const [form, setForm] = useState({
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    label: "Home",
  });

  // coords state (defaults to shop so map never gets undefined)
  const [coords, setCoords] = useState({ lat: SHOP_DEFAULT.lat, lon: SHOP_DEFAULT.lon });
  const [hasUserPicked, setHasUserPicked] = useState(false); // true when user picks or drags marker

  // delivery info
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // When an address is selected from autosuggest
  const handleSelect = (data) => {
    try {
      const place = data?.details?.results?.[0] ?? {};
      const lat = Number(place.lat ?? data.lat ?? coords.lat);
      const lon = Number(place.lng ?? data.lon ?? coords.lon ?? place.lon);

      // set coords (ensure numbers and fallback)
      if (!isFinite(lat) || !isFinite(lon)) {
        console.warn("Selected place missing lat/lon, keeping previous coords", { lat, lon });
      } else {
        setCoords({ lat, lon });
      }

      setHasUserPicked(true);

      // auto-fill form fields from place (defensive)
      setForm((prev) => ({
        ...prev,
        address_line1: place.houseName || place.street || data.label || prev.address_line1,
        address_line2: place.locality || prev.address_line2,
        city: place.city || prev.city,
        state: place.state || prev.state,
        postal_code: place.pincode || prev.postal_code,
      }));
    } catch (err) {
      console.error("handleSelect error:", err);
      setErrorMsg("Failed to read selected place details.");
    }
  };

  // Called when marker is dragged
  const handleMarkerDrag = ({ lat, lon }) => {
    if (!isFinite(lat) || !isFinite(lon)) return;
    setCoords({ lat, lon });
    setHasUserPicked(true);
  };

  // Delivery check: only when coords are valid and user picked or coords changed
  useEffect(() => {
    let mounted = true;
    async function checkDelivery() {
      // ensure coords exist and are numbers
      const lat = Number(coords?.lat);
      const lon = Number(coords?.lon);
      if (!isFinite(lat) || !isFinite(lon)) {
        setDeliveryInfo(null);
        return;
      }

      setCheckingDelivery(true);
      setErrorMsg(null);

      try {
        const res = await fetch("/api/delivery/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lon }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          console.warn("delivery check returned non-OK:", res.status, errBody);
          if (!mounted) return;
          setDeliveryInfo(null);
          setErrorMsg(errBody?.error || `Delivery check failed (${res.status})`);
          return;
        }

        const data = await res.json();
        if (!mounted) return;
        setDeliveryInfo(data);
      } catch (err) {
        console.error("Delivery check error:", err);
        if (!mounted) return;
        setDeliveryInfo(null);
        setErrorMsg("Delivery check unavailable");
      } finally {
        if (mounted) setCheckingDelivery(false);
      }
    }

    // Only run check if user has picked an address or marker moved
    if (hasUserPicked) checkDelivery();

    return () => {
      mounted = false;
    };
  }, [coords, hasUserPicked]);

  // Save address to backend (Supabase via Express)
  const handleSave = async (e) => {
    e?.preventDefault();
    setErrorMsg(null);

    const lat = Number(coords?.lat);
    const lon = Number(coords?.lon);

    if (!isFinite(lat) || !isFinite(lon)) {
      setErrorMsg("Invalid coordinates. Please pick an address or move the marker.");
      return;
    }

    const payload = {
      user_id: userId,
      label: form.label,
      address_line1: form.address_line1,
      address_line2: form.address_line2,
      city: form.city,
      state: form.state,
      postal_code: form.postal_code,
      country: "India",
      lat,
      lon,
      is_primary: false,
    };

    try {
      const res = await fetch("/api/address/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (!res.ok) {
        console.error("Save address failed:", body);
        setErrorMsg(body.error?.message || body.error || "Failed to save address");
        return;
      }

      alert("Address saved successfully");
      // optionally clear or keep form
    } catch (err) {
      console.error("Save address error:", err);
      setErrorMsg("Failed to save address");
    }
  };

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto">
      <h2 className="text-xl font-bold">Add / Pick Delivery Address</h2>

      <div className="space-y-3">
        <AddressAutocomplete onSelect={handleSelect} />
      </div>

      {/* MAP PREVIEW */}
      <div className="border rounded-lg h-64 overflow-hidden">
        {/* MapContainer always receives valid center (SHOP_DEFAULT or coords) */}
        <MapContainer
          center={[coords.lat ?? SHOP_DEFAULT.lat, coords.lon ?? SHOP_DEFAULT.lon]}
          zoom={16}
          className="h-full w-full"
          whenCreated={(map) => {
            // protect against invalid lat/lon
            try {
              if (coords?.lat && coords?.lon) map.setView([coords.lat, coords.lon], 16);
            } catch (e) {
              console.warn("Map setView error:", e);
            }
          }}
        >
          <SetView center={coords} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {/* Draggable marker: uses current coords */}
          <DraggableMarker position={{ lat: coords.lat ?? SHOP_DEFAULT.lat, lon: coords.lon ?? SHOP_DEFAULT.lon }} onDragEnd={handleMarkerDrag} />
        </MapContainer>
      </div>

      {/* Delivery info */}
      <div>
        {checkingDelivery ? (
          <div className="text-sm text-gray-600">Checking delivery availability…</div>
        ) : errorMsg ? (
          <div className="text-sm text-red-600">{errorMsg}</div>
        ) : deliveryInfo ? (
          deliveryInfo.insideZone ? (
            <div className="p-3 rounded-lg bg-green-50 text-green-700">
              <div>📍 Distance: {deliveryInfo.distance} km</div>
              <div>🚚 Delivery Fee: ₹{deliveryInfo.fee}</div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-red-50 text-red-700">
              <div>❌ Outside delivery zone</div>
              <div>Distance: {deliveryInfo.distance} km</div>
            </div>
          )
        ) : (
          <div className="text-sm text-gray-500">Pick an address or move the marker to check delivery.</div>
        )}
      </div>

      {/* FORM */}
      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="font-medium">Address Line 1</label>
          <input required value={form.address_line1} onChange={(e) => setForm((p) => ({ ...p, address_line1: e.target.value }))} className="w-full border px-3 py-2 rounded-lg" />
        </div>

        <div>
          <label className="font-medium">Address Line 2</label>
          <input value={form.address_line2} onChange={(e) => setForm((p) => ({ ...p, address_line2: e.target.value }))} className="w-full border px-3 py-2 rounded-lg" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-medium">City</label>
            <input required value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className="w-full border px-3 py-2 rounded-lg" />
          </div>

          <div>
            <label className="font-medium">State</label>
            <input required value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} className="w-full border px-3 py-2 rounded-lg" />
          </div>
        </div>

        <div>
          <label className="font-medium">Postal Code</label>
          <input required value={form.postal_code} onChange={(e) => setForm((p) => ({ ...p, postal_code: e.target.value }))} className="w-full border px-3 py-2 rounded-lg" />
        </div>

        <div>
          <label className="font-medium">Label</label>
          <select value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} className="w-full border px-3 py-2 rounded-lg">
            <option>Home</option>
            <option>Office</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg">
            Save Address
          </button>
        </div>
      </form>
    </div>
  );
}
