import {
  Banknote,
  CreditCard,
  Building2,
  ScrollText,
  Ellipsis,
} from "lucide-react";
import { PaymentMethod } from "@shared/types";
import {
  MercadoPagoIcon,
  NaranjaXIcon,
  UalaIcon,
  BrubankIcon,
  SantanderIcon,
  SupervielleIcon,
  FrancesIcon,
  BnaIcon,
  PrexIcon,
  CocosIcon,
  GaliciaIcon,
  LemonIcon,
  AstroPayIcon,
  ModoIcon,
} from "@shared/components/PaymentBrandIcons";

export function getPaymentIcon(method: PaymentMethod) {
  switch (method) {
    case "cash": return Banknote;
    case "card": return CreditCard;
    case "mercadopago": return MercadoPagoIcon;
    case "transfer": return Building2;
    case "naranja_x": return NaranjaXIcon;
    case "uala": return UalaIcon;
    case "brubank": return BrubankIcon;
    case "santander": return SantanderIcon;
    case "supervielle": return SupervielleIcon;
    case "frances": return FrancesIcon;
    case "bna": return BnaIcon;
    case "prex": return PrexIcon;
    case "cocos": return CocosIcon;
    case "galicia": return GaliciaIcon;
    case "lemon": return LemonIcon;
    case "astropay": return AstroPayIcon;
    case "modo": return ModoIcon;
    case "check": return ScrollText;
    case "other": return Ellipsis;
  }
}

export function getPaymentLabel(method: PaymentMethod, short = false): string {
  switch (method) {
    case "cash": return short ? "Efectivo" : "Efectivo";
    case "card": return short ? "Tarjeta" : "Tarjeta";
    case "mercadopago": return "Mercado Pago";
    case "transfer": return short ? "Transf." : "Transferencia";
    case "naranja_x": return "Naranja X";
    case "uala": return "Ualá";
    case "brubank": return "Brubank";
    case "santander": return "Santander";
    case "supervielle": return "Supervielle";
    case "frances": return "BBVA Francés";
    case "bna": return "BNA+";
    case "prex": return "Prex";
    case "cocos": return "Cocos";
    case "galicia": return "Galicia";
    case "lemon": return "Lemon";
    case "astropay": return "AstroPay";
    case "modo": return "MODO";
    case "check": return "Cheque";
    case "other": return "Otro";
  }
}
