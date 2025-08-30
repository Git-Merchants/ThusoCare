import React, { useState, useEffect } from 'react';
import TranslateService from '../services/translateService';
import './TranslationWidget.css';

const TranslationWidget = ({ 
  initialText = '', 
  onTranslationComplete, 
  showLanguageSelector = true,
  className = '' 
}) => {
  const [inputText, setInputText] = useState(initialText);
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [languages, setLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSupportedLanguages();
  }, []);

  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
    }
  }, [initialText]);

  const loadSupportedLanguages = async () => {
    try {
      const supportedLanguages = await TranslateService.getSupportedLanguages();
      setLanguages(supportedLanguages);
    } catch (err) {
      setError('Failed to load supported languages');
      console.error(err);
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setError('Please enter text to translate');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let detectedSourceLanguage = sourceLanguage;
      
      // If source language is auto, detect it
      if (sourceLanguage === 'auto') {
        detectedSourceLanguage = await TranslateService.detectLanguage(inputText);
      }

      const translated = await TranslateService.translateText(
        inputText,
        detectedSourceLanguage,
        targetLanguage
      );

      setTranslatedText(translated);
      
      if (onTranslationComplete) {
        onTranslationComplete({
          originalText: inputText,
          translatedText: translated,
          sourceLanguage: detectedSourceLanguage,
          targetLanguage: targetLanguage
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const swapLanguages = () => {
    if (sourceLanguage !== 'auto') {
      setSourceLanguage(targetLanguage);
      setTargetLanguage(sourceLanguage);
      setInputText(translatedText);
      setTranslatedText(inputText);
    }
  };

  const clearText = () => {
    setInputText('');
    setTranslatedText('');
    setError('');
  };

  return (
    <div className={`translation-widget ${className}`}>
      {error && <div className="error-message">{error}</div>}
      
      <div className="translation-container">
        <div className="input-section">
          <div className="language-selector">
            {showLanguageSelector && (
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                disabled={isLoading}
              >
                <option value="auto">Auto Detect</option>
                {languages.map((lang) => (
                  <option key={lang.LanguageCode} value={lang.LanguageCode}>
                    {lang.LanguageName}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text to translate..."
            disabled={isLoading}
            rows={4}
          />
        </div>

        <div className="controls">
          <button 
            onClick={handleTranslate} 
            disabled={isLoading || !inputText.trim()}
            className="translate-btn"
          >
            {isLoading ? 'Translating...' : 'Translate'}
          </button>
          
          <button 
            onClick={swapLanguages} 
            disabled={isLoading || sourceLanguage === 'auto'}
            className="swap-btn"
          >
            ⇄
          </button>
          
          <button 
            onClick={clearText} 
            disabled={isLoading}
            className="clear-btn"
          >
            Clear
          </button>
        </div>

        <div className="output-section">
          <div className="language-selector">
            {showLanguageSelector && (
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                disabled={isLoading}
              >
                {languages.map((lang) => (
                  <option key={lang.LanguageCode} value={lang.LanguageCode}>
                    {lang.LanguageName}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <textarea
            value={translatedText}
            readOnly
            placeholder="Translation will appear here..."
            rows={4}
          />
        </div>
      </div>
    </div>
  );
};

export default TranslationWidget;

