import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { BaseButtonsForm } from '@app/components/common/forms/BaseButtonsForm/BaseButtonsForm';
import { Button } from '@app/components/common/buttons/Button/Button';
import { RadioButton, RadioGroup } from '@app/components/common/Radio/Radio';
import { notificationController } from '@app/controllers/notificationController';

const formItemLayout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }, 
};

export const MapControlForm: React.FC = () => {
  const [isFieldsChanged, setFieldsChanged] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const { t } = useTranslation();
  
  const onFinish = async (values = {}) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setFieldsChanged(false);
      notificationController.success({ message: t('common.success') });
      console.log(values);
    }, 1000);
  };

  return (
    <BaseButtonsForm
      {...formItemLayout}
      isFieldsChanged={isFieldsChanged}
      onFieldsChange={() => setFieldsChanged(true)}
      name="validateForm"
      initialValues={{
        'input-number': 10,
        'checkbox-group': ['A', 'B'],
        rate: 3.5,
      }}
      footer={
        <BaseButtonsForm.Item>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            {t('common.submit')}
          </Button>
        </BaseButtonsForm.Item>
      }
      onFinish={onFinish}
    >
      <BaseButtonsForm.Item
        name="map-button"
        // label={t('forms.validationFormLabels.radioButton')}
        label={t('Map')}
        rules={[{ required: true, message: t('Choose Map') }]}
      >
        <RadioGroup>
          <RadioButton value="Town10HD">{t('Big City')}</RadioButton>
          <RadioButton value="Town05">{t('Small City')}</RadioButton>
          <RadioButton value="Town01">{t('Big Town')}</RadioButton>
          <RadioButton value="Town07">{t('Small Town')}</RadioButton>
        </RadioGroup>
      </BaseButtonsForm.Item>

      <BaseButtonsForm.Item
        name="time-button"
        // label={t('forms.validationFormLabels.radioButton')}
        label={t('Day/Night')}
        rules={[{ required: true, message: t('Choose Day or Night') }]}
      >
        <RadioGroup>
          <RadioButton value="Sunset">{t('Day')}</RadioButton>
          <RadioButton value="Night">{t('Night')}</RadioButton>
        </RadioGroup>
      </BaseButtonsForm.Item>

      <BaseButtonsForm.Item
        name="weather-button"
        // label={t('forms.validationFormLabels.radioButton')}
        label={t('Weather')}
        rules={[{ required: true, message: t('Choose Weather') }]}
      >
        <RadioGroup>
          <RadioButton value="ClearSunset">{t('Sunny')}</RadioButton>
          <RadioButton value="CloudySunset">{t('Cloudy')}</RadioButton>
          <RadioButton value="HardRainSunset">{t('Rainy')}</RadioButton>
          <RadioButton value="WetSunset">{t('Snowy')}</RadioButton>
        </RadioGroup>
      </BaseButtonsForm.Item>
    </BaseButtonsForm>

  );
};
