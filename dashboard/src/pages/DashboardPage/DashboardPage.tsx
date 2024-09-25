import React from 'react';
import { Col, Collapse, Row, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { PageTitle } from '@app/components/common/PageTitle/PageTitle';
import { MapCard } from '@app/components/dashboard/mapCard/MapCard';
import { ScreeningsCard } from '@app/components/dashboard/screeningsCard/ScreeningsCard/ScreeningsCard';
import { ActivityCard } from '@app/components/dashboard/activityCard/ActivityCard';
import { TreatmentCard } from '@app/components/dashboard/treatmentCard/TreatmentCard';
import { CovidCard } from '@app/components/dashboard/covidCard/CovidCard';
import { HealthCard } from '@app/components/dashboard/HealthCard/HealthCard';
import { FavoritesDoctorsCard } from '@app/components/dashboard/favoriteDoctors/FavoriteDoctorsCard/FavoritesDoctorsCard';
import { PatientResultsCard } from '@app/components/dashboard/PatientResultsCard/PatientResultsCard';
import { StatisticsCards } from '@app/components/dashboard/statisticsCards/StatisticsCards';
import { BloodScreeningCard } from '@app/components/dashboard/bloodScreeningCard/BloodScreeningCard/BloodScreeningCard';
import { NewsCard } from '@app/components/dashboard/NewsCard/NewsCard';
import { References } from '@app/components/common/References/References';
import { useResponsive } from '@app/hooks/useResponsive';
import { BaseButtonsForm } from '@app/components/common/forms/BaseButtonsForm/BaseButtonsForm';
import * as S from './DashboardPage.styles';

import { Progress } from '@app/components/common/Progress/Progress';
import { useTheme } from 'styled-components';

import { Card } from '@app/components/common/Card/Card';
import { LearningMetricForm } from '@app/components/tj/LearningMetricForm/LearningMetricForm';
import { ClientSelectionForm } from '@app/components/tj/ClientSelectionForm/ClientSelectionForm';
import { AbnormalDetectionForm } from '@app/components/tj/AbnormalDetectionForm/AbnormalDetectionForm';
import { ServerAccuracy } from '@app/components/tj/ServerAccuracy/ServerAccuracy';
import { ClientAccuracy } from '@app/components/tj/ClientAccuracy/ClientAccuracy';
import { BatteryStackedChart } from '@app/components/tj/BatteryStackedChart/BatteryStackedChart';
import ClientResourceChart from '@app/components/tj/ClientResourceChart/ClientResourceChart';
import PowerConsumptionChart from '@app/components/tj/PowerConsumptionChart/PowerConsumptionChart';
import AbnormalDetectionChart from '@app/components/tj/AbnormalDetectionChart/AbnormalDetectionChart';
import { SelectedClientsChart } from '@app/components/tj/SelectedClientsChart/SelectedClientsChart';
import { ProgressBar } from '@app/components/tj/ProgressBar/ProgressBar';
import { MapControlForm } from '@app/components/tj/MapControlForm/MapControlForm';
import { DataControlForm } from '@app/components/tj/DataControlForm/DataControlForm';
import { BasicTable } from '@app/components/tj/BasicTable/BasicTable';
import { Tables } from '@app/components/tj/ClientDataTables/Tables';
import DonutChart from '@app/components/tj/DonutChart/DonutChart';
import { Upload, UploadDragger } from '@app/components/common/Upload/Upload';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import { Button } from '@app/components/common/buttons/Button/Button';
import * as U from '@app/pages/uiComponentsPages//UIComponentsPage.styles';

import styled from 'styled-components';


const DraggerIconWrapper = styled.div`
  font-size: 4rem;
  color: ${(props) => props.theme.colors.main.primary};
`;
const DraggerTitle = styled.div`
  font-size: ${(props) => props.theme.commonFontSizes.xl}ß;
  font-weight: ${(props) => props.theme.commonFontWeight.bold};
`;
const DraggerDescription = styled.div`
  font-size: ${(props) => props.theme.commonFontSizes.md};
  padding: 0 1rem;
`;


const DashboardPage: React.FC = () => {
  const { isTablet, isDesktop } = useResponsive();

  const theme = useTheme();

  const { t } = useTranslation();

  const uploadProps = {
    name: 'file',
    multiple: true,
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    onChange: (info: any) => {
      const { status } = info.file;
      if (status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (status === 'done') {
        message.success(t('uploads.successUpload', { name: info.file.name }));
      } else if (status === 'error') {
        message.error(t('uploads.failedUpload', { name: info.file.name }));
      }
    },
  };

  const LimitedWidthCard = styled(U.Card)`
    max-width: 400px; // 원하는 너비를 설정하세요.
  `;
  const desktopLayout = (
    <Row>
      <S.LeftSideCol xl={60} xxl={30}>
        <Row gutter={[30, 30]}>
          <Col id="configuration-card" xs={30} xxl={30}>
            <Card id="map" title = {t('Configuration')} padding="1.25rem">
              <Row gutter={32}>
                <Col span={6}>
                  <U.Card id="data" title = {t('Self-Driving Data Configuration')} padding="1.25rem">
                    <DataControlForm />
                  </U.Card>
                </Col>
                <Col span={6}>
                  <U.Card id="carla-map" title = {t('CARLA Environments')} padding="1.25rem">
                    <MapControlForm />
                  </U.Card>
                </Col>

                <Col span={6}>
                  <Row gutter={30}>
                    <U.Card id="server" title = {t('Server Resource')} padding="1.25rem">
                      <Progress type="dashboard" percent={99} gapDegree={30} strokeColor={theme.colors.main.primary} />
                      <Progress type="dashboard" percent={99} gapDegree={30} strokeColor={theme.colors.main.primary} />
                      <Progress type="dashboard" percent={99} gapDegree={30} strokeColor={theme.colors.main.primary} />
                    </U.Card>
                    <U.Card title={t('Data collection progress')} padding="1.25rem">
                        <Progress percent={50} strokeColor={theme.colors.main.primary} />
                    </U.Card>
                  </Row>
                </Col>

                <Col span={6}>
                  <U.Card id= 'upload' title={t('Custom Data Upload')}>
                    <UploadDragger {...uploadProps}>
                      <DraggerIconWrapper>
                        <InboxOutlined />
                      </DraggerIconWrapper>
                      <DraggerTitle>{t('uploads.dragUpload')}</DraggerTitle>
                      <DraggerDescription>{t('uploads.bulkUpload')}</DraggerDescription>
                    </UploadDragger>
                  </U.Card>
                </Col>

                
              </Row>
            </Card>
          </Col>

          {/* <Col span={6}>  
            <U.Card id="donut-chart" title={t('Data Distribution')} padding="1.25rem">
              <DonutChart />
            </U.Card>
          </Col>   */}
          

        {/* <Row gutter={60}> */}
          <Col id="fl-controller-cards" xs={30} xxl={30} span={24}>
            <Card id="map" title = {t('Federated Learning Controller')} padding="1.25rem">
              <Row gutter={24}>
                <Col span={8}>
                  <U.Card id="validation form" title={t('Federated Learning Strategy')} padding="1.25rem">
                    <LearningMetricForm />
                  </U.Card>
                </Col>
                <Col span={8}>
                  <U.Card id="client-selection" title = {t('Client Selection Strategy')} padding="1.25rem">
                    <ClientSelectionForm />
                  </U.Card>
                </Col>
                <Col span={8}>
                  <U.Card id="client-selection" title = {t('Abnormal Detection Strategy')} padding="1.25rem">
                    <AbnormalDetectionForm />
                  </U.Card>
                </Col>
              </Row>
            </Card>
          </Col>
        {/* </Row> */}

        {/* <Row gutter={80}> */}
            <Col id="fl-monitor-card" span={24}>              
              <Card id="map" title = {t('Federated Learning Monitor')} padding="1.25rem">
                <Row gutter={[30, 30]}>
                  {/* 1. 서버, 클라이언트 Accuracy */}
                  {/* 2. 클라이언트 리소스 모니터링Accuracy */}
                  {/* 3. 이상 클라이언트 Accuracy */}
                    <Col span={24}>
                      <Card id="map" title = {t('Training Monitoring')} padding="1.25rem">
                        <Row gutter={[16, 16]}>
                          <Col span={6}>              
                            <ServerAccuracy />
                          </Col>
                          <Col span={6}>
                            <ClientAccuracy />
                          </Col>
                          <Col span={5}>
                            <SelectedClientsChart/>
                          </Col>
                          <Col span={7}>
                            <Card id="basic-table" title={t('Clients Info')} padding="1.25rem 1.25rem 0">
                              <BasicTable />
                            </Card>
                          </Col>
                        </Row>
                      </Card>
                    </Col>
                    <Col span={18}>
                    <Card id="map" title = {t('Clients Resource Monitoring')} padding="1.25rem">
                      <Row gutter={16}>
                        <Col span={8}>
                            <Card id="client-resource-check" title={t('Clients Computing Resource')} padding="1.25rem 1.25rem 0">
                                <ClientResourceChart />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <BatteryStackedChart />
                        </Col>
                        <Col span={8}>
                          <Card id="client-resource-check" title={t('Power Consumption')} padding="1.25rem 1.25rem 0">
                            <PowerConsumptionChart/>
                          </Card>
                        </Col>
                      </Row>
                    </Card>
                    </Col>

                    <Col span={6}>
                      <Card id="map" title = {t('Abnormal Monitoring')} padding="1.25rem">   
                          <Card id="abnormal-check" title={('Abnormal Detection')} padding="1.25rem 1.25rem 0">
                            <AbnormalDetectionChart />
                          </Card>
                      </Card>
                    </Col>
                  </Row>
              </Card>
            </Col>
      </Row>
      </S.LeftSideCol>
    </Row>
  );

  const mobileAndTabletLayout = (
    <Row gutter={[20, 20]}>
      <S.LeftSideCol xl={60} xxl={60}>
        <Row gutter={[30, 30]}>
          <Col xs={10} sm={10} xl={10}>
            <Card id="validation form" title={t('Choose Learning Option')} padding="1.25rem">
              <LearningMetricForm />
            </Card>
          </Col>

          <Col xs={10} sm={10} xl={14}>  
            <Card id="map" title = {t('Map Select & Overview')} padding="1.25rem">
              <MapControlForm />
            </Card>
          </Col>
          <Col id="server-accuracy" xs={10} xxl={12}>
            <ServerAccuracy />
          </Col>
          <Col id="client-accuracy" xs={10} xxl={12}>
            <ClientAccuracy />
          </Col>
          {/* <Col id="Basic-Table" xs={10} xxl={8}>
            <Tables />
          </Col> */}
          <ProgressBar />
          
        </Row>
      </S.LeftSideCol>
      {/* <StatisticsCards />

      {isTablet && (
        <Col id="map" md={24} order={4}>
          <MapCard />
        </Col>
      )}



      <Col id="latest-screenings" xs={24} md={12} order={(isTablet && 5) || 0}>
        <ScreeningsCard />
      </Col>

      <Col id="activity" xs={24} md={12} order={(isTablet && 8) || 0}>
        <ActivityCard />
      </Col>

      <Col id="treatment-plan" xs={24} md={24} order={(isTablet && 10) || 0}>
        <TreatmentCard />
      </Col>

      <Col id="health" xs={24} md={12} order={(isTablet && 9) || 0}>
        <HealthCard />
      </Col>

      <Col id="patient-timeline" xs={24} md={12} order={(isTablet && 11) || 0}>
        <PatientResultsCard />
      </Col>

      <Col id="blood-screening" xs={24} md={12} order={(isTablet && 6) || 0}>
        <BloodScreeningCard />
      </Col>

      <Col id="favorite-doctors" xs={24} md={24} order={(isTablet && 13) || 0}>
        <FavoritesDoctorsCard />
      </Col>

      <Col id="covid" xs={24} md={12} order={(isTablet && 12) || 0}>
        <CovidCard />
      </Col>

      <Col id="news" xs={24} md={24} order={(isTablet && 14) || 0}>
        <NewsCard />
      </Col> */}
    </Row>
  );

  return (
    <>
      <PageTitle>{t('common.dashboard')}</PageTitle>
      {isDesktop ? desktopLayout : mobileAndTabletLayout}
    </>
  );
};

export default DashboardPage;
