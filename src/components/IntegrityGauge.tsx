import React from 'react';

interface Props {
  score: number;
  size?: number;
}

const IntegrityGauge: React.FC<Props> = ({ score, size = 80 }) => {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - score) / 100) * circumference;

  const color =
    score >= 80 ? '#22c55e' :
    score >= 50 ? '#f59e0b' :
    '#ef4444';

  const bgColor =
    score >= 80 ? '#22c55e20' :
    score >= 50 ? '#f59e0b20' :
    '#ef444420';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill={bgColor}
          stroke="#1e293b"
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-bold text-white" style={{ fontSize: size / 4 }}>{score}</span>
      </div>
    </div>
  );
};

export default IntegrityGauge;