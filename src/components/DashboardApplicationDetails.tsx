import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "./ui/button";
import {
  AppstoreOutlined,
  UserOutlined,
  DownOutlined,
  LoadingOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CreditCardOutlined,
  TagOutlined,
  WalletOutlined,
  TransactionOutlined,
  AccountBookOutlined,
  ExportOutlined,
  GiftOutlined,
  SettingOutlined,
  DollarOutlined,
  HomeOutlined,
  ApiOutlined,
  TeamOutlined,
  BarChartOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  CodeOutlined,
  DatabaseOutlined,
  CloudOutlined,
  LeftOutlined,
  RightOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { Skeleton } from 'antd';

// Styles constants pour un design moderne
const scrollbarStyles = `
  .scrollable-content::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .scrollable-content::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 10px;
  }
  .scrollable-content::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 10px;
  }
  .scrollable-content::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  }
`;

// Styles CSS en ligne
const menuItemStyle: React.CSSProperties = {
  padding: '12px 16px',
  cursor: 'pointer',
  borderRadius: '12px',
  marginBottom: '8px',
  display: 'flex',
  alignItems: 'center',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  outline: 'none',
  border: '1px solid transparent',
  position: 'relative',
  overflow: 'hidden'
};

const getMenuItemStyle = (isActive: boolean): React.CSSProperties => ({
  ...menuItemStyle,
  backgroundColor: isActive ? 'rgba(102, 126, 234, 0.15)' : 'transparent',
  color: isActive ? '#667eea' : '#4a5568',
  border: isActive ? '1px solid rgba(102, 126, 234, 0.3)' : '1px solid transparent',
  transform: isActive ? 'translateX(4px)' : 'none',
  boxShadow: isActive ? '0 4px 20px rgba(102, 126, 234, 0.15)' : 'none',
  ':hover': {
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
    border: '1px solid rgba(102, 126, 234, 0.2)',
    transform: 'translateX(4px)'
  },
  ':focus': {
    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.2)',
    border: '1px solid rgba(102, 126, 234, 0.3)'
  }
});

const subMenuItemStyle: React.CSSProperties = {
  padding: '10px 16px 10px 32px',
  cursor: 'pointer',
  borderRadius: '10px',
  margin: '6px 0',
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px',
  outline: 'none',
  transition: 'all 0.2s ease',
  border: '1px solid transparent'
};

const getSubMenuItemStyle = (isActive: boolean): React.CSSProperties => ({
  ...subMenuItemStyle,
  backgroundColor: isActive ? 'rgba(102, 126, 234, 0.12)' : 'transparent',
  color: isActive ? '#667eea' : '#4a5568',
  borderLeft: isActive ? '3px solid #667eea' : '3px solid transparent',
  ':hover': {
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
    paddingLeft: '36px'
  }
});

const countBadgeStyle: React.CSSProperties = {
  marginLeft: 'auto',
  fontSize: '12px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  borderRadius: '12px',
  padding: '2px 8px',
  height: '22px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '22px',
  fontWeight: 600,
  boxShadow: '0 2px 4px rgba(102, 126, 234, 0.2)'
};

// Composant MenuItem amélioré
interface MenuItemProps {
  itemKey: string;
  icon?: React.ReactNode;
  label: string;
  count?: number;
  isActive: boolean;
  onClick: (key: string) => void;
  isSubmenu?: boolean;
  style?: React.CSSProperties;
}

const MenuItem = React.memo(({
  itemKey,
  icon,
  label,
  count,
  isActive,
  onClick,
  isSubmenu = false,
  style: customStyle = {}
}: MenuItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(itemKey);
    }
  };

  const style = {
    ...(isSubmenu ? getSubMenuItemStyle(isActive) : getMenuItemStyle(isActive)),
    ...customStyle,
    transform: isHovered && !isActive ? 'translateX(4px)' : isActive ? 'translateX(4px)' : 'none'
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(itemKey)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={style}
      aria-current={isActive ? 'page' : undefined}
      className="menu-item"
    >
      {icon && (
        <span style={{
          marginRight: '12px',
          fontSize: '16px',
          opacity: isActive ? 1 : 0.8,
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          transition: 'all 0.2s ease'
        }}>
          {icon}
        </span>
      )}
      <span style={{
        fontWeight: isActive ? 600 : 500,
        fontSize: isSubmenu ? '14px' : '15px'
      }}>
        {label}
      </span>
      {count !== undefined && count > 0 && (
        <div style={countBadgeStyle}>
          {count > 99 ? '99+' : count}
        </div>
      )}
      {isActive && (
        <div style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '4px',
          height: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '2px'
        }} />
      )}
    </div>
  );
});

