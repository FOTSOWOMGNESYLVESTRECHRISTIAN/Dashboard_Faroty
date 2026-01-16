// 1. Ajout des imports manquants
import React, { useState, useEffect, useCallback, JSX } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Tag, 
  Button, 
  message, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Space, 
  Tooltip,
  Typography 
} from 'antd';
import { 
  DollarOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  CloseCircleOutlined, 
  InfoCircleOutlined, 
  DownloadOutlined,
  SearchOutlined 
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import type { TableProps, ColumnType } from 'antd/es/table';
import type { RangePickerProps } from 'antd/es/date-picker';
import paymentService from '../services/paymentService';
import type { Payment } from '../types/payment';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

// 2. Définition des types
interface PaymentStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  totalAmount: number;
}

interface ApplicationDetailPaiementsProps {
  appId: string;
  onPaymentsUpdate?: () => void;
}

type RangeValue = [Dayjs | null, Dayjs | null];

// 3. Composant principal
const ApplicationDetailPaiements: React.FC<ApplicationDetailPaiementsProps> = ({ 
  appId, 
  onPaymentsUpdate 
}): JSX.Element => {
  // 4. États
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [stats, setStats] = useState<PaymentStats>({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    totalAmount: 0,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  const [dateRange, setDateRange] = useState<RangeValue>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [form] = Form.useForm();

  // 5. Fonction pour récupérer les paiements
  const fetchPayments = useCallback(async () => {
    if (!appId) {
      console.warn('Aucun appId fourni pour le chargement des paiements');
      return;
    }
    
    setLoading(true);
    try {
      const [startDate, endDate] = dateRange;
      
      if (!startDate || !endDate) {
        const errorMsg = 'Veuillez sélectionner une plage de dates valide';
        console.warn(errorMsg);
        message.warning(errorMsg);
        return;
      }

      // Validation des dates
      if (startDate.isAfter(endDate)) {
        const errorMsg = 'La date de début doit être antérieure à la date de fin';
        console.warn(errorMsg);
        message.warning(errorMsg);
        return;
      }

      const params = {
        page: pagination.current,
        limit: pagination.pageSize, // Correction: utiliser 'limit' au lieu de 'pageSize' pour correspondre à l'API
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        status: filters.status,
        search: filters.search,
      };

      console.log('Chargement des paiements avec les paramètres:', { appId, ...params });
      
      const response = await paymentService.getApplicationPayments({
        appId,
        ...params
      });
      
      console.log('Réponse des paiements reçue:', response);
      
      if (response && Array.isArray(response.data)) {
        setPayments(response.data);
        setPagination(prev => ({
          ...prev,
          total: response?.total || 0,
        }));
        calculateStats(response.data);
        
        if (response.data.length === 0) {
          message.info('Aucun paiement trouvé pour cette période');
        }
      } else {
        console.warn('Format de réponse inattendu:', response);
        setPayments([]);
        setPagination(prev => ({ ...prev, total: 0 }));
        calculateStats([]);
        message.warning('Format de réponse inattendu du serveur');
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des paiements:', error);
      
      // Gestion des erreurs spécifiques
      let errorMessage = 'Erreur lors du chargement des paiements';
      
      if (error.message) {
        if (error.message.includes('401') || error.message.includes('non autorisé') || error.message.includes('authentification')) {
          errorMessage = 'Erreur d\'authentification. Veuillez vous reconnecter.';
        } else if (error.message.includes('500') || error.message.includes('interne du serveur')) {
          errorMessage = 'Erreur interne du serveur. Veuillez réessayer plus tard.';
        } else if (error.message.includes('timeout') || error.message.includes('délai')) {
          errorMessage = 'Délai d\'attente dépassé. Vérifiez votre connexion et réessayez.';
        } else if (error.message.includes('appId')) {
          errorMessage = 'Identifiant d\'application invalide';
        } else {
          errorMessage = error.message;
        }
      }
      
      message.error(errorMessage);
      
      // Réinitialiser les données en cas d'erreur
      setPayments([]);
      setPagination(prev => ({ ...prev, total: 0 }));
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  }, [appId, pagination, filters, dateRange]);

  // 6. Fonction pour calculer les statistiques
  const calculateStats = (data: Payment[]) => {
    const completed = data.filter(p => p.status === 'completed').length;
    const pending = data.filter(p => p.status === 'pending').length;
    const failed = data.filter(p => p.status === 'failed').length;
    const totalAmount = data.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    setStats({
      total: data.length,
      completed,
      pending,
      failed,
      totalAmount,
    });
  };

  // 7. Gestionnaire d'export
  const handleExport = async () => {
    try {
      setExporting(true);
      const [startDate, endDate] = dateRange;
      
      if (!startDate || !endDate) {
        message.warning('Veuillez sélectionner une plage de dates valide');
        return;
      }
      
      const start = startDate.format('YYYY-MM-DD');
      const end = endDate.format('YYYY-MM-DD');
      
const response = await paymentService.exportPayments({
        appId,
        startDate: start,
        endDate: end,
        status: filters.status,
        search: filters.search
      });
      
      const url = window.URL.createObjectURL(new Blob([response as unknown as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `paiements-${appId}-${start}-${end}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Export des paiements réussi');
      onPaymentsUpdate?.();
      
    } catch (error) {
      console.error('Erreur lors de l\'export des paiements:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      message.error(`Échec de l'export: ${errorMessage}`);
    } finally {
      setExporting(false);
    }
  };

  // 8. Effet pour charger les paiements
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // 9. Gestionnaire de changement de page
  const handleTableChange: TableProps<Payment>['onChange'] = (pagination) => {
    if (pagination) {
      setPagination({
        current: pagination.current || 1,
        pageSize: pagination.pageSize || 10,
        total: pagination.total || 0,
      });
    }
  };

  // 10. Gestionnaire de recherche
  const handleSearch = (value: string) => {
    setFilters(prev => ({
      ...prev,
      search: value,
    }));
    setPagination(prev => ({
      ...prev,
      current: 1,
    }));
  };

  // 11. Gestionnaire de filtre de statut
  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status,
    }));
    setPagination(prev => ({
      ...prev,
      current: 1,
    }));
  };

  // 12. Gestionnaire de changement de date
  const handleDateChange: RangePickerProps['onChange'] = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
      setPagination(prev => ({
        ...prev,
        current: 1,
      }));
    }
  };

  // 13. Fonction pour afficher le statut avec un tag coloré
  const renderStatusTag = (status: string) => {
    switch (status) {
      case 'completed':
        return <Tag icon={<CheckCircleOutlined />} color="success">Complété</Tag>;
      case 'pending':
        return <Tag icon={<ClockCircleOutlined />} color="processing">En attente</Tag>;
      case 'failed':
        return <Tag icon={<CloseCircleOutlined />} color="error">Échoué</Tag>;
      case 'refunded':
        return <Tag icon={<DollarOutlined />} color="warning">Remboursé</Tag>;
      case 'cancelled':
        return <Tag icon={<CloseCircleOutlined />} color="default">Annulé</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // 14. Colonnes du tableau
  const columns: ColumnType<Payment>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <Text copyable>{text.substring(0, 8)}...</Text>,
    },
    {
      title: 'Utilisateur',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => (
        <div>
          <div>{user?.name || 'Utilisateur inconnu'}</div>
          <Text type="secondary">{user?.email}</Text>
        </div>
      ),
    },
    {
      title: 'Montant',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: Payment) => (
        <Text strong>{amount?.toFixed(2)} {record.currency?.toUpperCase() || 'USD'}</Text>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan: any) => plan?.name || 'N/A',
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => renderStatusTag(status),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Payment) => (
        <Space size="middle">
          <Tooltip title="Voir les détails">
            <Button
              type="text"
              icon={<InfoCircleOutlined />}
              onClick={() => console.log('Détails:', record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 15. Rendu du composant
  return (
    <div className="application-payments" style={{ padding: '16px' }}>
      {/* En-tête */}
      <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <h2>Gestion des Paiements</h2>
        </Col>
        <Col xs={24} md={12} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            loading={exporting}
            onClick={handleExport}
          >
            Exporter
          </Button>
        </Col>
      </Row>

      {/* Cartes de statistiques */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total des paiements"
              value={stats.total}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Montant total"
              value={stats.totalAmount}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Complétés"
              value={stats.completed}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="En attente"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filtres */}
      <Card style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item label="Période" name="dateRange">
                <RangePicker
                  style={{ width: '100%' }}
                  value={dateRange}
                  onChange={handleDateChange}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Statut du paiement" name="status">
                <Select
                  placeholder="Tous les statuts"
                  allowClear
                  onChange={handleStatusFilter}
                >
                  <Option value="completed">Complété</Option>
                  <Option value="pending">En attente</Option>
                  <Option value="failed">Échoué</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Rechercher" name="search">
                <Input
                  placeholder="ID, email, montant..."
                  prefix={<SearchOutlined />}
                  onPressEnter={(e) => handleSearch(e.currentTarget.value)}
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Tableau des paiements */}
      <Card>
        <Table
          columns={columns}
          dataSource={payments}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} paiements`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: 'Aucune donnée disponible'
          }}
        />
      </Card>
    </div>
  );
};

export default ApplicationDetailPaiements;