import React from 'react';
import { Table, Card, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface TransactionData {
  key: string;
  id: string;
  user: string;
  type: 'Débit' | 'Crédit';
  amount: number;
  currency: string;
  status: 'Réussi' | 'Échoué' | 'En attente';
  date: string;
}

const TransactionApplicationDetails: React.FC = () => {
  const columns: ColumnsType<TransactionData> = [
    {
      title: 'ID Transaction',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Utilisateur',
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'Crédit' ? 'green' : 'red'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Montant',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <span style={{ color: record.type === 'Crédit' ? '#52c41a' : '#ff4d4f' }}>
          {record.type === 'Crédit' ? '+' : '-'}{amount} {record.currency}
        </span>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'Réussi') color = 'success';
        if (status === 'Échoué') color = 'error';
        if (status === 'En attente') color = 'processing';
        
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
  ];

  // Données factices pour l'aperçu
  const data: TransactionData[] = [
    {
      key: '1',
      id: 'TXN-001',
      user: 'Jean Dupont',
      type: 'Crédit',
      amount: 150.50,
      currency: 'EUR',
      status: 'Réussi',
      date: '2023-12-08 10:30:22',
    },
    {
      key: '2',
      id: 'TXN-002',
      user: 'Marie Martin',
      type: 'Débit',
      amount: 29.99,
      currency: 'EUR',
      status: 'Réussi',
      date: '2023-12-08 11:15:45',
    },
  ];

  return (
    <Card title="Transactions de l'application" bordered={false}>
      <Typography.Paragraph>
        Historique des transactions effectuées par les utilisateurs de cette application.
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

export default TransactionApplicationDetails;
