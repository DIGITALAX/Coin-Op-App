import { useState } from "react";
import { ShippingDetails, PaymentToken, UsePurchaseFormReturn } from "../types/purchase.types";

export const usePurchaseForm = (): UsePurchaseFormReturn => {
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    name: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: ""
  });
  const [paymentToken, setPaymentToken] = useState<PaymentToken>("mona");
  const setPaymentTokenWithLog = (token: PaymentToken) => {
    setPaymentToken(token);
  };
  const updateShippingField = (field: keyof ShippingDetails, value: string) => {
    setShippingDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const isShippingComplete = (): boolean => {
    return Object.values(shippingDetails).every(value => value.trim().length > 0);
  };
  return {
    shippingDetails,
    setShippingDetails,
    updateShippingField,
    paymentToken,
    setPaymentToken: setPaymentTokenWithLog,
    isShippingComplete
  };
};