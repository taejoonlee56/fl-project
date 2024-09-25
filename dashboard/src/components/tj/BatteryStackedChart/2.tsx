import React from 'react';
import { useTheme } from 'styled-components';
import { useTranslation } from 'react-i18next';
import * as echarts from 'echarts';
import { BaseChart } from '@app/components/common/charts/BaseChart';
import { Card } from '@app/components/common/Card/Card';

export const BatteryStackedChart: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  const chartColors = theme.colors.charts;

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: chartColors.tooltipLabel,
        },
      },
    },
    legend: {
      data: [`Client-1`, `Client-2`, `Client-3`, `Client-4`, `Client-5`].map((item) => t(`charts.${item}`)),
      top: 0,
      left: 10,
      textStyle: {
        color: theme.colors.text.main,
      },
    },
    grid: {
      top: 80,
      left: 20,
      right: 20,
      bottom: 0,
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: ['1-Round', '2-Round'],
        axisLabel: {
          fontSize: theme.commonFontSizes.xxs,
          fontWeight: theme.commonFontWeight.light,
          color: theme.colors.main.primary,
        },
      },
    ],
    yAxis: [
      {
        type: 'value',
        name: 'kWh',
        axisLabel: {
          fontSize: theme.commonFontSizes.xxs,
          fontWeight: theme.commonFontWeight.light,
          color: theme.colors.text.main,
        },
      },
    ],
    series: [
      {
        name: t('Client-1'),
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0,
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: chartColors.color1,
            },
            {
              offset: 1,
              color: chartColors.color1Tint,
            },
          ]),
        },
        emphasis: {
          focus: 'series',
        },
        // 클라이언트1의 누적량
        data: [50.00052778,50.49245086],
      },
      {
        name: t('Client-2'),
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0,
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: chartColors.color2,
            },
            {
              offset: 0.82,
              color: chartColors.color2Tint,
            },
          ]),
        },
        emphasis: {
          focus: 'series',
        },
        data: [50.00077778,50.78477778],
      },
      {
        name: t('Client-3'),
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0,
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: chartColors.color3,
            },
            {
              offset: 0.65,
              color: chartColors.color3Tint,
            },
          ]),
        },
        emphasis: {
          focus: 'series',
        },
        data: [50.00213889,52.12429712],
      },
      {
        name: t('Client-4'),
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0,
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: chartColors.color4,
            },
            {
              offset: 1,
              color: chartColors.color4Tint,
            },
          ]),
        },
        emphasis: {
          focus: 'series',
        },
        data: [50.00319444,53.19402926],
      },
      {
        name: t('Client-5'),
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0,
        },
        showSymbol: false,
        label: {
          show: true,
          position: 'top',
        },
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0.4,
              color: chartColors.color5,
            },
            {
              offset: 1,
              color: chartColors.color5Tint,
            },
          ]),
        },
        emphasis: {
          focus: 'series',
        },
        data: [50,83.56523503],
      },
    ],
  };

  return (
    <Card padding="0 0 1.875rem" title={t('Accumulated battery level per client')}>
      <BaseChart option={option} />
    </Card>
  );
};
