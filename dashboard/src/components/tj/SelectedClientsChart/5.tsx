import React from 'react';
import { Card } from 'components/common/Card/Card';
import { useTranslation } from 'react-i18next';
import { PieChart } from '../../common/charts/PieChart';

export const SelectedClientsChart: React.FC = () => {
  const { t } = useTranslation();
  const data = [
    { value: 2, name: t('Client-1') },
    { value: 4, name: t('Client-2') },
    { value: 3, name: t('Client-3') },
    { value: 4, name: t('Client-4') },
    { value: 2, name: t('Client-5') },
  ];
  const name = t('');

  return (
    <Card padding="0 0 1.875rem" title={t('Number of times selected')}>
      <PieChart data={data} name={name} showLegend={true} />
    </Card>
  );
};

export default SelectedClientsChart