interface Feature {
  id: string;
  name: string;
  description: string;
  key: string;
  type?: string;
  category?: string;
  applicationId?: string;
}

interface AppData {
  id: string;
  name: string;
  type: string;
  platform: string;
  status: 'inactive' | 'active' | 'maintenance';
  logo?: string;
  description: string;
  category: string;
  version: string;
  lastUpdate: string;
  features: Feature[];
  plans: any[];
  abonnements?: number;
  promotions?: any[];
  owner?: string;
  apiKey?: string;
  webhookUrl?: string;
  stats?: {
    totalUsers?: number;
    activeUsers?: number;
    monthlyRevenue?: number;
    totalTransactions?: number;
    successRate?: number;
    avgSession?: string;
  };
  totalUsers?: number;
  activeUsers?: number;
  monthlyRevenue?: number;
  totalTransactions?: number;
  successRate?: number;
  avgSession?: string;
}

interface ApplicationDetailPlansProps {
  applicationId: string;
  onPlansUpdate?: (plans: Plan[]) => void;
}

interface DashboardApplicationDetailsProps {
  onBack: () => void;
  appData?: AppData | null;
}

// Import des composants (assurez-vous que ces composants existent)
import ApplicationDetailsView from './ApplicationDetailsView';
import { ApplicationDetailFonctionnalites } from './ApplicationDetailFonctionnalites';
import { ApplicationDetailPlans, Plan } from './ApplicationDetailPlans';
import ApplicationDetailPaiements from './ApplicationDetailPaiements';
import { ApplicationDetailPromotions } from './ApplicationDetailPromotions';
import { ApplicationDetailWallets } from './ApplicationDetailWallets';
import { ApplicationDetailAccounts } from './ApplicationDetailAccounts';
import { ApplicationDetailAbonnements } from './ApplicationDetailAbonnements';
import { ApplicationDetailParameters } from './ApplicationDetailParameters';

const detailMenuItems = [
  { key: '1-1', icon: <HomeOutlined />, label: 'Aperçu Général', count: 0 },
  { key: '1-2', icon: <TagOutlined />, label: 'Fonctionnalités', count: 0 },
  { key: '1-3', icon: <CreditCardOutlined />, label: 'Forfaits & Tarifs', count: 0 },
  { key: '1-4', icon: <DollarOutlined />, label: 'Paiements', count: 0 },
  { key: '1-5', icon: <GiftOutlined />, label: 'Promotions', count: 0 },
  { key: '1-6', icon: <WalletOutlined />, label: 'Portefeuilles', count: 0 },
  { key: '1-7', icon: <TeamOutlined />, label: 'Comptes liés', count: 0 },
  { key: '1-8', icon: <TransactionOutlined />, label: 'Abonnements', count: 0 },
  // { key: '1-9', icon: <ApiOutlined />, label: 'API & Intégrations', count: 0 },
  // { key: '1-10', icon: <BarChartOutlined />, label: 'Analytiques', count: 0 },
  { key: '1-11', icon: <SettingOutlined />, label: 'Paramètres', count: 0 },
  // { key: '1-12', icon: <SafetyCertificateOutlined />, label: 'Sécurité', count: 0 },
  // { key: '1-13', icon: <DatabaseOutlined />, label: 'Base de données', count: 0 },
  // { key: '1-14', icon: <CloudOutlined />, label: 'Déploiement', count: 0 },
];

const mainMenuItems = [
  { key: '2', icon: <UserOutlined />, label: 'Comptes utilisateurs' },
  { key: '3', icon: <TransactionOutlined />, label: 'Gestion des abonnements' },
];

