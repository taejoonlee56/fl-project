import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { BaseButtonsForm } from '@app/components/common/forms/BaseButtonsForm/BaseButtonsForm';
import { InputNumber } from '@app/components/common/inputs/InputNumber/InputNumber';
import { Select, Option } from '@app/components/common/selects/Select/Select';
import { Button } from '@app/components/common/buttons/Button/Button';
import { RadioButton, RadioGroup } from '@app/components/common/Radio/Radio';
import { notificationController } from '@app/controllers/notificationController';
import { Card } from '@app/components/common/Card/Card';
import * as U from '@app/pages/uiComponentsPages//UIComponentsPage.styles';

const formItemLayout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

export const AbnormalDetectionForm: React.FC = () => {
  
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

  // const [response, setResponse] = useState("");

  // useEffect(() => {
  //   const socket = socketIOClient(ENDPOINT);
  //   socket.on("FromAPI", data => {
  //     setResponse(data);
  //   });
  // }, []);
  

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
        name="cpu-usage"
        // label={t('forms.validationFormLabels.radioButton')}
        label={t('Select an upper limit for CPU utilization.')}
        rules={[{ required: true, message: t('Choose CPU') }]}
      >
        <RadioGroup>
          <RadioButton value="50">{t('50%')}</RadioButton>
          <RadioButton value="60">{t('60%')}</RadioButton>
          <RadioButton value="70">{t('70%')}</RadioButton>
          <RadioButton value="80">{t('80%')}</RadioButton>
          <RadioButton value="90">{t('90%')}</RadioButton>
        </RadioGroup>
      </BaseButtonsForm.Item>

      <BaseButtonsForm.Item
        name="mem-usage"
        // label={t('forms.validationFormLabels.radioButton')}
        label={t('Select an upper limit for Memory utilization.')}
        rules={[{ required: true, message: t('Choose Memory') }]}
      >
        <RadioGroup>
          <RadioButton value="50">{t('50%')}</RadioButton>
          <RadioButton value="60">{t('60%')}</RadioButton>
          <RadioButton value="70">{t('70%')}</RadioButton>
          <RadioButton value="80">{t('80%')}</RadioButton>
          <RadioButton value="90">{t('90%')}</RadioButton>
        </RadioGroup>
      </BaseButtonsForm.Item>

      <BaseButtonsForm.Item
        name="net-usage"
        // label={t('forms.validationFormLabels.radioButton')}
        label={t('Select an upper limit for Network utilization')}
        rules={[{ required: true, message: t('Choose net Function') }]}
        >
        <RadioGroup>
          <RadioButton value="50">{t('50%')}</RadioButton>
          <RadioButton value="60">{t('60%')}</RadioButton>
          <RadioButton value="70">{t('70%')}</RadioButton>
          <RadioButton value="80">{t('80%')}</RadioButton>
          <RadioButton value="90">{t('90%')}</RadioButton>
        </RadioGroup>
      </BaseButtonsForm.Item>

      
      <BaseButtonsForm.Item
        name="acc-outlier"
        // label={t('forms.validationFormLabels.radioButton')}
        label={t('Select an upper limit for Accuracy deviation percentage')}
        rules={[{ required: true, message: t('Choose acc Function') }]}
        >
        <RadioGroup>
          <RadioButton value="50">{t(' 1%')}</RadioButton>
          <RadioButton value="60">{t(' 3%')}</RadioButton>
          <RadioButton value="70">{t(' 5%')}</RadioButton>
          <RadioButton value="80">{t(' 7%')}</RadioButton>
          <RadioButton value="90">{t(' 10%')}</RadioButton>
        </RadioGroup>
      </BaseButtonsForm.Item>

      
      
      <BaseButtonsForm.Item
        name="train-time"
        // label={t('forms.validationFormLabels.radioButton')}
        label={t('Select a Training Time deviation percentage upper limit')}
        rules={[{ required: true, message: t('Choose time Function') }]}
        >
        <RadioGroup>
          <RadioButton value="50">{t(' 1%')}</RadioButton>
          <RadioButton value="60">{t(' 3%')}</RadioButton>
          <RadioButton value="70">{t(' 5%')}</RadioButton>
          <RadioButton value="80">{t(' 7%')}</RadioButton>
          <RadioButton value="90">{t(' 10%')}</RadioButton>
        </RadioGroup>
      </BaseButtonsForm.Item>

      <BaseButtonsForm.Item
        name="battery-under"
        // label={t('forms.validationFormLabels.radioButton')}
        label={t('Select a lower bound for Battery percentage')}
        rules={[{ required: true, message: t('Choose battery Function') }]}
        >
        <RadioGroup>
          <RadioButton value="50">{t('20%')}</RadioButton>
          <RadioButton value="60">{t('25%')}</RadioButton>
          <RadioButton value="70">{t('30%')}</RadioButton>
          <RadioButton value="80">{t('35%')}</RadioButton>
          <RadioButton value="90">{t('40%')}</RadioButton>
        </RadioGroup>
      </BaseButtonsForm.Item>

    </BaseButtonsForm>

    
  );
};
