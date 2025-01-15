import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js/auto';
import { Line } from 'react-chartjs-2';

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

interface ActivityChartProps {
  activityByHour: { [hour: string]: number };
  selectedDay: string;
}

export function ActivityChart({ activityByHour, selectedDay }: ActivityChartProps) {
  // Convert 24-hour format to 12-hour format with am/pm
  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'p' : 'a';
    const h = hour % 12 || 12;
    return `${h}${ampm}`;
  };

  const hours = Array.from({ length: 24 }, (_, i) => formatHour(i));

  const data = {
    labels: hours,
    datasets: [
      {
        fill: true,
        label: 'Posts',
        data: Array.from({ length: 24 }, (_, i) => 
          activityByHour[i.toString().padStart(2, '0')] || 0
        ),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Activity by Hour - ${selectedDay}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <Line data={data} options={options} />
    </div>
  );
}