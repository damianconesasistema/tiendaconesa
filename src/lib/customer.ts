"use client";

import { useEffect, useState } from "react";

export type ShippingMode = "retiro" | "envio";

export type Customer = {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
  shipping: ShippingMode;
  locality: string;
  /** Cuando la localidad no esta en la lista del local. Ahi `locality` pasa a
   *  ser texto libre y se piden tambien provincia y codigo postal. */
  otraZona: boolean;
  province: string;
  postalCode: string;
  street: string;
  streetNumber: string;
  reference: string;
  notes: string;
};

export const emptyCustomer: Customer = {
  firstName: "",
  lastName: "",
  dni: "",
  email: "",
  phone: "",
  shipping: "retiro",
  locality: "",
  otraZona: false,
  province: "",
  postalCode: "",
  street: "",
  streetNumber: "",
  reference: "",
  notes: "",
};

const STORAGE_KEY = "conesa.customer.v1";

export function useCustomer() {
  const [customer, setCustomer] = useState<Customer>(emptyCustomer);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setCustomer({ ...emptyCustomer, ...parsed });
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customer));
    } catch {}
  }, [customer, hydrated]);

  return { customer, setCustomer, hydrated };
}
