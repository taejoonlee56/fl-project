import React from 'react';
import Chart from "react-apexcharts";
import { ApexOptions } from 'apexcharts';

const DonutChart: React.FC = () => {
  const options: ApexOptions = {
    series: [124, 55, 41, 17, 15],
    chart: {
      width: 380,
      type: 'donut',
    },
    plotOptions: {
      pie: {
        startAngle: -90,
        endAngle: 270
      }
    },
    dataLabels: {
      enabled: false
    },
    fill: {
      type: 'gradient',
    },
    legend: {
      formatter: function(val, opts) {
        return val + " - " + opts.w.globals.series[opts.seriesIndex]
      },
      // labels: {
      //   colors: '#FFFFFF', // 범례의 폰트 색상을 변경하였습니다.
      // },
    },
    title: {
      text: 'Data size of Clients',
      // style: {
      //   color: '#FFFFFF', // 타이틀의 폰트 색상을 변경하였습니다.
      // }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  return <Chart options={options} series={options.series as number[]} type="donut" width={380} />
}

export default DonutChart;
