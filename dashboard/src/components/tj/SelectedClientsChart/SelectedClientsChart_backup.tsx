import React from 'react';
import { Card } from 'components/common/Card/Card';
import { useTranslation } from 'react-i18next';
import { PieChart } from '../../common/charts/PieChart';

export const SelectedClientsChart: React.FC = () => {
  const { t } = useTranslation();
  const data = [
    // { value: 3, name: t('Client-1') },
    // { value: 1, name: t('Client-2') },
    // { value: 2, name: t('Client-3') },
    // { value: 2, name: t('Client-4') },
    // { value: 3, name: t('Client-5') },
    // { value: 4, name: t('Client-6') },
    { value: 8, name: t('Client-1') },
    { value: 9, name: t('Client-2') },
    { value: 6, name: t('Client-3') },
    { value: 6, name: t('Client-4') },
    { value: 7, name: t('Client-5') },
    { value: 5, name: t('Client-6') },
  ];
  const name = t('');

  return (
    <Card padding="0 0 1.875rem" title={t('Number of times selected')}>
      <PieChart data={data} name={name} showLegend={true} />
    </Card>
  );
};

export default SelectedClientsChart