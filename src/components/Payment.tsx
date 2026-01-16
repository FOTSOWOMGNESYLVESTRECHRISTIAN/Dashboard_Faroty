import { PaymentMethod, Wallet, Account } from "@/types/payment";
import { Wallets } from "./Wallets";
import { Accounts } from "./Accounts";
import PaymentMethods from "./PaymentMethods";
import { Transactions } from "./Transactions";
import { useEffect } from 'react';

// Styles globaux pour les animations
const globalStyles = `
  @keyframes float {
    0%, 100% {
      transform: translateY(0) rotate(0deg);
    }
    33% {
      transform: translateY(-20px) rotate(120deg);
    }
    66% {
      transform: translateY(10px) rotate(240deg);
    }
  }
`;

// Ajout des styles globaux
// const styleElement = document.createElement('style');
// styleElement.textContent = globalStyles;
// document.head.appendChild(styleElement);

interface PaymentProps {
  onViewPaymentMethodDetails: (method: PaymentMethod) => void;
  onViewWalletDetails: (wallet: Wallet) => void;
  onViewAccountDetails: (account: Account) => void;
  onViewTransactionDetails?: (transactionId: string) => void;
  activeTab?: string;
}


export function Payment({
  onViewPaymentMethodDetails,
  onViewWalletDetails,
  onViewAccountDetails,
  onViewTransactionDetails,
  activeTab = "transactions"
}: PaymentProps) {
  // Ajout des styles globaux avec useEffect
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = globalStyles;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Rendu conditionnel basé sur l'onglet actif
  const renderContent = () => {
    switch (activeTab) {
      case "wallets":
        return <Wallets onViewDetails={onViewWalletDetails} />;
      case "accounts":
        return (
          <Accounts
            onViewDetails={(account) => {
              if (onViewAccountDetails) {
                onViewAccountDetails(account);
              } else {
                window.location.href = `/account/${account.id}`;
              }
            }}
          />
        );
      case "payment-methods":
        return <PaymentMethods onViewDetails={onViewPaymentMethodDetails} />;
      case "transactions":
      default:
        return <Transactions onViewDetails={onViewTransactionDetails} />;
    }
  };

  // Titre et description dynamiques avec image associée
  const getHeaderInfo = () => {
    switch (activeTab) {
      case "wallets":
        return {
          title: "Gestion des portefeuilles",
          description: "Visualisez et gérez les portefeuilles utilisateurs",
          image: "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
          gradient: "from-purple-900/70 via-violet-800/60 to-fuchsia-900/53"
        };
      case "accounts":
        return {
          title: "Gestion des comptes",
          description: "Gérez les comptes bancaires associés",
          image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
          gradient: "from-indigo-900/70 via-purple-800/60 to-violet-900/50"
        };
      case "payment-methods":
        return {
          title: "Méthodes de paiement",
          description: "Consultez et gérez les méthodes de paiement",
          image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
          gradient: "from-blue-900/70 via-indigo-800/60 to-purple-900/50"
        };
      case "transactions":
      default:
        return {
          title: "Historique des transactions",
          description: "Suivez l'historique de toutes les opérations",
          image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
          gradient: "from-teal-900/70 via-emerald-800/60 to-green-900/50"
        };
    }
  };

  const { title, description, image, gradient } = getHeaderInfo();

  return (
    <div className="space-y-6">
      {/* Header avec image de fond */}
      <div className="relative overflow-hidden group transition-all duration-500 w-full min-h-[600px] md:min-h-[800px] lg:min-h-[900px] whitespace-nowrap text-ellipsis rounded-lg">
        {/* Image de fond avec flou */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(3px)'
          }}
        ></div>
        {/* Overlay de dégradé */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90 group-hover:opacity-100 transition-opacity duration-500`}></div>
        
        {/* Contenu du header */}
        <div className="relative z-10 w-full h-full flex flex-col justify-center items-center text-center p-6 rounded-lg overflow-hidden font-semibold">
          <span className="text-sm font-medium text-white mb-2 font-semibold drop-shadow drop-shadow">
            {activeTab.toUpperCase()}
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4 drop-shadow-lg drop-shadow">
            {title}
          </h1>
          <p className="text-white dark:text-white/50 text-lg md:text-xl max-w-2xl drop-shadow mb-4 font-semibold drop-shadow">
            {description}
          </p>
          
          {/* Éléments décoratifs */}
          <div className="flex space-x-4">
            <div className="w-12 h-1 rounded-full bg-blue-100 drop-shadow drop-shadow"></div>
            <div className="w-8 h-1 rounded-full bg-blue-100 drop-shadow drop-shadow"></div>
            <div className="w-4 h-1 rounded-full bg-blue-100 drop-shadow drop-shadow"></div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </div>
    </div>
  );
}