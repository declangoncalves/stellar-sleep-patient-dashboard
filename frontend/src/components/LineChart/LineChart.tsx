// components/LineChart.tsx
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';

// dynamically load the React wrapper
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface LineChartProps {
  data: { x: string; y: number }[];
}
export function LineChart({ data }: LineChartProps) {
  const maxScore = Math.max(...data.map(point => point.y));
  const options: ApexOptions = {
    chart: {
      id: 'isi-line',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    xaxis: {
      type: 'datetime',
      labels: { datetimeUTC: false },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      title: { text: 'ISI Score' },
      min: 0,
      max: Math.ceil(maxScore * 1.1),
      decimalsInFloat: 0,
      labels: {
        formatter: (val: number) => val.toFixed(0),
      },
    },
    stroke: {
      curve: 'straight',
      width: 2,
    },
    tooltip: {
      x: { format: 'dd MMM yyyy' },
    },
    markers: {
      size: 6,
      colors: undefined,
      strokeColors: '#fff',
      shape: 'circle',
      offsetX: 0,
      offsetY: 0,
      hover: {
        size: undefined,
        sizeOffset: 3,
      },
    },
  };

  const series = [
    {
      name: 'ISI',
      data: data.map(point => [new Date(point.x).getTime(), point.y]),
    },
  ];

  return (
    <Chart
      options={options}
      series={series}
      type="line"
      height={250}
      width="100%"
    />
  );
}
