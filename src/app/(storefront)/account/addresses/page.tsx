"use client";

import React, { useState } from "react";

interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

const INITIAL_ADDRESSES: Address[] = [
  {
    id: "addr-1",
    name: "Audrey Hepburn",
    street: "5th Avenue 722, Apt 4B",
    city: "New York",
    zip: "10022",
    country: "United States",
    isDefault: true,
  },
  {
    id: "addr-2",
    name: "Audrey Hepburn",
    street: "Chemin de la Source 12",
    city: "Tolochenaz",
    zip: "1131",
    country: "Switzerland",
    isDefault: false,
  }
];

export default function SavedAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form States
  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("United States");
  const [isDefault, setIsDefault] = useState(false);

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const newAddress: Address = {
      id: `addr-${Date.now()}`,
      name,
      street,
      city,
      zip,
      country,
      isDefault,
    };

    let updated = [...addresses];
    if (isDefault) {
      updated = updated.map((a) => ({ ...a, isDefault: false }));
    }
    setAddresses([...updated, newAddress]);

    // Reset Form
    setName("");
    setStreet("");
    setCity("");
    setZip("");
    setIsDefault(false);
    setShowAddForm(false);
  };

  const handleSetDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isDefault: true } : { ...a, isDefault: false }))
    );
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-lg font-body">
      <div className="pb-sm border-b border-outline-variant/15 flex justify-between items-center">
        <div>
          <h2 className="font-display text-[22px] font-semibold text-primary">Saved Addresses</h2>
          <p className="text-[12px] text-on-surface-variant">Manage your shipment locations for faster checkout.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary text-white font-body text-[11px] font-bold uppercase tracking-widest py-2.5 px-4 hover:opacity-90"
        >
          {showAddForm ? "Cancel" : "Add New"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddAddress} className="bg-white p-lg border border-outline-variant/20 rounded-lg space-y-md">
          <h3 className="font-display text-[16px] font-semibold text-primary pb-sm border-b border-outline-variant/10">
            Add Shipping Address
          </h3>
          <div>
            <label className="block text-[11px] font-bold text-primary uppercase mb-2">Recipient Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-primary uppercase mb-2">Street Address</label>
            <input
              type="text"
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div>
              <label className="block text-[11px] font-bold text-primary uppercase mb-2">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-primary uppercase mb-2">Postal Code</label>
              <input
                type="text"
                required
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-primary uppercase mb-2">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full border border-outline-variant px-3 py-2 text-[14px] text-primary focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
            >
              <option value="United States">United States</option>
              <option value="Switzerland">Switzerland</option>
              <option value="France">France</option>
              <option value="United Kingdom">United Kingdom</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer"
            />
            <span className="text-[13px] text-on-surface-variant font-medium">Set as default shipping address</span>
          </label>
          <button
            type="submit"
            className="w-full bg-primary text-white font-body text-[11px] font-bold uppercase tracking-widest py-3 hover:opacity-90"
          >
            Save Address
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`p-md border rounded-lg flex flex-col justify-between bg-white transition-all shadow-sm ${
              addr.isDefault ? "border-primary" : "border-outline-variant/15"
            }`}
          >
            <div className="space-y-sm">
              <div className="flex justify-between items-start">
                <span className="font-display text-[15px] font-bold text-primary">{addr.name}</span>
                {addr.isDefault && (
                  <span className="bg-secondary/15 text-secondary text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded">
                    Default
                  </span>
                )}
              </div>
              
              <div className="text-[13px] text-on-surface-variant/80 leading-relaxed font-body">
                <p>{addr.street}</p>
                <p>{addr.city}, {addr.zip}</p>
                <p>{addr.country}</p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-lg border-t border-outline-variant/10 pt-md text-[12px] font-bold uppercase tracking-wider">
              {!addr.isDefault ? (
                <button
                  onClick={() => handleSetDefault(addr.id)}
                  className="text-primary hover:opacity-75"
                >
                  Set Default
                </button>
              ) : (
                <span className="text-secondary font-semibold">Active Default</span>
              )}
              
              <button
                onClick={() => handleDeleteAddress(addr.id)}
                className="text-on-surface-variant/60 hover:text-error transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
