import { message } from 'antd';
import { apiClient } from '../utils/apiClient';
import { getAuthToken, clearAuthToken } from './tokenStorage';

// Interface pour les réponses API standard
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
  errorCode?: string;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  type: string | null;
  category: string | null;
  active: boolean;
  applicationId: string;
  applicationName: string;
  createdAt: number;
  updatedAt: number;
  [key: string]: any; // Pour les propriétés supplémentaires
}

export const fetchFeatures = async (applicationId: string): Promise<Feature[]> => {
  try {
    // Ajout de logs pour le débogage
    console.log('Appel à fetchFeatures avec applicationId:', applicationId);

    // Vérifier si le token est présent
    const token = getAuthToken();
    if (!token) {
      console.error('Aucun token d\'authentification trouvé');
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    // Utiliser apiClient directement, l'intercepteur ajoutera le token
    const response = await apiClient.get<ApiResponse<Feature[]>>(
      `/souscription/api/v1/features/application/${applicationId}`
    );

    if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    } else {
      throw new Error(response?.message || 'Format de réponse inattendu');
    }
  } catch (error: any) {
    console.error('Erreur lors de la récupération des fonctionnalités:', error);

    let errorMessage = 'Erreur lors du chargement des fonctionnalités';
    if (error?.response?.status === 401) {
      errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      // Nettoyer le token et rediriger vers la page de connexion
      clearAuthToken();
      window.location.href = '/login';
    } else if (error?.response?.status === 403) {
      errorMessage = "Vous n'avez pas les droits nécessaires pour effectuer cette action.";
    } else if (error?.message) {
      errorMessage = error.message;
    }

    message.error(errorMessage);
    throw error;
  }
};

// Helper pour nettoyer le payload des fonctionnalités
const sanitizeFeaturePayload = (data: { [key: string]: any }, mode: 'create' | 'update' = 'create'): Record<string, any> => {
  const { active, isActive, ...otherFields } = data;

  // Liste blanche des champs autorisés par le backend
  const allowedFields = [
    'name', 'description', 'type', 'category', 'applicationId'
  ];

  const payload: Record<string, any> = {};

  // Copier uniquement les champs autorisés
  for (const field of allowedFields) {
    if (field in otherFields) {
      payload[field] = otherFields[field];
    }
  }

  // Gérer la conversion active/isActive selon le mode
  // Le backend est INCONSISTANT :
  // - POST /features (create) attend "isActive" (et rejette "active")
  // - PUT /features/{id} (update) attend "active" (et rejette "isActive")

  const value = isActive !== undefined ? isActive : (active !== undefined ? active : true);

  if (mode === 'create') {
    payload.isActive = value;
  } else {
    payload.active = value;
  }

  // Nettoyer les null/undefined pour description, type, category 
  // car certains backends préfèrent ne pas recevoir le champ plutôt que null
  if (payload.description === null || payload.description === undefined) delete payload.description;
  if (payload.type === null || payload.type === undefined) delete payload.type;
  if (payload.category === null || payload.category === undefined) delete payload.category;

  return payload;
};

// Fonction pour créer une nouvelle fonctionnalité
export const createFeature = async (featureData: {
  name: string;
  description: string;
  type?: string | null;
  category?: string | null;
  active?: boolean;
  applicationId: string;
  applicationName: string;
}): Promise<Feature> => {
  try {
    // Vérifier si le token est présent
    const token = getAuthToken();
    if (!token) {
      console.error('Aucun token d\'authentification trouvé');
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    // Mode 'create' -> utilisera isActive
    const payload = sanitizeFeaturePayload(featureData, 'create');

    console.log('Création d\'une nouvelle fonctionnalité:', payload);

    const response = await apiClient.post<ApiResponse<Feature>>(
      '/souscription/api/v1/features',
      payload
    );

    if (response && response.success && response.data) {
      message.success('Fonctionnalité créée avec succès');
      return response.data;
    } else {
      throw new Error(response?.message || 'Erreur lors de la création de la fonctionnalité');
    }
  } catch (error: any) {
    console.error('Erreur lors de la création de la fonctionnalité:', error);

    let errorMessage = 'Erreur lors de la création de la fonctionnalité';
    if (error?.response?.status === 401) {
      errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      clearAuthToken();
      window.location.href = '/login';
    } else if (error?.response?.status === 403) {
      errorMessage = "Impossible de créer la fonctionnalité : accès refusé.";
    } else if (error?.message) {
      errorMessage = error.message;
    }

    message.error(errorMessage);
    throw new Error(errorMessage);
  }
};

// Fonction pour mettre à jour une fonctionnalité
export const updateFeature = async (
  id: string,
  featureData: {
    name?: string;
    description?: string | null;
    type?: string | null;
    category?: string | null;
    active?: boolean;
    applicationId: string;
  }
): Promise<Feature> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    // Mode 'update' -> utilisera active
    const payload = sanitizeFeaturePayload(featureData, 'update');

    const response = await apiClient.put<ApiResponse<Feature>>(
      `/souscription/api/v1/features/${id}`,
      payload
    );

    if (response && response.success && response.data) {
      message.success('Fonctionnalité mise à jour avec succès');
      return response.data;
    } else {
      throw new Error(response?.message || 'Erreur lors de la mise à jour de la fonctionnalité');
    }
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la fonctionnalité:', error);

    let errorMessage = 'Erreur lors de la mise à jour de la fonctionnalité';
    if (error?.response?.status === 401) {
      errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      clearAuthToken();
      window.location.href = '/login';
    } else if (error?.response?.status === 403) {
      errorMessage = "Vous n'avez pas les droits pour modifier cette fonctionnalité.";
    } else if (error?.message) {
      errorMessage = error.message;
    }

    message.error(errorMessage);
    throw new Error(errorMessage);
  }
};

// Fonction pour supprimer une fonctionnalité
export const deleteFeature = async (id: string): Promise<boolean> => {
  try {
    // Vérifier si le token est présent
    const token = getAuthToken();
    if (!token) {
      console.error('Aucun token d\'authentification trouvé');
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    console.log(`Suppression de la fonctionnalité ${id}`);

    const response = await apiClient.delete<ApiResponse<boolean>>(
      `/souscription/api/v1/features/${id}`
    );

    if (response && response.success) {
      message.success('Fonctionnalité supprimée avec succès');
      return true;
    } else {
      throw new Error(response?.message || 'Erreur lors de la suppression de la fonctionnalité');
    }
  } catch (error: any) {
    console.error('Erreur lors de la suppression de la fonctionnalité:', error);

    let errorMessage = 'Erreur lors de la suppression de la fonctionnalité';
    if (error?.response?.status === 401) {
      errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      clearAuthToken();
      window.location.href = '/login';
    } else if (error?.response?.status === 403) {
      errorMessage = "Vous n'avez pas les droits pour supprimer cette fonctionnalité.";
    } else if (error?.message) {
      errorMessage = error.message;
    }

    message.error(errorMessage);
    throw error;
  }
};
