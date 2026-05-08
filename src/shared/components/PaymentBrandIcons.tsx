import type { SVGProps } from "react";

export function MercadoPagoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="16" cy="16" r="16" fill="#00B1EA" />
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">MP</text>
    </svg>
  );
}

export function UalaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="32" height="32" rx="16" fill="#103870" />
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial">U</text>
    </svg>
  );
}

export function NaranjaXIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="16" cy="16" r="16" fill="#FF6000" />
      <text x="16" y="18" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial">NX</text>
    </svg>
  );
}
