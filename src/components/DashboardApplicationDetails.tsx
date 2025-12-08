import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AppstoreOutlined,
  UserOutlined,
  TransactionOutlined,
  WalletOutlined,
  AccountBookOutlined,
  CreditCardOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';

interface DashboardApplicationDetailsProps {
  onBack: () => void;
}

// Import des composants
import ApplicationDetailsView from './ApplicationDetailsView';
import UtilisateurApplicationDetails from './utilisateurApplicationDetails';
import TransactionApplicationDetails from './TransactionApplicationDetails';
import WalletApplicationDetails from './WalletApplicationDetails';
import AccountApplicationDetails from './AccountApplicationDetails';
import AbonnementApplicationDetails from './abonnementApplicationDetails';

const DashboardApplicationDetails: React.FC<DashboardApplicationDetailsProps> = ({ onBack }) => {
  console.log('DashboardApplicationDetails - Rendu du composant');
  const { id } = useParams();
  console.log('DashboardApplicationDetails - ID de l\'application:', id);
  const [selectedKey, setSelectedKey] = useState('1');
  console.log('DashboardApplicationDetails - Clé sélectionnée:', selectedKey);

  const handleMenuClick = (e: any) => {
    setSelectedKey(e.key);
  };

  const renderContent = () => {
    console.log('DashboardApplicationDetails - Rendu du contenu, clé sélectionnée:', selectedKey);
    switch (selectedKey) {
      case '1':
        return <ApplicationDetailsView />;
      case '2':
        return <UtilisateurApplicationDetails />;
      case '3':
        return <TransactionApplicationDetails />;
      case '4':
        return <WalletApplicationDetails />;
      case '5':
        return <AccountApplicationDetails />;
      case '6':
        return <AbonnementApplicationDetails />;
      default:
        return <ApplicationDetailsView />;
    }
  };

  console.log('DashboardApplicationDetails - Rendu du layout principal');
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', background: '#001529', color: 'white' }}>
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center' }}>
          <button 
            onClick={onBack}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            <ArrowLeftOutlined />
          </button>
          <h3 style={{ color: 'white', margin: 0 }}>Application #{id || 'N/A'}</h3>
        </div>
        <div style={{ padding: '8px' }}>
          <div 
            onClick={() => handleMenuClick({ key: '1' })}
            style={{
              padding: '12px',
              cursor: 'pointer',
              backgroundColor: selectedKey === '1' ? '#1890ff' : 'transparent',
              borderRadius: '4px',
              marginBottom: '4px',
              color: 'white',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <AppstoreOutlined style={{ marginRight: '8px' }} />
            Détails de l'application
          </div>
          <div 
            onClick={() => handleMenuClick({ key: '2' })}
            style={{
              padding: '12px',
              cursor: 'pointer',
              backgroundColor: selectedKey === '2' ? '#1890ff' : 'transparent',
              borderRadius: '4px',
              marginBottom: '4px',
              color: 'white',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <UserOutlined style={{ marginRight: '8px' }} />
            Utilisateurs
          </div>
          <div 
            onClick={() => handleMenuClick({ key: '3' })}
            style={{
              padding: '12px',
              cursor: 'pointer',
              backgroundColor: selectedKey === '3' ? '#1890ff' : 'transparent',
              borderRadius: '4px',
              marginBottom: '4px',
              color: 'white',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <TransactionOutlined style={{ marginRight: '8px' }} />
            Transactions
          </div>
          <div 
            onClick={() => handleMenuClick({ key: '4' })}
            style={{
              padding: '12px',
              cursor: 'pointer',
              backgroundColor: selectedKey === '4' ? '#1890ff' : 'transparent',
              borderRadius: '4px',
              marginBottom: '4px',
              color: 'white',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <WalletOutlined style={{ marginRight: '8px' }} />
            Portefeuilles
          </div>
          <div 
            onClick={() => handleMenuClick({ key: '5' })}
            style={{
              padding: '12px',
              cursor: 'pointer',
              backgroundColor: selectedKey === '5' ? '#1890ff' : 'transparent',
              borderRadius: '4px',
              marginBottom: '4px',
              color: 'white',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <AccountBookOutlined style={{ marginRight: '8px' }} />
            Comptes
          </div>
          <div 
            onClick={() => handleMenuClick({ key: '6' })}
            style={{
              padding: '12px',
              cursor: 'pointer',
              backgroundColor: selectedKey === '6' ? '#1890ff' : 'transparent',
              borderRadius: '4px',
              marginBottom: '4px',
              color: 'white',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <CreditCardOutlined style={{ marginRight: '8px' }} />
            Abonnements
          </div>
        </div>
      </div>
      
      {/* Contenu principal */}
      <div style={{ 
        flex: 1, 
        padding: '24px',
        backgroundColor: '#f0f2f5',
        overflow: 'auto'
      }}>
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          minHeight: '280px'
        }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DashboardApplicationDetails;
