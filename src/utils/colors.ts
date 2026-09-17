const RESET = "\u001b[0m";

export const cian = (texto: string): string => `\u001b[36m${texto}${RESET}`;
export const amarillo = (texto: string): string => `\u001b[33m${texto}${RESET}`;
export const verde = (texto: string): string => `\u001b[32m${texto}${RESET}`;
export const rojo = (texto: string): string => `\u001b[31m${texto}${RESET}`;