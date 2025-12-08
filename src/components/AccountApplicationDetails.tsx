import React from 'react';
import { Table, Card, Tag, Typography, Avatar } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface AccountData {
  key: string;
  id: string;
  user: string;
  email: string;
  type: string;
  status: 'Actif' | 'Désactivé' | 'En attente';
  createdAt: string;
}

const AccountApplicationDetails: React.FC = () => {
  const columns: ColumnsType<AccountData> = [
    {
      title: 'Utilisateur',
      dataIndex: 'user',
      key: 'user',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar style={{ marginRight: 8 }}>{text.charAt(0)}</Avatar>
          <div>
            <div>{text}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Type de compte',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeMap: Record<string, { color: string; text: string }> = {
          'Premium': { color: 'gold', text: 'Premium' },
          'Standard': { color: 'blue', text: 'Standard' },
          'Admin': { color: 'red', text: 'Administrateur' },
        };
        return (
          <Tag color={typeMap[type]?.color || 'default'}>
            {typeMap[type]?.text || type}
          </Tag>
        );
      },
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          'Actif': { color: 'success', text: 'Actif' },
          'Désactivé': { color: 'error', text: 'Désactivé' },
          'En attente': { color: 'warning', text: 'En attente' },
        };
        return (
          <Tag color={statusMap[status as keyof typeof statusMap]?.color || 'default'}>
            {statusMap[status as keyof typeof statusMap]?.text || status}
          </Tag>
        );
      },
    },
    {
      title: 'Date de création',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
  ];

  // Données factices pour l'aperçu
  const data: AccountData[] = [
    {
      key: '1',
      id: 'ACC-001',
      user: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      type: 'Premium',
      status: 'Actif',
      createdAt: '2023-01-15',
    },
    {
      key: '2',
      id: 'ACC-002',
      user: 'Marie Martin',
      email: 'marie.martin@example.com',
      type: 'Standard',
      status: 'Actif',
      createdAt: '2023-02-20',
    },
  ];

  return (
    <Card title="Comptes utilisateurs" bordered={false}>
      <Typography.Paragraph>
        Gestion des comptes utilisateurs de l'application.
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

export default AccountApplicationDetails;
