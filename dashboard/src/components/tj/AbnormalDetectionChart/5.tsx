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
      data: [[1, 36.25, 154],
      [2, 45.0, 168],
      [3, 40.24, 148],
      [4, 42, 145],
      [5, 34.15, 153]]
    },
    {
      name: 'Client-2',
      data: [[1, 48.8, 151],
      [2, 20.45, 148],
      [3, 2.05, 144],
      [4, 20.4, 141],
      [5, 13.65, 153]]
    },
    {
      name: 'Client-3',
      data: [[1, 34.55, 154],
      [2, 51.7, 155],
      [3, 31.7, 143],
      [4, 32.25, 142],
      [5, 63, 157]]
    },
    {
      name: 'Client-4',
      data: [[1, 32.55, 152],
      [2, 22.65, 161],
      [3, 26.6, 141],
      [4, 38.6, 146],
      [5, 22.05, 151]]
    },
    {
      name: 'Client-5',
      data: [[1, 13.3, 156],
      [2, 13.75, 167],
      [3, 13.65, 140],
      [4, 13.24, 141],
      [5, 21.3, 152]]
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