const DashboardApplicationDetails: React.FC<DashboardApplicationDetailsProps> = ({ onBack, appData: propAppData }) => {
  // États pour gérer la rétractation de la sidebar et le menu déroulant
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { id } = useParams<{ id: string }>();
  const [selectedKey, setSelectedKey] = useState('1-1');
  const [appData, setAppData] = useState<AppData | null>(propAppData || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>('details');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const toggleDropdown = (key: string) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchAppDetails = async () => {
      if (propAppData) {
        if (isMounted) {
          setAppData(propAppData);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        // Simuler un chargement d'application
        // Dans une application réelle, vous feriez un appel API ici
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simuler des données d'application
        const mockAppData: AppData = {
          id: id || '1',
          name: 'Application de démonstration',
          type: 'web',
          platform: 'web',
          status: 'active',
          description: 'Une application de démonstration pour le tableau de bord',
          category: 'Productivité',
          version: '1.0.0',
          lastUpdate: new Date().toISOString(),
          features: [],
          plans: [],
          abonnements: 0,
          promotions: [],
          totalUsers: 0,
          activeUsers: 0,
          monthlyRevenue: 0,
          totalTransactions: 0,
          successRate: 0,
          avgSession: '0m 0s'
        };

        if (isMounted) {
          setAppData(mockAppData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des détails de l\'application:', err);
        if (isMounted) {
          setError('Impossible de charger les détails de l\'application. Veuillez réessayer.');
          setLoading(false);
        }
      }
    };

    fetchAppDetails();

    return () => {
      isMounted = false;
    };
  }, [id, propAppData]);

  const handleMenuClick = (key: string) => {
    setSelectedKey(key);
  };

  const renderContent = (): React.ReactNode => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[600px]">
          <div className="relative mb-6">
            <div className="h-20 w-20 animate-spin rounded-full border-4 border-primary/20 border-t-primary border-r-primary/50"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingOutlined className="text-2xl text-primary animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-foreground">Chargement de l'application</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Préparation de votre espace de gestion...
            </p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '16px',
          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 50%, transparent 100%)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          padding: '32px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              height: '64px',
              width: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '24px',
              flexShrink: 0
            }}>
              <div style={{
                height: '48px',
                width: '48px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg className="h-8 w-8 text-destructive" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '24px',
                fontWeight: 700,
                color: '#ef4444'
              }}>
                Erreur de chargement
              </h3>
              <p style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: '#ef4444',
                opacity: 0.9
              }}>
                {error}
              </p>
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '16px'
              }}>
                <Button
                  type="default"
                  style={{
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onClick={() => window.location.reload()}
                >
                  <RefreshOutlined style={{ fontSize: '16px', marginRight: '8px' }} />
                  Réessayer
                </Button>
                <Button
                  type="default"
                  onClick={onBack}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <ArrowLeftOutlined style={{ fontSize: '16px', marginRight: '8px' }} />
                  Retour
                </Button>
              </div>
            </div>
          </div>
          <div style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            height: '128px',
            width: '128px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            filter: 'blur(24px)'
          }} />
        </div>
      );
    }

    if (!appData) {
      return (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-b from-primary/5 via-transparent to-primary/5">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-xl" />
            <div className="relative bg-background rounded-full p-6 border border-primary/20 backdrop-blur-sm">
              <AppstoreOutlined className="h-12 w-12 text-primary/60 mx-auto" />
            </div>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-foreground">
            Application non trouvée
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            L'application que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <Button
            className="mt-6 gap-2 bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg hover:scale-105 transition-all duration-300 group"
            onClick={onBack}
          >
            <ArrowLeftOutlined className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
            Retour aux applications
          </Button>
        </div>
      );
    }

    // Gérer le rendu en fonction de l'onglet sélectionné
    switch (selectedKey) {
      case '1-1': // Aperçu Général
        return <ApplicationDetailsView appData={appData} />;

      case '1-2': // Fonctionnalités
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Fonctionnalités de l'application</h2>
            <ApplicationDetailFonctionnalites
              applicationId={appData.id}
              appData={appData}
            />
          </div>
        );

      case '1-3': // Forfaits & Tarifs
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Forfaits de l'application</h2>
            <ApplicationDetailPlans
              applicationId={appData.id}
              onPlansUpdate={(updatedPlans) => {
                setAppData(prev => prev ? {
                  ...prev,
                  plans: updatedPlans
                } : null);
              }}
            />
          </div>
        );

      case '1-4': // Paiements
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Paiements de l'application</h2>
            <ApplicationDetailPaiements
              appId={appData.id}
              onPaymentsUpdate={() => {
                console.log('Paiements mis à jour');
              }}
            />
          </div>
        );

      case '1-5': // Promotions
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Gestion des Promotions</h2>
            <ApplicationDetailPromotions
              key={`promotions-${appData.id}`}
              applicationId={appData.id}
              onPromotionsUpdate={() => {
                console.log('Promotions mises à jour');
              }}
            />
          </div>
        );

      case '1-6': // Portefeuilles
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Portefeuilles de l'application</h2>
            <ApplicationDetailWallets applicationId={appData.id} />
          </div>
        );

      case '1-7': // Comptes liés
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Comptes liés</h2>
            <ApplicationDetailAccounts applicationId={appData.id} />
          </div>
        );

      case '1-8': // Abonnements
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Abonnements de l'application</h2>
            <ApplicationDetailAbonnements applicationId={appData.id} />
          </div>
        );

      case '1-11': // Paramètres
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Paramètres de l'application</h2>
            <ApplicationDetailParameters applicationId={appData.id} />
          </div>
        );

      default:
        return <div>Page non trouvée</div>;
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <div style={{
        width: isSidebarCollapsed ? '80px' : '280px',
        height: '100vh',
        overflowY: 'auto',
        padding: '24px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        position: 'relative',
        transition: 'width 0.3s ease',
        flexShrink: 0,
        borderRight: '1px solid rgba(0, 0, 0, 0.1)'
      }} className="scrollable-content">
        {/* Header de la sidebar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
        }}>
          {!isSidebarCollapsed ? (
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: '#1a202c'
            }}>
              Tableau de bord
            </h2>
          ) : (
            <div style={{ width: '32px', height: '32px' }}></div>
          )}
          <Button
            type="text"
            icon={isSidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hover:bg-gray-100 transition-colors duration-200"
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              cursor: 'pointer',
              color: '#64748b'
            }}
            // icon={}
          />
        </div>

        {/* Menu de navigation */}
        <div style={{ marginTop: '16px' }}>
          {detailMenuItems.map(item => (
            <div
              key={item.key}
              onClick={() => handleMenuClick(item.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: '8px',
                marginBottom: '4px',
                cursor: 'pointer',
                backgroundColor: selectedKey === item.key ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                color: selectedKey === item.key ? '#6366f1' : '#4a5568',
                transition: 'all 0.2s ease',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ marginRight: '12px', fontSize: '16px' }}>{item.icon}</span>
              {!isSidebarCollapsed && (
                <span style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'opacity 0.2s ease',
                  opacity: isSidebarCollapsed ? 0 : 1
                }}>
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contenu principal avec design moderne */}
      <div style={{
        flex: 1,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        position: 'relative'
      }}>
        {/* En-tête Fixe */}
        <div style={{ padding: '24px 24px 0 24px', flexShrink: 0, zIndex: 10 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            padding: '16px 24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: 600,
                color: '#1a202c'
              }}>
                {appData?.name || 'Détails de l\'application'}
              </h1>
              <p style={{
                margin: '4px 0 0',
                color: '#718096',
                fontSize: '14px'
              }}>
                Gestion de l'application et de ses fonctionnalités
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={onBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'red',
                  cursor: 'pointer'
                }}
              >
                Retour
              </Button>
            </div>
          </div>
        </div>

        {/* Contenu principal Scrollable */}
        <div
          className="scrollable-content"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 24px 24px 24px'
          }}
        >
          <div style={{
            borderRadius: '16px',
            overflow: 'hidden',
            background: 'white',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            minHeight: 'calc(100% - 20px)'
          }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardApplicationDetails;