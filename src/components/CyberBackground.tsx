import React from 'react';
import { usePage } from '@/contexts/PageContext';

const CyberBackground: React.FC = () => {
  const { show3DBackground } = usePage();

  // Show animated background only on landing page
  if (!show3DBackground) {
    return null;
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Primary animated gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)] animate-pulse"></div>

        {/* Secondary animated overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent_50%)] animate-pulse" style={{ animationDelay: '1s' }}></div>

        {/* Tertiary animated overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.2),transparent_50%)] animate-pulse" style={{ animationDelay: '2s' }}></div>

        {/* Floating particles effect */}
        <div className="absolute inset-0">
          {Array.from({ length: 15 }, (_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Add CSS animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CyberBackground;
