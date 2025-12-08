import React from 'react';
import { Table, Card, Tag, Typography, Progress } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface WalletData {
  key: string;
  id: string;
  user: string;
  balance: number;
  currency: string;
  status: 'Actif' | 'Bloqué' | 'En attente';
  lastActivity: string;
}

const WalletApplicationDetails: React.FC = () => {
  const columns: ColumnsType<WalletData> = [
    {
      title: 'ID Portefeuille',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Utilisateur',
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: 'Solde',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance, record) => (
        <div>
          <div>{balance} {record.currency}</div>
          <Progress 
            percent={Math.min(100, (balance / 1000) * 100)} 
            showInfo={false} 
            strokeColor={balance > 0 ? '#52c41a' : '#ff4d4f'}
          />
        </div>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = status === 'Actif' ? 'success' : status === 'Bloqué' ? 'error' : 'warning';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Dernière activité',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
    },
  ];

  // Données factices pour l'aperçu
  const data: WalletData[] = [
    {
      key: '1',
      id: 'WALLET-001',
      user: 'Jean Dupont',
      balance: 850.75,
      currency: 'EUR',
      status: 'Actif',
      lastActivity: '2023-12-08 14:30:22',
    },
    {
      key: '2',
      id: 'WALLET-002',
      user: 'Marie Martin',
      balance: 120.00,
      currency: 'EUR',
      status: 'Actif',
      lastActivity: '2023-12-08 10:15:45',
    },
  ];

  return (
    <Card title="Portefeuilles des utilisateurs" bordered={false}>
      <Typography.Paragraph>
        Aperçu des portefeuilles des utilisateurs de cette application.
      </Typography.Paragraph>
      <Table 
        columns={columns} 
        dataSource={data} 
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
      />
    </Card>
  );
};

export default WalletApplicationDetails;
