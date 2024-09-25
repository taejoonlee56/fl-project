import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';

const generateData = (base: number, count: number, options: { min: number; max: number }) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push([base + i * 30000000, Math.floor(Math.random() * (options.max - options.min + 1)) + options.min, Math.floor(Math.random() * (options.max - options.min + 1)) + options.min]);
  }
  return data;
};

const AbnormalDetectionChart: React.FC = () => {
  const [state, setState] = useState({
    series: [{
      name: 'Client-1',
      data: [[1, 36.25, 154]]
    },
    {
      name: 'Client-2',
      data: [[1, 48.8, 151]]
    },
    {
      name: 'Client-3',
      data: [[1, 34.55, 154]]
    },
    {
      name: 'Client-4',
      data: [[1, 32.55, 152]]
    },
    {
      name: 'Client-5',
      data: [[1, 13.3, 156]]
    },    
    ],
    options: {
      chart: {
          height: 350,
          type: 'bubble' as const,
      },
      dataLabels: {
          enabled: false
      },
      fill: {
          opacity: 0.8
      },
      title: {
          text: ''
      },
      xaxis: {
          tickAmount: 12,
          type: 'category' as const,
      },
      yaxis: {
          max: 100
      }
    },
  });

  return <ReactApexChart options={state.options} series={state.series} type="bubble" height={350} />;
};

export default AbnormalDetectionChart;
