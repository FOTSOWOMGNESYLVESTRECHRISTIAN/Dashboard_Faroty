import React from 'react';
import { Table, Card, Tag, Typography, Badge } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface AbonnementData {
  key: string;
  id: string;
  user: string;
  plan: string;
  status: 'Actif' | 'Expiré' | 'En attente' | 'Annulé';
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
}

const AbonnementApplicationDetails: React.FC = () => {
  const columns: ColumnsType<AbonnementData> = [
    {
      title: 'ID Abonnement',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Utilisateur',
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: 'Forfait',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan) => {
        const planMap: Record<string, { color: string }> = {
          'Premium': { color: 'gold' },
          'Business': { color: 'blue' },
          'Enterprise': { color: 'purple' },
          'Essentiel': { color: 'green' },
        };
        return (
          <Tag color={planMap[plan]?.color || 'default'}>
            {plan}
          </Tag>
        );
      },
    },
    {
      title: 'Période',
      key: 'period',
      render: (_, record) => (
        <div>
          <div>Début: {record.startDate}</div>
          <div>Fin: {record.endDate}</div>
        </div>
      ),
    },
    {
      title: 'Montant',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <div>
          {amount} {record.currency}
        </div>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          'Actif': { color: 'success', text: 'Actif' },
          'Expiré': { color: 'error', text: 'Expiré' },
          'En attente': { color: 'warning', text: 'En attente' },
          'Annulé': { color: 'default', text: 'Annulé' },
        };
        return (
          <Tag color={statusMap[status as keyof typeof statusMap]?.color || 'default'}>
            {statusMap[status as keyof typeof statusMap]?.text || status}
          </Tag>
        );
      },
    },
  ];

  // Données factices pour l'aperçu
  const data: AbonnementData[] = [
    {
      key: '1',
      id: 'SUB-001',
      user: 'Jean Dupont',
      plan: 'Premium',
      status: 'Actif',
      startDate: '2023-11-01',
      endDate: '2023-12-31',
      amount: 29.99,
      currency: 'EUR',
    },
    {
      key: '2',
      id: 'SUB-002',
      user: 'Marie Martin',
      plan: 'Business',
      status: 'Actif',
      startDate: '2023-12-01',
      endDate: '2024-01-31',
      amount: 49.99,
      currency: 'EUR',
    },
  ];

  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Abonnements des utilisateurs</span>
        </div>
      } 
      bordered={false}
    >
      <Typography.Paragraph>
        Gestion des abonnements des utilisateurs de l'application.
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

export default AbonnementApplicationDetails;
