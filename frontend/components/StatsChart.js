import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function StatsChart({
  data = [],
  labels = [],
  datasets = [],
  type = 'line',
  options = {},
  height = 260,
  width = 600
}) {
  const chartRef = useRef();
  const chartInstance = useRef();

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    if (chartRef.current && datasets.length) {
      chartInstance.current = new Chart(chartRef.current, {
        type,
        data: {
          labels: labels.length ? labels : data.map(d => d._id || d.label || d.date),
          datasets: datasets.length ? datasets : [{
            label: 'Визиты',
            data: data.map(d => d.count || d.visits),
            borderColor: '#4A7043',
            backgroundColor: 'rgba(74,112,67,0.13)',
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: { x: { grid: { display: false } }, y: { grid: { color: '#e8d9b8' } } },
          ...options
        }
      });
    }
    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [data, labels, datasets, type, options]);

  return <canvas ref={chartRef} style={{ width, maxWidth: width, height }} />;
}