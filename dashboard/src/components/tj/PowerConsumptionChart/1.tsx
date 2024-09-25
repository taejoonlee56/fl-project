import React from 'react';
import ReactApexChart from 'react-apexcharts';

const PowerConsumptionChart: React.FC = () => {
  const [state, setState] = React.useState({
    series: [
      {
        name: 'Power Consumption',
        data: [0.236729101, 0.216076282, 0, 0.239521777, 0],
      },
    ],
    options: {
      chart: {
        height: 350,
        type: 'bar' as const,
      },
      plotOptions: {
        bar: {
          borderRadius: 5,
          dataLabels: {
            position: 'top',
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: function (val : any) {
          return val + "kW";
        },
        offsetY: -20,
        style: {
          fontSize: '12px',
          colors: ["#304758"],
        },
      },
      xaxis: {
        categories: ["Client-1", "Client-2", "Client-3", "Client-4", "Client-5", "Client-6"],
        position: 'bottom',
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        crosshairs: {
          fill: {
            type: 'gradient',
            gradient: {
              colorFrom: '#D8E3F0',
              colorTo: '#BED1E6',
              stops: [0, 100],
              opacityFrom: 0.4,
              opacityTo: 0.5,
            },
          },
        },
        tooltip: {
          enabled: false,
        },
      },
      yaxis: {
        axisBorder: {
          show: true,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          show: false,
          formatter: function (val:any) {
            return val + "kW";
          },
        },
      },
      title: {
        text: '',
        floating: false,
        offsetY: 330,
        align: 'center' as any,
        style: {
          color: '#444',
        },
      },
    },
  });

  return (
    <ReactApexChart options={state.options} series={state.series} type="bar" height={330} />
  );
};

export default PowerConsumptionChart;
