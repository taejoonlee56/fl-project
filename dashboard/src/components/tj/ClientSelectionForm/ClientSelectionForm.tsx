import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { BaseButtonsForm } from '@app/components/common/forms/BaseButtonsForm/BaseButtonsForm';
import { InputNumber } from '@app/components/common/inputs/InputNumber/InputNumber';
import { Select, Option } from '@app/components/common/selects/Select/Select';
import { Button } from '@app/components/common/buttons/Button/Button';
import { notificationController } from '@app/controllers/notificationController';

import { Card, Col, Row } from 'antd';

const formItemLayout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
};

export const ClientSelectionForm: React.FC = () => {

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
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
        name="select"
        label={t('Client Section Method')}
        hasFeedback
        rules={[{ required: true, message: t('You must choose client selection method!') }]}
      >
        <Select placeholder={t('Select client selection method')} onChange={ (value)=> setSelectedMethod(value as string)}>  
          <Option value="random">{t('Random')}</Option>
          <Option value="oort">{t('Oort')}</Option>
          <Option value="eafl">{t('EAFL')}</Option>
          <Option value="battery">{t('Battery Life Optimization')}</Option>
        </Select>
      </BaseButtonsForm.Item>
      
      <Row gutter={[0, 30]}>

      {/* Conditional rendering based on the selected method */}
      {selectedMethod === 'random' && <div> 
        <Card title={t('Random Method Configuration')}>
          Random selection method requires no additional settings
        </Card>
        </div>}
      {selectedMethod === 'oort' && <div>
        <Col>
          <Card title={t('Oort Method Configuration')}>
            <Row>
              <img src="/oort.png" alt="oort" />
            </Row>
            <Col span={12}>
              <span className="ant-form-text"> 
              Client Score(i) = Util(i) </span>
            </Col>
            
            <Col span={12}>
              <Row gutter={12}>
                <Col>
                <BaseButtonsForm.Item label={t('')}>
                  <span className="ant-form-text"> &alpha;</span>
                  <label>
                    <BaseButtonsForm.Item name="client-number" rules={[{ required: true, message: t('Typing Client Number') }]} noStyle>
                      <InputNumber min={1} max={100} />
                    </BaseButtonsForm.Item>
                  </label>
                </BaseButtonsForm.Item>
                </Col>
                <Col>
                <BaseButtonsForm.Item label={t('')}>
                  <span className="ant-form-text"> T </span>
                  <label>
                    <BaseButtonsForm.Item name="client-number" rules={[{ required: true, message: t('Typing Client Number') }]} noStyle>
                      <InputNumber min={1} max={100} />
                    </BaseButtonsForm.Item>
                  </label>
                </BaseButtonsForm.Item>
                </Col>
              </Row>
            </Col>
          </Card>
        </Col>

        </div>}
      {selectedMethod === 'eafl' && <div> 
        <Col>
        <Card title={t('EAFL Method Configuration')}>
          <Col span={24}>        
            <img src="/EAFL.png" alt="eafl1" style={{ maxWidth: '100%' }}/>
            <img src="/EAFL2.png" alt="eafl2" style={{ maxWidth: '100%' }}/>
            <img src="/EAFL3.png" alt="eafl3" style={{ maxWidth: '100%' }}/>
          </Col>
          <Col>
            <span className="ant-form-text"> 
            Client Score(i) = reward </span>
          </Col>
          <Row gutter={24}>
            <Col>
              <BaseButtonsForm.Item label={t('')}>
                <span className="ant-form-text"> f </span>
                <label>
                  <BaseButtonsForm.Item name="eafl-f" rules={[{ required: true, message: t('Typing Client Number') }]} noStyle>
                    <InputNumber min={1} max={100} />
                  </BaseButtonsForm.Item>
                </label>
              </BaseButtonsForm.Item>
              </Col>
              <Col>
              <BaseButtonsForm.Item label={t('')}>
                <span className="ant-form-text"> T </span>
                <label>
                  <BaseButtonsForm.Item name="eafl-t" rules={[{ required: true, message: t('Typing Client Number') }]} noStyle>
                    <InputNumber min={1} max={100} />
                  </BaseButtonsForm.Item>
                </label>
              </BaseButtonsForm.Item>
              </Col>
              <Col>
              <BaseButtonsForm.Item label={t('')}>
                <span className="ant-form-text"> Battery capacity(kWh)</span>
                <label>
                  <BaseButtonsForm.Item name="eafl-battery-capacity" rules={[{ required: true, message: t('Typing Client Number') }]} noStyle>
                    <InputNumber min={1} max={100} />
                  </BaseButtonsForm.Item>
                </label>
              </BaseButtonsForm.Item>
            </Col>
          </Row>
            
          </Card>
        </Col>
        </div>}
      {selectedMethod === 'battery' && <div> 
        <Card title={t('Battery Life Optimizaton Method Configuration')}>
          <Col span={24}>        
            <img src="/battery2.png" alt="battery"style={{ maxWidth: '100%' }} />
            <img src="/EAFL3.png" alt="eafl" style={{ maxWidth: '100%' }} />
            <img src="/battery.png" alt="battery" style={{ maxWidth: '100%' }}/>
          </Col>
          <Col span={24}>
            <span className="ant-form-text"> 
            Client Score(i) = reward </span>
          </Col>
          
          <Col span={24}>
            <Row gutter={[30, 30]}>
                <BaseButtonsForm.Item label={t('')}>
                  <span className="ant-form-text"> f </span>
                  <label>
                    <BaseButtonsForm.Item name="eafl-f" rules={[{ required: true, message: t('Typing Client Number') }]} noStyle>
                      <InputNumber min={1} max={100} />
                    </BaseButtonsForm.Item>
                  </label>
                </BaseButtonsForm.Item>
                
                <BaseButtonsForm.Item label={t('')}>
                  <span className="ant-form-text"> T </span>
                  <label>
                    <BaseButtonsForm.Item name="eafl-t" rules={[{ required: true, message: t('Typing Client Number') }]} noStyle>
                      <InputNumber min={1} max={100} />
                    </BaseButtonsForm.Item>
                  </label>
                </BaseButtonsForm.Item>
                
                
                <BaseButtonsForm.Item label={t('')}>
                  <span className="ant-form-text"> &alpha;</span>
                  <label>
                    <BaseButtonsForm.Item name="client-number" rules={[{ required: true, message: t('Typing Client Number') }]} noStyle>
                      <InputNumber min={1} max={100} />
                    </BaseButtonsForm.Item>
                  </label>
                </BaseButtonsForm.Item>

                <BaseButtonsForm.Item label={t('')}>
                  <span className="ant-form-text"> Battery capacity(kWh)</span>
                  <label>
                    <BaseButtonsForm.Item name="eafl-battery-capacity" rules={[{ required: true, message: t('Typing Client Number') }]} noStyle>
                      <InputNumber min={1} max={100} />
                    </BaseButtonsForm.Item>
                  </label>
                </BaseButtonsForm.Item>
            </Row>
          </Col>
        </Card>
        </div>}

        <Col>
          <Card title={t('Set Clients Battery Level')}>
            <BaseButtonsForm.Item label={t('Min')}>
              <label>
                <BaseButtonsForm.Item name="battery-min" rules={[{ required: true, message: t('Typing Client Number') }]} noStyle>
                  <InputNumber min={1} max={100} />
                </BaseButtonsForm.Item>
              </label>
            </BaseButtonsForm.Item>
            <BaseButtonsForm.Item label={t('Max')}>
              <label>
                <BaseButtonsForm.Item name="battery-max" rules={[{ required: true, message: t('Typing Client Number') }]} noStyle>
                  <InputNumber min={1} max={100} />
                </BaseButtonsForm.Item>
              </label>
            </BaseButtonsForm.Item>
          </Card>
          </Col>
      </Row>
    </BaseButtonsForm>
  );
};
