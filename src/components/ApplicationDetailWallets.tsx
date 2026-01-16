import { useState, useEffect } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, Wallet as WalletIcon, Loader2, AlertCircle, ChevronRight, Plus } from "lucide-react";
import { Wallet } from "../types/payment";
import {
  getAccounts,
  updateAccountStatus,
  deleteWallet,
  formatCurrency,
  formatDate,
  getStatusBadgeVariant
} from "../services/paymentService";
import { toast } from "sonner";
import { ActionMenu } from './ui/ActionMenu';
import { Modal } from 'antd';
import { WalletDetails } from "./WalletDetails";

export interface ApplicationDetailWalletsProps {
  applicationId: string;
}

export function ApplicationDetailWallets({ applicationId }: ApplicationDetailWalletsProps) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [processing, setProcessing] = useState<{ [key: string]: boolean }>({});
  const [expandedWalletId, setExpandedWalletId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const navigate = useNavigate();

  const loadWallets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simuler le chargement des portefeuilles pour l'application
      const accounts = await getAccounts();
      // Convertir les comptes en portefeuilles pour la démonstration
      const walletsData = accounts.map(account => ({
        ...account,
        id: account.id,
        account: {
          accountName: account.accountName,
          // Ajouter d'autres propriétés nécessaires
        },
        // Ajouter d'autres propriétés de Wallet nécessaires
      }));
      setWallets(walletsData);
    } catch (err) {
      console.error("Erreur lors du chargement des portefeuilles:", err);
      setError("Impossible de charger les portefeuilles. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (walletId: string, newStatus: 'suspended' | 'cancelled') => {
    try {
      setProcessing(prev => ({ ...prev, [walletId]: true }));
      await updateAccountStatus(walletId, newStatus === 'suspended' ? 'SUSPENDED' : 'CANCELLED');
      toast.success(`Statut du portefeuille mis à jour avec succès`);
      await loadWallets();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      toast.error("Erreur lors de la mise à jour du statut du portefeuille");
    } finally {
      setProcessing(prev => ({ ...prev, [walletId]: false }));
    }
  };

  const handleDeleteWallet = async (walletId: string) => {
    Modal.confirm({
      title: 'Confirmer la suppression',
      content: 'Êtes-vous sûr de vouloir supprimer définitivement ce portefeuille ? Cette action est irréversible.',
      okText: 'Oui, supprimer',
      cancelText: 'Annuler',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setProcessing(prev => ({ ...prev, [walletId]: true }));
          await deleteWallet(walletId);
          toast.success('Portefeuille supprimé avec succès');
          await loadWallets();
        } catch (error) {
          console.error("Erreur lors de la suppression du portefeuille:", error);
          toast.error("Erreur lors de la suppression du portefeuille");
        } finally {
          setProcessing(prev => ({ ...prev, [walletId]: false }));
        }
      },
    });
  };

  const handleActivateWallet = async (walletId: string) => {
    try {
      setProcessing(prev => ({ ...prev, [walletId]: true }));
      await updateWalletStatus(walletId, 'active');
      toast.success('Portefeuille activé avec succès');
      await loadWallets();
    } catch (error) {
      console.error("Erreur lors de l'activation du portefeuille:", error);
      toast.error("Erreur lors de l'activation du portefeuille");
    } finally {
      setProcessing(prev => ({ ...prev, [walletId]: false }));
    }
  };

  useEffect(() => {
    loadWallets();
  }, [applicationId]);

  const filteredWallets = wallets.filter(wallet => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (wallet.legalIdentifier?.toLowerCase().includes(searchLower) || '') ||
      (wallet.currency?.code?.toLowerCase().includes(searchLower) || '') ||
      (wallet.account?.accountName?.toLowerCase().includes(searchLower) || '')
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Chargement des portefeuilles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p>{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          style={{ cursor: 'pointer' }}
          onClick={loadWallets}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  // Fonction pour gérer la sauvegarde du portefeuille
  const handleSaveWallet = async () => {
    try {
      if (editingWallet) {
        // Logique de mise à jour du portefeuille
        console.log('Mise à jour du portefeuille:', editingWallet);
        // await updateWallet(editingWallet);
        toast.success('Portefeuille mis à jour avec succès');
      } else if (editingWallet) { // Vérification supplémentaire pour TypeScript
        // Logique de création de portefeuille
        console.log('Création d\'un nouveau portefeuille');
        // await createWallet({ ...editingWallet, applicationId });
        toast.success('Portefeuille créé avec succès');
      }
      setIsAddModalOpen(false);
      setEditingWallet(null);
      await loadWallets();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du portefeuille:', error);
      toast.error('Une erreur est survenue lors de la sauvegarde');
    }
  };

  return (
    <>
      {/* Formulaire d'ajout/mise à jour de portefeuille */}
      <Modal
        title={editingWallet ? "Modifier le portefeuille" : "Ajouter un portefeuille"}
        open={isAddModalOpen || !!editingWallet}
        onCancel={() => {
          setIsAddModalOpen(false);
          setEditingWallet(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setIsAddModalOpen(false);
            setEditingWallet(null);
          }}>
            Annuler
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={async () => {
              await handleSaveWallet();
            }}
          >
            {editingWallet ? 'Mettre à jour' : 'Créer'}
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du portefeuille</label>
            <Input
              placeholder="Nom du portefeuille"
              value={editingWallet?.account?.accountName || ''}
              onChange={(e) => {
                if (editingWallet) {
                  setEditingWallet({
                    ...editingWallet,
                    account: {
                      ...editingWallet.account,
                      accountName: e.target.value
                    }
                  });
                }
              }}
            />
          </div>
          {/* Ajoutez d'autres champs du formulaire ici */}
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un portefeuille..."
            className="pl-10 w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Modal>

      {filteredWallets.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <WalletIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium">Aucun portefeuille trouvé</h3>
          <p className="text-muted-foreground mt-1">
            {searchTerm
              ? "Aucun résultat pour votre recherche."
              : "Aucun portefeuille n'est associé à cette application pour le moment."
            }
          </p>
          <Button 
            className="mt-4" 
            style={{ cursor: 'pointer' }} 
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un portefeuille
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWallets.map((wallet) => (
            <Card key={wallet.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <WalletIcon className="h-5 w-5 text-primary" />
                      {wallet.account.accountName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {wallet.legalIdentifier}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(wallet.status || (wallet.frozen ? 'inactive' : 'active'))}>
                      {wallet.status === 'suspended' ? 'Suspendu' :
                        wallet.status === 'cancelled' ? 'Annulé' :
                          wallet.status === 'deleted' ? 'Supprimé' :
                            wallet.frozen ? 'Gelé' : 'Actif'}
                    </Badge>
                    <ActionMenu
                      status={wallet.status as any || 'active'}
                      onSuspend={() => handleStatusChange(wallet.id, 'suspended')}
                      onCancel={() => handleStatusChange(wallet.id, 'cancelled')}
                      onDelete={() => handleDeleteWallet(wallet.id)}
                      onActivate={() => handleActivateWallet(wallet.id)}
                      onEdit={() => setEditingWallet(wallet)}
                      itemType="wallet"
                      disabled={processing[wallet.id]}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Solde:</span>
                    <span className="font-medium">
                      {wallet.balance?.balance !== undefined && wallet.currency?.code
                        ? formatCurrency(wallet.balance.balance, wallet.currency.code)
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Devise:</span>
                    <span className="font-medium">
                      {wallet.currency?.code 
                        ? `${wallet.currency.code}${wallet.currency.nameFr ? ` (${wallet.currency.nameFr})` : ''}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Type:</span>
                    <span className="font-medium capitalize">
                      {wallet.walletType ? wallet.walletType.toLowerCase() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Créé le:</span>
                    <span className="text-sm">
                      {formatDate(wallet.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setExpandedWalletId(expandedWalletId === wallet.id ? null : wallet.id)}
                  >
                    {expandedWalletId === wallet.id ? 'Masquer transactions' : 'Voir les transactions'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setExpandedWalletId(expandedWalletId === wallet.id ? null : wallet.id)}
                  >
                    {expandedWalletId === wallet.id ? 'Masquer détails' : 'Détails'}
                  </Button>
                </div>

                {/* Zone de détails inline */}
                {expandedWalletId === wallet.id && (
                  <div className="mt-6 border-t pt-6 bg-slate-50 rounded-b-lg -mx-6 -mb-6 px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    <WalletDetails
                      wallet={wallet}
                      onBack={() => setExpandedWalletId(null)}
                      onRefresh={loadWallets}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
