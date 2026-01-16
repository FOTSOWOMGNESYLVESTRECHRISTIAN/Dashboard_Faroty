import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Badge,
  Dropdown,
  Modal,
  Form,
  Input,
  message,
  Select,
  Switch,
  Upload
} from 'antd';
import {
  EditOutlined,
  MoreOutlined,
  PauseOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  BarChartOutlined,
  CreditCardOutlined,
  TagOutlined,
  PercentageOutlined,
  WalletOutlined,
  UserOutlined,
  CalendarOutlined,
  SettingOutlined,
  RocketOutlined,
  GlobalOutlined,
  MailOutlined,
  LinkOutlined,
  ReadOutlined,
  AlertOutlined,
  UploadOutlined,
  AppstoreOutlined,
  CodeOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { 
  CheckCircle, 
  PauseCircle, 
  Users, 
  DollarSign, 
  Activity, 
  TrendingUp,
  Save,
  X
} from 'lucide-react';

interface AppData {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  logo?: string;
  description: string;
  category: string;
  version: string;
  lastUpdate: string;
  features: any[];
  plans: any[];
  abonnements?: number;
  promotions?: any[];
  owner?: string;
  apiKey?: string;
  webhookUrl?: string;
  type: string;
  platform: string;
  iconUrl?: string;
  websiteUrl?: string;
  supportEmail?: string;
  documentationUrl?: string;
  isActive?: boolean;
  stats?: {
    totalUsers?: number;
    activeUsers?: number;
    monthlyRevenue?: number;
    totalTransactions?: number;
    successRate?: number;
    avgSession?: string;
  };
  avgSession?: string;
}

interface AppStats {
  totalUsers?: number;
  activeUsers?: number;
  monthlyRevenue?: number;
  totalTransactions?: number;
  successRate?: number;
  avgSession?: string;
  [key: string]: any;
}

interface ApplicationDetailsViewProps {
  appData: AppData | null;
  onPlansUpdate?: (plans: any[]) => void;
  onStatusChange?: (status: 'active' | 'inactive') => void;
  onAppUpdate?: (app: AppData) => void;
}

interface StatCard {
  key: string;
  label: string;
  value: number;
  total?: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  trend?: string;
  description: string;
  prefix?: string;
  suffix?: string;
}

interface TabItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface ApplicationPayload {
  name: string;
  description: string;
  version: string;
  type: string;
  platform: string;
  iconUrl: string;
  websiteUrl: string;
  supportEmail: string;
  documentationUrl: string;
  status: 'active' | 'inactive' | 'maintenance';
  isActive: boolean;
}

const statusColors = {
  active: {
    bg: 'rgba(16, 185, 129, 0.1)',
    text: 'text-emerald-600',
    border: 'border-emerald-300/40',
    icon: 'bg-emerald-500',
    accent: 'rgb(16, 185, 129)'
  },
  inactive: {
    bg: 'rgba(156, 163, 175, 0.1)',
    text: 'text-gray-600',
    border: 'border-gray-300/40',
    icon: 'bg-gray-500',
    accent: 'rgb(156, 163, 175)'
  },
  maintenance: {
    bg: 'rgba(245, 158, 11, 0.1)',
    text: 'text-amber-600',
    border: 'border-amber-300/40',
    icon: 'bg-amber-500',
    accent: 'rgb(245, 158, 11)'
  }
};

// Service d'application simulé (remplacez par votre vrai service)
const applicationService = {
  updateApplication: async (id: string, data: any) => {
    // Simulation d'un appel API
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true, data: { ...data, id } });
      }, 1000);
    });
  }
};

