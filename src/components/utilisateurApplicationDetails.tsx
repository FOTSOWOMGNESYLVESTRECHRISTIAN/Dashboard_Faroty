import React from 'react';
import { Table, Card, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface UserData {
  key: string;
  name: string;
  email: string;
  status: 'Actif' | 'Inactif';
  lastLogin: string;
}

const UtilisateurApplicationDetails: React.FC = () => {
  const columns: ColumnsType<UserData> = [
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span style={{ color: status === 'Actif' ? '#52c41a' : '#ff4d4f' }}>
          {status}
        </span>
      ),
    },
    {
      title: 'Dernière connexion',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
    },
  ];

  // Données factices pour l'aperçu
  const data: UserData[] = [
    {
      key: '1',
      name: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      status: 'Actif',
      lastLogin: '2023-12-08 14:30:22',
    },
    {
      key: '2',
      name: 'Marie Martin',
      email: 'marie.martin@example.com',
      status: 'Inactif',
      lastLogin: '2023-12-07 09:15:45',
    },
  ];

  return (
    <Card title="Utilisateurs de l'application" bordered={false}>
      <Typography.Paragraph>
        Liste des utilisateurs ayant accès à cette application.
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

export default UtilisateurApplicationDetails;
