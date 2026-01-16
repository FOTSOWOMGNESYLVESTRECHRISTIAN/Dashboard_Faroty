import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  message,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  Popconfirm,
  Select,
  Avatar,
  Badge,
  Tooltip,
  Divider
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  TagOutlined,
  ThunderboltOutlined,
  StarOutlined,
  CrownOutlined,
  RocketOutlined,
  EyeOutlined,
  FilterOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  BulbOutlined,
  LockOutlined,
  SafetyOutlined,
  ApiOutlined
} from '@ant-design/icons';
import {
  Feature,
  fetchFeatures,
  createFeature,
  updateFeature,
  deleteFeature
} from '../services/featureService';
import { getAuthToken, clearAuthToken } from '../services/tokenStorage';

const { TextArea } = Input;
const { Option } = Select;

interface ApplicationDetailFonctionnalitesProps {
  applicationId?: string;
  appData?: {
    id: string;
    name: string;
    applicationName?: string;
  } | null;
}

export const ApplicationDetailFonctionnalites: React.FC<ApplicationDetailFonctionnalitesProps> = ({
  applicationId,
  appData
}) => {
  const [form] = Form.useForm();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadFeatures = useCallback(async () => {
    const appId = applicationId || appData?.id;
    if (!appId) {
      setError('Aucune application sélectionnée');
      setLoading(false);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      const errorMsg = 'Aucun token d\'authentification trouvé. Veuillez vous reconnecter.';
      setError(errorMsg);
      setLoading(false);
      message.error(errorMsg);
      window.location.href = '/login';
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      if (isExpired) {
        const errorMsg = 'Votre session a expiré. Veuillez vous reconnecter.';
        setError(errorMsg);
        setLoading(false);
        message.error(errorMsg);
        clearAuthToken();
        window.location.href = '/login';
        return;
      }
    } catch (e) {
      console.error('Erreur lors de la vérification du token:', e);
    }

    setLoading(true);
    setError(null);

    try {
      const appId = applicationId || appData?.id || '';
      const data = await fetchFeatures(appId);
      setFeatures(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement des fonctionnalités:', error);
      let errorMessage = 'Impossible de charger les fonctionnalités. Veuillez réessayer.';

      if (error?.response?.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        clearAuthToken();
        message.error(errorMessage);
        window.location.href = '/login';
      } else if (error?.response?.status === 403) {
        errorMessage = "Accès refusé. Vous n'avez pas les permissions nécessaires.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [applicationId, appData]);

  const handleSubmit = useCallback(async (values: any) => {
    try {
      if (!values.name || !values.type || !values.category) {
        message.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      setIsSaving(true);

      const updateData = {
        name: values.name,
        description: values.description || null,
        type: values.type,
        category: values.category,
        active: values.active !== undefined ? values.active : true,
        applicationId: applicationId || appData?.id || ''
      };

      if (editingFeature) {
        const updatedFeature = await updateFeature(editingFeature.id, {
          ...updateData,
          applicationId: editingFeature.applicationId
        });

        setFeatures(features.map(f =>
          f.id === updatedFeature.id ? updatedFeature : f
        ));
        message.success('✅ Fonctionnalité mise à jour avec succès');
      } else {
        const newFeatureData = {
          ...updateData,
          key: values.key || values.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
        };

        const newFeature = await createFeature({
          ...newFeatureData,
          applicationName: appData?.name || 'Application inconnue'
        });
        setFeatures([...features, newFeature]);
        message.success('🎉 Fonctionnalité ajoutée avec succès');
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      const errorMessage = error?.message || 'Une erreur est survenue lors de la sauvegarde';
      message.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [editingFeature, form, loadFeatures]);

  const handleDelete = async (id: string) => {
    try {
      await deleteFeature(id);
      setFeatures(features.filter(f => f.id !== id));
      message.success('🗑️ Fonctionnalité supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      message.error('Échec de la suppression de la fonctionnalité');
    }
  };

  const handleEdit = useCallback((record: Feature) => {
    form.setFieldsValue({
      ...record,
      active: record.active !== false
    });
    setEditingFeature(record);
    setIsModalVisible(true);
  }, [form]);

  const handleCancel = useCallback(() => {
    form.resetFields();
    setEditingFeature(null);
    setIsModalVisible(false);
  }, [form]);

  const openAddForm = useCallback(() => {
    form.resetFields();
    setEditingFeature(null);
    setIsModalVisible(true);
  }, [form]);

  useEffect(() => {
    loadFeatures();
  }, [applicationId, appData, loadFeatures]);

  // Filtrage et tri des fonctionnalités
  const filteredAndSortedFeatures = features
    .filter(feature => {
      if (searchTerm && !feature.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !feature.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (filterType !== 'all' && feature.type !== filterType) {
        return false;
      }
      if (filterStatus !== 'all') {
        if (filterStatus === 'active' && !feature.active) return false;
        if (filterStatus === 'inactive' && feature.active) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return <DollarCircleOutlined className="text-emerald-500" />;
      case 'auth': return <LockOutlined className="text-blue-500" />;
      case 'security': return <SafetyOutlined className="text-red-500" />;
      case 'integration': return <ApiOutlined className="text-purple-500" />;
      case 'notification': return <BellOutlined className="text-amber-500" />;
      case 'reporting': return <BarChartOutlined className="text-cyan-500" />;
      default: return <BulbOutlined className="text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'finance': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'security': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'ui': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'data': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'admin': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const columns = [
    {
      title: 'Fonctionnalité',
      key: 'feature',
      width: 300,
      render: (record: Feature) => (
        <div className="flex items-center gap-3">
          <div className={`
            h-10 w-10 rounded-xl flex items-center justify-center
            ${record.active 
              ? 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200' 
              : 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200'
            }
          `}>
            {getTypeIcon(record.type || 'feature')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                {record.name}
              </h4>
              {record.active && (
                <Badge 
                  status="processing" 
                  color="green"
                  text=""
                  className="ml-1"
                />
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">
              {record.description || 'Aucune description'}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag 
          className={`
            rounded-full px-3 py-1 border-0
            ${type === 'payment' ? 'bg-emerald-50 text-emerald-700' :
              type === 'auth' ? 'bg-blue-50 text-blue-700' :
              type === 'security' ? 'bg-red-50 text-red-700' :
              type === 'integration' ? 'bg-purple-50 text-purple-700' :
              'bg-gray-50 text-gray-700'}
          `}
        >
          {type || 'Non spécifié'}
        </Tag>
      ),
    },
    {
      title: 'Catégorie',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
          {category || 'Général'}
        </span>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'active',
      key: 'status',
      width: 100,
      render: (active: boolean) => (
        <div className={`
          inline-flex items-center gap-2 px-3 py-1 rounded-full
          ${active 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
            : 'bg-gray-50 text-gray-700 border border-gray-200'
          }
        `}>
          <div className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-500'}`} />
          <span className="text-sm font-medium">
            {active ? 'Actif' : 'Inactif'}
          </span>
        </div>
      ),
    },
    {
      title: 'Dernière mise à jour',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      render: (timestamp: number) => (
        <div className="text-sm text-gray-500">
          {new Date(timestamp * 1000).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: Feature) => (
        <Space size="small">
          <Tooltip title="Modifier">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              className="h-8 w-8 rounded-lg hover:bg-blue-50 hover:text-blue-600"
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Popconfirm
              title={
                <div className="py-2">
                  <div className="font-medium text-gray-900 mb-1">Supprimer cette fonctionnalité ?</div>
                  <div className="text-sm text-gray-500">
                    Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?
                  </div>
                </div>
              }
              onConfirm={() => handleDelete(record.id)}
              okText="Supprimer"
              cancelText="Annuler"
              okButtonProps={{ danger: true }}
              icon={<ExclamationCircleOutlined className="text-red-500" />}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                className="h-8 w-8 rounded-lg hover:bg-red-50"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 text-white overflow-hidden group relative">
    {/* Effet de brillance */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
    
    <div className="flex items-center justify-between relative z-10">
      <div>
        <p className="text-sm text-blue-100">Total des fonctionnalités</p>
        <h3 className="text-3xl font-bold mt-1">{features.length}</h3>
      </div>
      <div className="h-14 w-14 rounded-xl bg-orange-100 p-2 text-orange-600 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30 group-hover:ring-white/50 transition-all">
        <TagOutlined className="text-white text-2xl" />
      </div>
    </div>
    {/* Indicateur de croissance */}
    <div className="mt-4 text-xs text-blue-100 flex items-center">
      <span className="inline-block w-2 h-2 rounded-full bg-white mr-2"></span>
      Toutes les fonctionnalités
    </div>
  </Card>
  
  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 text-white overflow-hidden group relative">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
    
    <div className="flex items-center justify-between relative z-10">
      <div>
        <p className="text-sm text-emerald-100">Fonctionnalités actives</p>
        <h3 className="text-3xl font-bold mt-1">
          {features.filter(f => f.active).length}
        </h3>
      </div>
      <div className="h-14 w-14 rounded-xl bg-green-100 p-2 text-green-600 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30 group-hover:ring-white/50 transition-all">
        <CheckCircleOutlined className="text-white text-2xl" />
      </div>
    </div>
    <div className="mt-4 text-xs text-emerald-100 flex items-center">
      <span className="inline-block w-2 h-2 rounded-full bg-white mr-2 animate-pulse"></span>
      {features.length > 0 ? `${Math.round((features.filter(f => f.active).length / features.length) * 100)}% d'activité` : 'Aucune donnée'}
    </div>
  </Card>
  
  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-purple-400 via-violet-500 to-fuchsia-600 text-white overflow-hidden group relative">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
    
    <div className="flex items-center justify-between relative z-10">
      <div>
        <p className="text-sm text-purple-100">Types différents</p>
        <h3 className="text-3xl font-bold mt-1">
          {[...new Set(features.map(f => f.type))].length}
        </h3>
      </div>
      <div className="h-14 w-14 rounded-full bg-blue-100 p-2 text-blue-600 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30 group-hover:ring-white/50 transition-all">
        <ThunderboltOutlined className="text-white text-2xl" />
      </div>
    </div>
    <div className="mt-4 text-xs text-purple-100 flex items-center">
      <span className="inline-block w-2 h-2 rounded-full bg-white mr-2"></span>
      Diversité des fonctionnalités
    </div>
  </Card>
  
  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-amber-400 via-orange-500 to-pink-600 text-white overflow-hidden group relative">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
    
    <div className="flex items-center justify-between relative z-10">
      <div>
        <p className="text-sm text-amber-100">Catégories</p>
        <h3 className="text-3xl font-bold mt-1">
          {[...new Set(features.map(f => f.category))].length}
        </h3>
      </div>
      <div className="h-14 w-14 rounded-full bg-purple-100 p-2 text-purple-600 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30 group-hover:ring-white/50 transition-all">
        <StarOutlined className="text-white text-2xl" />
      </div>
    </div>
    <div className="mt-4 text-xs text-amber-100 flex items-center">
      <span className="inline-block w-2 h-2 rounded-full bg-white mr-2"></span>
      Organisation par catégories
    </div>
  </Card>
</div>

      {/* Carte principale */}
      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
        {/* Header avec filtres */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60">
              Gestion des Fonctionnalités
            </h2>
            {appData && (
              <p className="text-gray-500 mt-1">
                Modules disponibles pour <span className="font-semibold text-primary">{appData.name}</span>
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-6">
            {/* Barre de recherche */}
            <div className="relative">
              <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher une fonctionnalité..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 rounded-lg border-gray-300 hover:border-primary focus:border-primary"
                allowClear
              />
            </div>
            
            {/* Filtres */}
            <div className="flex gap-4">
              <Select
                value={filterType}
                onChange={setFilterType}
                className="w-40 rounded-lg"
                placeholder="Type"
                suffixIcon={<FilterOutlined />}
              >
                <Option value="all">Tous les types</Option>
                <Option value="payment">Paiement</Option>
                <Option value="auth">Authentification</Option>
                <Option value="security">Sécurité</Option>
                <Option value="integration">Intégration</Option>
                <Option value="notification">Notification</Option>
                <Option value="reporting">Rapports</Option>
              </Select>
              
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                className="w-40 rounded-lg"
                placeholder="Statut"
              >
                <Option value="all">Tous les statuts</Option>
                <Option value="active">Actif</Option>
                <Option value="inactive">Inactif</Option>
              </Select>
              
              <Tooltip title="Trier par nom">
                <Button
                  icon={<SortAscendingOutlined />}
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className={`rounded-lg ${sortOrder === 'asc' ? 'bg-blue-50 text-blue-600' : ''}`}
                >
                  {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-500">
            {filteredAndSortedFeatures.length} fonctionnalité(s) trouvée(s)
          </div>
          <div className="flex gap-4 cursor-pointer p-2">
            <Button
              icon={<ReloadOutlined />}
              onClick={loadFeatures}
              loading={loading}
              className="rounded-lg border-gray-300 hover:border-primary hover:text-primary"
              style={{cursor: 'pointer'}}
            >
              Actualiser
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddForm}
              className="rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg hover:scale-105 transition-all duration-300 group"
              size="large"
              style={{cursor: 'pointer'}}
            >
              <PlusOutlined className="group-hover:rotate-90 transition-transform duration-300 mr-2" />
              Nouvelle Fonctionnalité
            </Button>
          </div>
        </div>

        <Divider className="my-6" />

        {/* Tableau */}
        <Table
          columns={columns}
          dataSource={filteredAndSortedFeatures}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => (
              <span className="text-gray-500 font-medium">
                {total} fonctionnalité(s) • Page {1} sur {Math.ceil(total / 10)}
              </span>
            ),
            className: 'mt-4'
          }}
          locale={{
            emptyText: (
              <div className="py-16 text-center">
                <div className="relative mx-auto w-24 h-24 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full blur-xl" />
                  <div className="relative bg-white rounded-full p-6 border border-gray-200 backdrop-blur-sm">
                    <TagOutlined className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Aucune fonctionnalité trouvée
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                    ? "Aucune fonctionnalité ne correspond à vos critères de recherche."
                    : "Commencez par ajouter votre première fonctionnalité pour enrichir votre application."}
                </p>
                {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openAddForm}
                    className="rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg"
                  >
                    Créer ma première fonctionnalité
                  </Button>
                )}
              </div>
            )
          }}
          className="rounded-lg"
          scroll={{ x: true }}
          rowClassName="hover:bg-gray-50/50 transition-colors"
          onRow={(record) => ({
            onClick: () => handleEdit(record),
            className: 'cursor-pointer'
          })}
        />
      </Card>

      {/* Modal de création/édition */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
              {editingFeature ? (
                <EditOutlined className="text-primary text-lg" />
              ) : (
                <PlusOutlined className="text-primary text-lg" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {editingFeature ? 'Modifier la fonctionnalité' : 'Nouvelle fonctionnalité'}
              </h3>
              <p className="text-sm text-gray-500">
                {editingFeature ? 'Mettez à jour les détails de votre fonctionnalité' : 'Ajoutez une nouvelle fonctionnalité à votre application'}
              </p>
            </div>
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={500}
        className="rounded-2xl"
        bodyStyle={{ padding: '5px' }}
        style={{ top: 5 }}
      >
        <div className="p-2">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              active: true,
              type: 'feature',
              category: 'general'
            }}
            className="space-y-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Form.Item
                name="name"
                label={<span className="font-medium text-gray-700">Nom de la fonctionnalité</span>}
                rules={[{ required: true, message: 'Le nom est requis' }]}
              >
                <Input 
                  size="large" 
                  placeholder="Ex: Paiement en ligne"
                  className="rounded-lg border-gray-300 hover:border-primary focus:border-primary"
                  prefix={<BulbOutlined className="text-gray-400" />}
                />
              </Form.Item>

              <Form.Item
                name="key"
                label={<span className="font-medium text-gray-700">Clé technique</span>}
                tooltip="Identifiant unique utilisé dans le code"
              >
                <Input 
                  size="large" 
                  placeholder="Ex: payment_online"
                  className="rounded-lg border-gray-300 hover:border-primary focus:border-primary"
                  prefix={<CodeOutlined className="text-gray-400" />}
                />
              </Form.Item>
            </div>

            <Form.Item
              name="description"
              label={<span className="font-medium text-gray-700">Description</span>}
              rules={[{ required: true, message: 'La description est requise' }]}
            >
              <TextArea 
                rows={3} 
                placeholder="Décrivez le fonctionnement et l'utilité de cette fonctionnalité..."
                className="rounded-lg border-gray-300 hover:border-primary focus:border-primary"
              />
            </Form.Item>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="type"
                label={<span className="font-medium text-gray-700">Type</span>}
                rules={[{ required: true, message: 'Le type est requis' }]}
              >
                <Select 
                  size="large" 
                  placeholder="Sélectionnez un type"
                  className="rounded-lg"
                >
                  <Option value="payment">
                    <div className="flex items-center gap-2">
                      <DollarCircleOutlined className="text-emerald-500" />
                      <span>Paiement</span>
                    </div>
                  </Option>
                  <Option value="auth">
                    <div className="flex items-center gap-2">
                      <LockOutlined className="text-blue-500" />
                      <span>Authentification</span>
                    </div>
                  </Option>
                  <Option value="security">
                    <div className="flex items-center gap-2">
                      <SafetyOutlined className="text-red-500" />
                      <span>Sécurité</span>
                    </div>
                  </Option>
                  <Option value="integration">
                    <div className="flex items-center gap-2">
                      <ApiOutlined className="text-purple-500" />
                      <span>Intégration</span>
                    </div>
                  </Option>
                  <Option value="notification">
                    <div className="flex items-center gap-2">
                      <BellOutlined className="text-amber-500" />
                      <span>Notification</span>
                    </div>
                  </Option>
                  <Option value="reporting">
                    <div className="flex items-center gap-2">
                      <BarChartOutlined className="text-cyan-500" />
                      <span>Rapports</span>
                    </div>
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="category"
                label={<span className="font-medium text-gray-700">Catégorie</span>}
                rules={[{ required: true, message: 'La catégorie est requise' }]}
              >
                <Select 
                  size="large" 
                  placeholder="Sélectionnez une catégorie"
                  className="rounded-lg"
                >
                  <Option value="general">Général</Option>
                  <Option value="finance">Finance</Option>
                  <Option value="security">Sécurité</Option>
                  <Option value="ui">Interface utilisateur</Option>
                  <Option value="data">Données</Option>
                  <Option value="admin">Administration</Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              name="active"
              label={<span className="font-medium text-gray-700">Statut</span>}
              valuePropName="checked"
            >
              <div className="flex items-center gap-2">
                <Switch
                  checkedChildren={<CheckCircleOutlined />}
                  unCheckedChildren={<CloseCircleOutlined />}
                  defaultChecked
                  className={form.getFieldValue('active') ? 'bg-emerald-600' : ''}
                />
                <span className="text-gray-600">
                  {form.getFieldValue('active') ? 'Activée' : 'Désactivée'}
                </span>
              </div>
            </Form.Item>

            <Divider />

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                size="large"
                onClick={handleCancel}
                className="px-6 rounded-lg border-gray-300 hover:border-gray-400"
              >
                Annuler
              </Button>
              <Button 
                type="primary" 
                size="large"
                htmlType="submit"
                loading={isSaving}
                className="px-6 rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg transition-all duration-300"
                icon={editingFeature ? <SaveOutlined /> : <PlusOutlined />}
              >
                {editingFeature ? 'Mettre à jour' : 'Créer la fonctionnalité'}
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

// Composants d'icônes additionnels
const DollarCircleOutlined = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
    <path d="M12 18V6" />
  </svg>
);

const BellOutlined = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const BarChartOutlined = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const CodeOutlined = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const ExclamationCircleOutlined = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);