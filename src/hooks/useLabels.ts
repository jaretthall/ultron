import { useState } from 'react';
import { AppLabels, AppMode, getLabels } from '../constants/labels';

const APP_MODE_KEY = 'ultron_app_mode';

export const useAppMode = (): [AppMode, (mode: AppMode) => void] => {
  const [appMode, setAppModeState] = useState<AppMode>(() => {
    const stored = localStorage.getItem(APP_MODE_KEY);
    return (stored === 'student' || stored === 'business') ? stored : 'business';
  });

  const setAppMode = (mode: AppMode) => {
    localStorage.setItem(APP_MODE_KEY, mode);
    setAppModeState(mode);
  };

  return [appMode, setAppMode];
};

export const useLabels = (): AppLabels => {
  const [appMode] = useAppMode();
  return getLabels(appMode);
};