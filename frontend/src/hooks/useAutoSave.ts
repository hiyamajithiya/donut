import { useEffect, useRef, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';

interface AutoSaveOptions {
  key: string;
  data: any;
  delay?: number;
  enabled?: boolean;
  onSave?: (data: any) => Promise<void> | void;
  onLoad?: () => any;
  showNotifications?: boolean;
}

export const useAutoSave = ({
  key,
  data,
  delay = 2000,
  enabled = true,
  onSave,
  onLoad,
  showNotifications = true
}: AutoSaveOptions) => {
  const { showSuccess, showError } = useNotification();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  const isInitialMount = useRef(true);

  const saveToStorage = useCallback(async (dataToSave: any) => {
    try {
      const serializedData = JSON.stringify(dataToSave);

      // Don't save if data hasn't changed
      if (serializedData === lastSavedRef.current) {
        return;
      }

      localStorage.setItem(`autosave_${key}`, serializedData);
      localStorage.setItem(`autosave_${key}_timestamp`, Date.now().toString());

      lastSavedRef.current = serializedData;

      // Call custom save function if provided
      if (onSave) {
        await onSave(dataToSave);
      }

      if (showNotifications && !isInitialMount.current) {
        showSuccess('Progress saved automatically', 2000);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      if (showNotifications) {
        showError('Failed to save progress');
      }
    }
  }, [key, onSave, showSuccess, showError, showNotifications]);

  const clearSavedData = useCallback(() => {
    localStorage.removeItem(`autosave_${key}`);
    localStorage.removeItem(`autosave_${key}_timestamp`);
    lastSavedRef.current = '';
  }, [key]);

  const loadFromStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem(`autosave_${key}`);
      const timestamp = localStorage.getItem(`autosave_${key}_timestamp`);

      if (savedData && timestamp) {
        const parsedData = JSON.parse(savedData);
        const saveTime = parseInt(timestamp);
        const now = Date.now();

        // Check if saved data is not too old (24 hours)
        if (now - saveTime < 24 * 60 * 60 * 1000) {
          return parsedData;
        } else {
          // Remove old data
          clearSavedData();
        }
      }

      // Call custom load function if provided
      if (onLoad) {
        return onLoad();
      }

      return null;
    } catch (error) {
      console.error('Auto-load error:', error);
      return null;
    }
  }, [key, onLoad, clearSavedData]);


  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    saveToStorage(data);
  }, [data, saveToStorage]);

  // Auto-save effect
  useEffect(() => {
    if (!enabled || isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveToStorage(data);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, saveToStorage]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (enabled) {
        forceSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, forceSave]);

  return {
    loadFromStorage,
    clearSavedData,
    forceSave,
    hasSavedData: () => !!localStorage.getItem(`autosave_${key}`),
    getSaveTimestamp: () => {
      const timestamp = localStorage.getItem(`autosave_${key}_timestamp`);
      return timestamp ? new Date(parseInt(timestamp)) : null;
    }
  };
};

// Hook for wizard-specific auto-save
export const useWizardAutoSave = (wizardState: any) => {
  const autoSave = useAutoSave({
    key: 'wizard_progress',
    data: wizardState,
    delay: 3000,
    enabled: true,
    showNotifications: false // Disable notifications for wizard auto-save
  });

  const restoreProgress = useCallback(() => {
    const savedData = autoSave.loadFromStorage();
    if (savedData) {
      return {
        data: savedData,
        timestamp: autoSave.getSaveTimestamp()
      };
    }
    return null;
  }, [autoSave]);

  return {
    ...autoSave,
    restoreProgress
  };
};

// Hook for form auto-save
export const useFormAutoSave = <T>(formData: T, formKey: string) => {
  return useAutoSave({
    key: `form_${formKey}`,
    data: formData,
    delay: 1500,
    enabled: true,
    showNotifications: true
  });
};