import React from 'react';
import ReactApexChart from 'react-apexcharts';

const generateData = (count: number, options: { min: number; max: number }) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push(Math.floor(Math.random() * (options.max - options.min + 1)) + options.min);
  }
  return data;
};


const ClientResourceChart: React.FC = () => {
  const [state, setState] = React.useState({
    series: [
      {
        name: 'Client-1',
        data: [36.25,45,40.24],
      },
      {
        name: 'Client-2',
        data: [48.8,20.45,20.05],
      },
      {
        name: 'Client-3',
        data: [34.55,51.7,31.7],
      },
      {
        name: 'Client-4',
        data: [32.55,22.65,26.6],
      },
      {
        name: 'Client-5',
        data: [13.3,13.75,13.65],
      },
      // {
      //   name: 'Client-1',
      //   data: [0,36.25,45,89],
      // },
      // {
      //   name: 'Client-2',
      //   data: [0,48.8,20.45,20],
      // },
      // {
      //   name: 'Client-3',
      //   data: [0,34.55,51.7,31],
      // },
      // {
      //   name: 'Client-4',
      //   data: [0,32.55,22.65],
      // },
      // {
      //   name: 'Client-5',
      //   data: [0,13.3,13.75],
      // },
      // {
      //   name: 'Client-6',
      //   data: [0,13.15,46.25,43],
      // },
    ],
    options: {
      chart: {
        height: 350,
        type: "heatmap" as const,
      },
      plotOptions: {
        heatmap: {
          shadeIntensity: 0.5,
          radius: 0,
          useFillColorAsStroke: true,
          colorScale: {
            ranges: [
              { from: 0, to: 25, name: 'low', color: '#00A100' },
              { from: 26, to: 50, name: 'medium', color: '#128FD9' },
              { from: 51, to: 75, name: 'high', color: '#FFB200' },
              { from: 76, to: 100, name: 'extreme', color: '#FF0000' },
            ],
          },
        },
      },
      dataLabels: {
        enabled: true,
      },
      stroke: {
        width: 1,
      },
      title: {
        text: '',
      },
    },
  });

  return <ReactApexChart options={state.options} series={state.series} type="heatmap" height={350} />;
};

export default ClientResourceChart;
