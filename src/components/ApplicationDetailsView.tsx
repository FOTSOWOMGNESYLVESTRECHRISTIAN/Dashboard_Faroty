import React from 'react';
import { Card, Row, Col, Statistic, Tag, Typography, Descriptions } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  MoneyCollectOutlined,
  BarChartOutlined,
  AlertOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ApplicationDetailsView: React.FC = () => {
  // Données factices pour l'aperçu
  const appData = {
    name: 'Mon Application Premium',
    id: 'APP-123456',
    status: 'active',
    description: 'Application de gestion financière avancée avec des fonctionnalités premium pour les utilisateurs professionnels.',
    category: 'Finance',
    created: '15/03/2023',
    lastUpdated: '01/12/2023',
    owner: 'Entreprise XYZ',
    apiKey: 'sk_test_51Hx...',
    webhookUrl: 'https://api.example.com/webhook',
    stats: {
      totalUsers: 1245,
      activeUsers: 892,
      monthlyRevenue: 12450.75,
      totalTransactions: 5678,
      successRate: 98.7,
      avgSession: '12m 34s',
    }
  };

  const statusColor = appData.status === 'active' ? 'success' : 'error';
  const statusText = appData.status === 'active' ? 'Actif' : 'Inactif';

  return (
    <div className="application-details">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>
              {appData.name}
              <Tag color={statusColor} style={{ marginLeft: 8 }}>
                {statusText}
              </Tag>
            </Title>
            <div>
              <Tag color="blue" icon={<BarChartOutlined />}>
                {appData.category}
              </Tag>
            </div>
          </div>
          <Text type="secondary">ID: {appData.id}</Text>
          <div style={{ marginTop: 8 }}>
            <Text>{appData.description}</Text>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Utilisateurs actifs"
              value={appData.stats.activeUsers}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              suffix={`/ ${appData.stats.totalUsers}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Revenu mensuel"
              value={appData.stats.monthlyRevenue}
              precision={2}
              prefix="€"
              prefixStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Transactions"
              value={appData.stats.totalTransactions}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Taux de réussite"
              value={appData.stats.successRate}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Informations de l'application">
            <Descriptions bordered column={{ xs: 1, md: 2, lg: 3 }}>
              <Descriptions.Item label="Créée le">
                <Text>{appData.created}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Dernière mise à jour">
                <Text>{appData.lastUpdated}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Propriétaire">
                <Text>{appData.owner}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Clé API" span={2}>
                <Text copyable>{appData.apiKey}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Webhook URL">
                <Text copyable>{appData.webhookUrl}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card 
            title="Statistiques d'utilisation" 
            extra={
              <Tag icon={<ClockCircleOutlined />} color="default">
                Temps moyen de session: {appData.stats.avgSession}
              </Tag>
            }
          >
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text type="secondary">
                <AlertOutlined /> Graphique des statistiques d'utilisation à venir
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ApplicationDetailsView;
