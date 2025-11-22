import { useEffect, useState } from "react";

export default function AddressList({ userId, onSelectAddress }) {
  const [list, setList] = useState([]);

  async function load() {
    const res = await fetch(`/api/address/list/${userId}`);
    const data = await res.json();
    setList(data.data || []);
  }

  useEffect(() => {
    load();
  }, []);

  const setPrimary = async (id) => {
    await fetch(`/api/address/set-primary/${id}/${userId}`, {
      method: "POST",
    });
    load();
  };

  const del = async (id) => {
    await fetch(`/api/address/delete/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-3">
      {list.map((address) => (
        <div
          key={address.id}
          className={`p-4 border rounded-lg ${
            address.is_primary ? "bg-blue-50 border-blue-300" : "bg-white"
          }`}
        >
          <div onClick={() => onSelectAddress(address)} className="cursor-pointer">
            <p className="font-semibold">{address.label}</p>
            <p className="text-sm">{address.address_line1}</p>
            <p className="text-sm">
              {address.city}, {address.state} {address.postal_code}
            </p>
          </div>

          <div className="flex gap-3 mt-2">
            {!address.is_primary && (
              <button
                onClick={() => setPrimary(address.id)}
                className="text-blue-600"
              >
                Set Primary
              </button>
            )}
            <button
              onClick={() => del(address.id)}
              className="text-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
