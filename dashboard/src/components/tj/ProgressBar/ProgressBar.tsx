import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Col } from 'antd';
import { useTheme } from 'styled-components';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Progress } from '@app/components/common/Progress/Progress';
import { Button, ButtonGroup } from '@app/components/common/buttons/Button/Button';
import { PageTitle } from '@app/components/common/PageTitle/PageTitle';
import * as S from '@app/pages/uiComponentsPages//UIComponentsPage.styles';

export const ProgressBar: React.FC = () => {
  const [percent, setPercent] = useState<number>(0);
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <Col>
        <S.Card title={t('Server Resource')}>
          <Progress type="dashboard" percent={99} gapDegree={30} strokeColor={theme.colors.main.primary} />
          <Progress type="dashboard" percent={99} gapDegree={30} strokeColor={theme.colors.main.primary} />
          <Progress type="dashboard" percent={99} gapDegree={30} strokeColor={theme.colors.main.primary} />
        </S.Card>
      </Col>
    </>
  );
};

