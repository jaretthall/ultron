import React from 'react';
import { APP_VERSION } from '../../constants';

const Footer: React.FC = () => {
  return (
    <footer className="mt-8 mb-4 text-center text-xs text-slate-400">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-xl">
        <span>Ultron</span>
        <span className="text-slate-500">•</span>
        <span>v{APP_VERSION}</span>
      </div>
    </footer>
  );
};

export default Footer;


