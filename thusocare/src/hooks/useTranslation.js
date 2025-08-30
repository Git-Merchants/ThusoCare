import { useState, useCallback } from 'react';
import TranslateService from '../services/translateService';

const useTranslation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const translate = useCallback(async (text, sourceLanguage = 'auto', targetLanguage = 'en') => {
    if (!text || !text.trim()) {
      setError('Text to translate is required');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const translatedText = await TranslateService.translateText(
        text,
        sourceLanguage,
        targetLanguage
      );
      return translatedText;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const detectLanguage = useCallback(async (text) => {
    if (!text || !text.trim()) {
      setError('Text to detect language for is required');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const detectedLanguage = await TranslateService.detectLanguage(text);
      return detectedLanguage;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSupportedLanguages = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const languages = await TranslateService.getSupportedLanguages();
      return languages;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    translate,
    detectLanguage,
    getSupportedLanguages,
    isLoading,
    error,
    clearError
  };
};

export default useTranslation;
