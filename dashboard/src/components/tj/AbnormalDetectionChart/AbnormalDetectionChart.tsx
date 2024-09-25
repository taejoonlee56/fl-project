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
      data: [[1, 0.0, 1],
      [2, 36.25, 508],
      [3, 45.0, 587],
      [4, 89, 2737],
      [5, 42.0, 0],
      [6, 34.15, 583],
      [7, 46.6, 583],
      [8, 46.25, 584],
      [9, 38.9, 583],
      [10, 39.55, 584]]
    },
    {
      name: 'Client-2',
      data: [[1, 0.0, 1],
      [2, 48.8, 0],
      [3, 20.45, 587],
      [4, 20.05, 583],
      [5, 20.4, 584],
      [6, 13.65, 583],
      [7, 20.0, 583],
      [8, 20.45, 584],
      [9, 13.4, 583],
      [10, 13.5, 584]]
    },
    {
      name: 'Client-3',
      data: [[1, 0.0, 1],
      [2, 34.55, 508],
      [3, 51.7, 0],
      [4, 31.7, 583],
      [5, 32.25, 584],
      [6, 55.65, 0],
      [7, 53.75, 0],
      [8, 43.3, 1347],
      [9, 23.25, 583],
      [10, 21.85, 584]]
    },
    {
      name: 'Client-4',
      data: [[1, 0.0, 1],
      [2, 32.55, 508],
      [3, 22.65, 587],
      [4, 26.6, 0],
      [5, 38.6, 0],
      [6, 22.05, 583],
      [7, 44.6, 0],
      [8, 42.15, 584],
      [9, 21.25, 0],
      [10, 27.45, 584]]
    },
    {
        name: 'Client-5',
        data: [[1, 0.0, 0],
        [2, 13.3, 508],
        [3, 13.75, 587],
        [4, 13.65, 583],
        [5, 13.85, 584],
        [6, 21.3, 0],
        [7, 13.6, 583],
        [8, 13.85, 584],
        [9, 13.8, 0],
        [10, 13.8, 0]]
    },
    {
        name: 'Client-5',
        data: [[2, 0.0, 0],
        [3, 13.15, 0],
        [4, 46.25, 583],
        [5, 43.85, 584],
        [6, 31.7, 583],
        [7, 46.8, 583],
        [8, 53.0, 0],
        [9, 38.95, 583],
        [10, 45.95, 0]]
    }
    
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