const ApplicationDetailsView: React.FC<ApplicationDetailsViewProps> = ({
  appData: initialAppData,
  onPlansUpdate,
  onStatusChange,
  onAppUpdate,
}) => {
  const [appData, setAppData] = useState<AppData | null>(initialAppData);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [form] = Form.useForm();
  const [editedAppData, setEditedAppData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<AppStats>({});
  const [status, setStatus] = useState<'active' | 'inactive' | 'maintenance' | null>(initialAppData?.status || null);

  // Stats cards data
  const statsCards: StatCard[] = [
    {
      key: 'users',
      label: 'Utilisateurs actifs',
      value: initialAppData?.stats?.activeUsers || 0,
      total: initialAppData?.stats?.totalUsers || 0,
      icon: <Users className="h-5 w-5" />,
      color: 'from-blue-500 via-blue-400 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800/50',
      trend: '+12%',
      description: 'Utilisateurs actifs ce mois'
    },
    {
      key: 'revenue',
      label: 'Revenu mensuel',
      value: initialAppData?.stats?.monthlyRevenue || 0,
      prefix: 'XOF ',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'from-emerald-500 via-emerald-400 to-green-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800/50',
      trend: '+18%',
      description: 'Croissance ce mois'
    },
    {
      key: 'transactions',
      label: 'Transactions',
      value: initialAppData?.stats?.totalTransactions || 0,
      icon: <Activity className="h-5 w-5" />,
      color: 'from-purple-500 via-purple-400 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800/50',
      trend: '+24%',
      description: 'Total des transactions'
    },
    {
      key: 'success',
      label: 'Taux de réussite',
      value: initialAppData?.stats?.successRate || 0,
      suffix: '%',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'from-amber-500 via-amber-400 to-yellow-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800/50',
      trend: '+3%',
      description: 'Performance globale'
    }
  ];

  // Mise à jour de l'état local lorsque les props changent
  useEffect(() => {
    setAppData(initialAppData);
  }, [initialAppData]);

  const handleActivate = () => {
    if (!appData) return;
    const updated = { ...appData, status: 'active' as const };
    setAppData(updated);
    if (onStatusChange) onStatusChange('active');
    message.success('Application activée');
  };

  const handleSuspend = () => {
    if (!appData) return;
    const updated = { ...appData, status: 'inactive' as const };
    setAppData(updated);
    if (onStatusChange) onStatusChange('inactive');
    message.warning('Application suspendue');
  };

  if (!appData) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary border-r-primary/50"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <RocketOutlined className="text-2xl text-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2 mt-4">
          <h3 className="text-xl font-semibold">Chargement de l'application</h3>
          <p className="text-sm text-muted-foreground">
            Préparation des données...
          </p>
        </div>
      </div>
    );
  }

  const safeAppData = {
    ...appData,
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      monthlyRevenue: 0,
      totalTransactions: 0,
      successRate: 0,
      avgSession: '0m',
      ...appData.stats
    },
    plans: appData.plans || [],
    features: appData.features || []
  };

  const renderEditForm = () => {
    if (!appData) return null;
    
    return (
      <div className="rounded-lg shadow-lg w-full max-w-3xl mx-auto">
        {/* En-tête du formulaire */}
        <div className="flex items-center justify-between p-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <EditOutlined className="text-blue-600 text-lg" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Modifier l'application</h2>
          </div>
          <Button
            type="text"
            icon={<X className="h-5 w-5" />}
            onClick={() => setIsEditing(false)}
            className="text-gray-400 hover:text-gray-600"
          />
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: appData.name,
            description: appData.description,
            version: appData.version,
            type: appData.type,
            platform: appData.platform,
            websiteUrl: appData.websiteUrl,
            supportEmail: appData.supportEmail,
            documentationUrl: appData.documentationUrl,
            status: appData.status,
            isActive: appData.isActive ?? true
          }}
          className="p-2 space-2"
        >
          {/* Section Informations de base */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Form.Item
                name="name"
                label="Nom"
                className="mb-0"
                rules={[{ required: true, message: 'Le nom est requis' }]}
              >
                <Input 
                  size="large" 
                  placeholder="Crowdfunding"
                  className="rounded-md border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </Form.Item>
              
              <Form.Item
                name="version"
                label="Version"
                className="mb-0"
                rules={[{ required: true, message: 'La version est requise' }]}
              >
                <Input 
                  size="large" 
                  placeholder="1.0.0"
                  className="rounded-md border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </Form.Item>
              
              <Form.Item
                name="type"
                label="Type"
                className="mb-0"
                rules={[{ required: true, message: 'Le type est requis' }]}
              >
                <Input 
                  size="large" 
                  placeholder="web"
                  className="rounded-md border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </Form.Item>
              
              <Form.Item
                name="platform"
                label="Plateforme"
                className="mb-0"
                rules={[{ required: true, message: 'La plateforme est requise' }]}
              >
                <Input 
                  size="large" 
                  placeholder="web"
                  className="rounded-md border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </Form.Item>

              
            </div>
          </div>

          <div className="mb-2 mt-2 w-full h-full">
                <Form.Item
                  name="description"
                  label="Description"
                  className="mb-0"
                  rules={[{ required: true, message: 'La description est requise' }]}
                >
                  <Input.TextArea 
                    rows={3}
                    placeholder="Application de levée de fonds"
                    className="rounded-xl border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </Form.Item>
              </div>

          {/* Section Liens et contact */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Form.Item
                name="iconUrl"
                label="Icon URL"
                className="mb-0"
                rules={[{ type: 'url', message: 'URL invalide' }]}
              >
                <Input 
                  size="large" 
                  placeholder="https://example.com/icon.png"
                  className="rounded-md border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </Form.Item>
              
              <Form.Item
                name="websiteUrl"
                label="Site web"
                className="mb-0"
                rules={[{ type: 'url', message: 'URL invalide' }]}
              >
                <Input 
                  size="large" 
                  placeholder="https://example.com"
                  className="rounded-md border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </Form.Item>
              
              <Form.Item
                name="supportEmail"
                label="Email support"
                className="mb-0"
                rules={[{ type: 'email', message: 'Email invalide' }]}
              >
                <Input 
                  size="large" 
                  placeholder="support@example.com"
                  className="rounded-md border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </Form.Item>
              
              <Form.Item
                name="documentationUrl"
                label="Documentation"
                className="mb-0"
                rules={[{ type: 'url', message: 'URL invalide' }]}
              >
                <Input 
                  size="large" 
                  placeholder="https://example.com/docs"
                  className="rounded-md border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </Form.Item>
            </div>
          </div>

          {/* Bouton de soumission */}
          <div className="flex justify-end pt-2 border-t border-gray-200">
            <Button 
              type="primary" 
              size="large"
              htmlType="submit"
              className="bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Enregistrer les modifications
            </Button>
          </div>
        </Form>
      </div>
    );
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaveLoading(true);

      if (!appData) return;

      const updateData = {
        name: values.name,
        description: values.description,
        version: values.version,
        type: values.type,
        platform: values.platform,
        websiteUrl: values.websiteUrl,
        supportEmail: values.supportEmail,
        documentationUrl: values.documentationUrl,
        status: values.status,
        isActive: values.isActive
      };

      // Appel au service pour mettre à jour l'application
      const updatedApp = await applicationService.updateApplication(appData.id, updateData);
      
      const updatedAppData: AppData = {
        ...appData,
        ...updateData,
        lastUpdate: new Date().toISOString()
      };

      setAppData(updatedAppData);
      
      if (typeof onAppUpdate === 'function') {
        onAppUpdate(updatedAppData);
      }

      message.success({
        content: 'Application mise à jour avec succès',
        icon: <CheckCircleOutlined className="text-emerald-500" />,
        className: 'custom-success-message'
      });
      
      setIsEditing(false);

    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      message.error({
        content: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
        icon: <AlertOutlined className="text-red-500" />
      });
    } finally {
      setSaveLoading(false);
    }
  };

  // Définition des onglets
  const tabs: TabItem[] = [];

  return (
    <div className="space-y-2">
      {/* Modal d'édition */}
      <Modal
        title={null}
        open={isEditing}
        onCancel={() => setIsEditing(false)}
        footer={null}
        width={800}
        centered
        className="rounded-2xl"
        styles={{
          body: { padding: 0 },
          content: { 
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        {renderEditForm()}
      </Modal>

      {/* En-tête de l'application */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden p-4">
              {appData?.logo ? (
                <img src={appData.logo} alt={appData.name} className="h-full w-full object-cover bg-purple-600" />
              ) : (
                <RocketOutlined className="text-2xl text-gray-400" />
              )}
            </div>
            {appData?.status && (
              <div className={`absolute -bottom-1 -right-1 h-9 w-9 rounded-full ${statusColors[appData.status]?.icon || 'bg-gray-500'} border-2 border-white dark:border-gray-800 shadow-md flex items-center justify-center bg-purple-600`}>
                {appData.status === 'active' ? (
                  <CheckCircle className="h-3 w-3 text-white" />
                ) : appData.status === 'maintenance' ? (
                  <AlertOutlined className="text-white text-xs" />
                ) : (
                  <PauseCircle className="h-3 w-3 text-white" />
                )}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {appData?.name || 'Chargement...'}
              </h1>
              {appData?.status && (
                <Tag
                  color={
                    appData.status === 'active' ? 'green' :
                    appData.status === 'maintenance' ? 'orange' : 'red'
                  }
                  className="rounded-full px-2 sm:px-3 py-0.5 text-xs font-medium flex-shrink-0"
                >
                  {appData.status === 'active' ? 'Actif' :
                   appData.status === 'maintenance' ? 'Maintenance' : 'Inactif'}
                </Tag>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
              {appData?.description || 'Aucune description disponible'}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {appData?.type && (
                <Tag color="blue" className="text-xs">
                  {appData.type}
                </Tag>
              )}
              {appData?.platform && (
                <Tag color="geekblue" className="text-xs">
                  {appData.platform}
                </Tag>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5"
            >
              <span className="hidden sm:inline">Modifier</span>
            </Button>
            
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'suspend',
                    label: 'Suspendre',
                    icon: <PauseOutlined />,
                    disabled: appData?.status === 'inactive',
                    onClick: () => handleSuspend()
                  },
                  {
                    key: 'activate',
                    label: 'Activer',
                    icon: <CheckCircleOutlined />,
                    disabled: appData?.status === 'active',
                    onClick: () => handleActivate()
                  },
                  {
                    type: 'divider',
                  },
                  {
                    key: 'delete',
                    label: 'Supprimer',
                    icon: <DeleteOutlined className="text-red-500" />,
                    danger: true,
                    onClick: () => {}
                  }
                ]
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button icon={<MoreOutlined />} className="flex-shrink-0" />
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div 
            key={stat.key}
            className={`bg-white dark:bg-gray-800 rounded-xl border ${stat.borderColor} p-4 flex items-center gap-4`}
          >
            <div className={`h-12 w-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
              {stat.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stat.prefix}{stat.value}{stat.suffix}
                </span>
                {stat.trend && (
                  <span className="text-xs text-emerald-500 ml-1">
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {stat.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation par onglets */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="border-b border-gray-100 dark:border-gray-700">
          <div className="flex overflow-x-auto no-scrollbar">
            <div className="flex px-2 sm:px-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex flex-col sm:flex-row items-center justify-center gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap
                    transition-all duration-200 relative group
                    ${activeTab === tab.key 
                      ? 'text-primary' 
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
                  `}
                >
                  <div className="relative">
                    <span className={`transition-transform duration-200 ${activeTab === tab.key ? 'scale-110' : 'group-hover:scale-105'}`}>
                      {tab.icon}
                    </span>
                    {tab.count && tab.count > 0 && (
                      <Badge 
                        count={tab.count}
                        size="small"
                        className="absolute -top-2 -right-3 scale-75 sm:scale-90"
                        style={{ 
                          backgroundColor: activeTab === tab.key ? 'var(--ant-primary-color)' : 'rgba(0, 0, 0, 0.2)',
                          color: activeTab === tab.key ? '#fff' : 'inherit'
                        }}
                      />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm">{tab.label}</span>
                  <div className={`
                    absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-all duration-200
                    ${activeTab === tab.key ? 'opacity-100' : 'opacity-0 scale-x-0'}
                  `}></div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="p-4 sm:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Carte de statut */}
                <div className={`
                  rounded-xl p-4 border-2 transition-all duration-200
                  ${appData?.status === 'active' 
                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50' 
                    : appData?.status === 'maintenance'
                    ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-700/20 dark:border-gray-600/50'
                  }
                `}>
                  <div className="flex items-start gap-3">
                    <div className={`
                      h-10 w-10 rounded-lg flex-shrink-0 flex items-center justify-center
                      ${appData?.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' 
                        : appData?.status === 'maintenance'
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700/50'
                      }
                    `}>
                      {appData?.status === 'active' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : appData?.status === 'maintenance' ? (
                        <AlertOutlined className="text-lg" />
                      ) : (
                        <PauseCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Statut de l'application
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {appData?.status === 'active' 
                          ? 'L\'application fonctionne normalement' 
                          : appData?.status === 'maintenance'
                          ? 'Maintenance en cours - Accès limité'
                          : 'Application suspendue'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dernière mise à jour */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                      <ClockCircleOutlined />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Dernière mise à jour
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {appData?.lastUpdate ? new Date(appData.lastUpdate).toLocaleString() : 'Inconnue'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Autres informations */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                  Informations générales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {appData?.type || 'Non spécifié'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Plateforme</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {appData?.platform || 'Non spécifiée'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Version</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {appData?.version || '1.0.0'}
                    </p>
                  </div>
                  {appData?.websiteUrl && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Site web</p>
                      <a 
                        href={appData.websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        {appData.websiteUrl}
                        <LinkOutlined className="text-xs" />
                      </a>
                    </div>
                  )}
                  {appData?.supportEmail && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email de support</p>
                      <a 
                        href={`mailto:${appData.supportEmail}`}
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        {appData.supportEmail}
                        <MailOutlined className="text-xs" />
                      </a>
                    </div>
                  )}
                  {appData?.documentationUrl && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Documentation</p>
                      <a 
                        href={appData.documentationUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        Accéder à la documentation
                        <ReadOutlined className="text-xs" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'plans' && appData && (
            <div className="p-8 text-center text-gray-500">
              Composant "Forfaits" - À implémenter
            </div>
          )}
          
          {activeTab === 'features' && appData && (
            <div className="p-8 text-center text-gray-500">
              Composant "Fonctionnalités" - À implémenter
            </div>
          )}
          
          {activeTab === 'promotions' && appData && (
            <div className="p-8 text-center text-gray-500">
              Composant "Promotions" - À implémenter
            </div>
          )}
          
          {activeTab === 'wallets' && appData && (
            <div className="p-8 text-center text-gray-500">
              Composant "Portefeuilles" - À implémenter
            </div>
          )}
          
          {activeTab === 'accounts' && appData && (
            <div className="p-8 text-center text-gray-500">
              Composant "Comptes" - À implémenter
            </div>
          )}
          
          {activeTab === 'subscriptions' && appData && (
            <div className="p-8 text-center text-gray-500">
              Composant "Abonnements" - À implémenter
            </div>
          )}
          
          {activeTab === 'settings' && appData && (
            <div className="p-8 text-center text-gray-500">
              Composant "Paramètres" - À implémenter
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Composants d'icônes additionnels
const ClockCircleOutlined = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const KeyOutlined = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const ExportOutlined = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ApiOutlined = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 10l-2 1" />
    <path d="M10 10l2 1" />
    <path d="M22 8v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
    <path d="M6 18h.01" />
    <path d="M10 18h.01" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);

export default ApplicationDetailsView;