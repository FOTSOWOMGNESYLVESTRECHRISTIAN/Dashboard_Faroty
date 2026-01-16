import React, { useState, useEffect } from 'react';
import { Switch, Input, Button, message, Spin, Form, Card, Alert } from 'antd';
import { SaveOutlined, SafetyCertificateOutlined, HistoryOutlined } from '@ant-design/icons';
import { applicationService, TrialPolicyPayload } from '../services/applicationService';

interface ApplicationDetailParametersProps {
  applicationId: string;
}

export const ApplicationDetailParameters: React.FC<ApplicationDetailParametersProps> = ({
  applicationId
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trialPolicy, setTrialPolicy] = useState<{
    id?: string;
    enabled: boolean;
    durationInDays: number;
    unlimitedAccess: boolean;
  }>({
    enabled: false,
    durationInDays: 14,
    unlimitedAccess: false
  });

  const [form] = Form.useForm();

  useEffect(() => {
    const fetchTrialPolicy = async () => {
      try {
        setLoading(true);
        const policy = await applicationService.getTrialPolicyByApplication(applicationId);
        if (policy) {
          setTrialPolicy({
            id: policy.id,
            enabled: policy.enabled,
            durationInDays: policy.trialPeriodInDays,
            unlimitedAccess: policy.unlimitedAccess
          });
          form.setFieldsValue({
            enabled: policy.enabled,
            durationInDays: policy.trialPeriodInDays,
            unlimitedAccess: policy.unlimitedAccess
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la politique d\'essai:', error);
        // Ne pas afficher d'erreur critique si pas de politique trouvée, juste garder les défauts
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchTrialPolicy();
    }
  }, [applicationId, form]);

  const handleSave = async (values: any) => {
    try {
      setSaving(true);

      const payload: TrialPolicyPayload = {
        applicationId,
        enabled: values.enabled,
        trialPeriodInDays: parseInt(values.durationInDays) || 0,
        unlimitedAccess: values.unlimitedAccess || false
      };

      await applicationService.createOrUpdateTrialPolicy(payload, trialPolicy.id);

      message.success('Paramètres de la période d\'essai mis à jour avec succès');

      // Recharger pour s'assurer qu'on a les dernières données (notamment ID si création)
      const updated = await applicationService.getTrialPolicyByApplication(applicationId);
      if (updated) {
        setTrialPolicy({
          id: updated.id,
          enabled: updated.enabled,
          durationInDays: updated.trialPeriodInDays,
          unlimitedAccess: updated.unlimitedAccess
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la politique d\'essai:', error);
      message.error('Erreur lors de la mise à jour des paramètres');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-6">
        <p className="text-muted-foreground mt-1">
          Configurez les périodes d'essai gratuit et autres paramètres globaux.
        </p>
      </div>

      <Card
        className="shadow-lg border-0 rounded-xl overflow-hidden"
        title={
          <div className="flex items-center gap-2 text-lg text-gray-800">
            <HistoryOutlined className="text-blue-500" />
            <span>Politique d'essai gratuit</span>
          </div>
        }
      >
        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
          <SafetyCertificateOutlined className="text-blue-500 text-xl mt-1" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Configuration de l'essai gratuit</p>
            <p>Définissez une période pendant laquelle les utilisateurs peuvent tester votre application gratuitement. Une fois la période terminée, ils devront souscrire à un abonnement.</p>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            enabled: trialPolicy.enabled,
            durationInDays: trialPolicy.durationInDays,
            unlimitedAccess: trialPolicy.unlimitedAccess
          }}
          className="max-w-2xl"
        >
          <Form.Item
            name="enabled"
            label={<span className="font-semibold text-gray-700">Activer la période d'essai</span>}
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Activée"
              unCheckedChildren="Désactivée"
              className="bg-gray-300"
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.enabled !== currentValues.enabled}
          >
            {({ getFieldValue }) =>
              getFieldValue('enabled') ? (
                <div className="pl-4 border-l-2 border-blue-100 ml-2 animate-slide-down">
                  <Form.Item
                    name="durationInDays"
                    label="Durée (en jours)"
                    rules={[{ required: true, message: 'La durée est requise' }]}
                    tooltip="Nombre de jours avant expiration de l'essai"
                  >
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      suffix={<span className="text-gray-400">jours</span>}
                      className="w-48 font-medium"
                    />
                  </Form.Item>

                  <Form.Item
                    name="unlimitedAccess"
                    valuePropName="checked"
                    label="Accès illimité durant l'essai"
                    className="mb-0"
                    tooltip="Si coché, aucune restriction de fonctionnalité ne sera appliquée"
                  >
                    <Switch checkedChildren="Oui" unCheckedChildren="Non" />
                  </Form.Item>
                </div>
              ) : null
            }
          </Form.Item>

          <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              icon={<SaveOutlined />}
              size="large"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-md hover:shadow-lg"
            >
              Enregistrer les paramètres
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};


export default ApplicationDetailParameters;
