import { PaymentMethod, Wallet, Account } from "@/types/payment";
import { Wallets } from "./Wallets";
import { Accounts } from "./Accounts";
import { PaymentMethods } from "./PaymentMethods";

interface PaymentProps {
  onViewPaymentMethodDetails: (method: PaymentMethod) => void;
  onViewWalletDetails: (wallet: Wallet) => void;
  onViewAccountDetails: (account: Account) => void;
  activeTab?: string;
}

export function Payment({
  onViewPaymentMethodDetails,
  onViewWalletDetails,
  onViewAccountDetails,
  activeTab = "transactions"
}: PaymentProps) {
  // Rendu conditionnel basé sur l'onglet actif
  const renderContent = () => {
    switch (activeTab) {
      case "wallets":
        return <Wallets onViewDetails={onViewWalletDetails} />;
      case "accounts":
        return <Accounts onViewDetails={onViewAccountDetails} />;
      case "payment-methods":
        return <PaymentMethods onViewDetails={onViewPaymentMethodDetails} />;
      case "transactions":
      default:
        return (
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-4">Transactions récentes</h3>
            <p className="text-muted-foreground">Aucune transaction récente.</p>
          </div>
        );
    }
  };

  // Titre et description dynamiques
  const getHeaderInfo = () => {
    switch (activeTab) {
      case "wallets":
        return {
          title: "Gestion des portefeuilles",
          description: "Visualisez et gérez les portefeuilles utilisateurs"
        };
      case "accounts":
        return {
          title: "Gestion des comptes",
          description: "Gérez les comptes bancaires associés"
        };
      case "payment-methods":
        return {
          title: "Méthodes de paiement",
          description: "Consultez et gérez les méthodes de paiement"
        };
      case "transactions":
      default:
        return {
          title: "Historique des transactions",
          description: "Historique complet des transactions"
        };
    }
  };

  const { title, description } = getHeaderInfo();

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 rounded-2xl p-6 bg-accent shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:bg-accent/50">
        <h2 className="text-3xl font-bold tracking-tight font-semibold">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      
      {renderContent()}
    </div>
  );
}