import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface FollowerGrowthProps {
  did: string;
}

export function FollowerGrowth({ did }: FollowerGrowthProps) {
  // Simulated data - in production, this would come from an API
  const data = {
    labels: Array.from({ length: 90 }, (_, i) => i + 1),
    datasets: [{
      label: 'Followers',
      data: Array.from({ length: 90 }, (_, i) => Math.floor(Math.random() * 1000 + i * 10)),
      fill: true,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        type: 'linear' as const,
        display: false,
        grid: {
          display: false,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          maxTicksLimit: 5,
        },
      },
    },
  };

  return (
    <div className="h-32">
      <Line data={data} options={options} />
    </div>
  );
}