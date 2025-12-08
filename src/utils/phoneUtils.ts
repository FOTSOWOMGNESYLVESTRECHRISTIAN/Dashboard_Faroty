/**
 * Remplace le préfixe "+33" par "237" dans les numéros de téléphone
 */
export const normalizePhoneNumber = (phoneNumber: string | null | undefined): string | null => {
  if (!phoneNumber) return null;
  // Remplacer +33 par 237
  return phoneNumber.replace(/^\+33/, "237");
};

