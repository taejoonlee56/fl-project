import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { BaseButtonsForm } from '@app/components/common/forms/BaseButtonsForm/BaseButtonsForm';
import { Button } from '@app/components/common/buttons/Button/Button';
import { RadioButton, RadioGroup } from '@app/components/common/Radio/Radio';
import { notificationController } from '@app/controllers/notificationController';
import { InputNumber } from '@app/components/common/inputs/InputNumber/InputNumber';
import { Select, Option } from '@app/components/common/selects/Select/Select';

const formItemLayout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }, 
};

export const DataControlForm: React.FC = () => {
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
        name="purpose-button"
        // label={t('forms.validationFormLabels.radioButton')}
        label={t('Purpose')}
        rules={[{ required: true, message: t('Choose Purpose') }]}
      >
        
        <Select placeholder={t('Select a Data Purpose')}>
          <Option value="lane">{t('Lane Detection')}</Option>
          <Option value="object">{t('Object Detection')}</Option>
        </Select>
      </BaseButtonsForm.Item>

      <BaseButtonsForm.Item label={t('Number of data to collect')}>
        <label>
          <BaseButtonsForm.Item name="amount-data" rules={[{ required: true, message: t('Enter the number of data to collect') }]} noStyle>
            <InputNumber min={100} max={10000} />
          </BaseButtonsForm.Item>
        </label>
        <span> {t('Min 100, Max 10,000')}</span>
      </BaseButtonsForm.Item>

      <BaseButtonsForm.Item label={t('Enter the number of vehicles for data collection')}>
        <label>
          <BaseButtonsForm.Item name="amount-vehicle" rules={[{ required: true, message: t('Type Amount of Data') }]} noStyle>
            <InputNumber min={1} max={10} />
          </BaseButtonsForm.Item>
        </label>
        <span> {t('Min 1, Max 10')}</span>
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
