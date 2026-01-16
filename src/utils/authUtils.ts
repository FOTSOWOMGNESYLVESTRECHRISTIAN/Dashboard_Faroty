import { getUserProfile } from "../services/tokenStorage";

export const resolveConnectedUserId = (): string | null => {
  const profile = getUserProfile<any>();
  if (!profile || typeof profile !== "object") {
    return null;
  }
  
  // Vérifier si l'ID est dans des propriétés courantes de profil
  if (profile.id) return profile.id;
  if (profile.userId) return profile.userId;
  if (profile.sub) return profile.sub; // Pour les JWT
  
  return null;
};
