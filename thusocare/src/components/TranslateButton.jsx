import React, { useState } from 'react';
import useTranslation from '../hooks/useTranslation';
import './TranslateButton.css';

const TranslateButton = ({ text, targetLanguage = 'en', className = '' }) => {
  const [translatedText, setTranslatedText] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const { translate, isLoading, error } = useTranslation();

  const handleTranslate = async () => {
    if (!text || !text.trim()) return;

    const result = await translate(text, 'auto', targetLanguage);
    if (result) {
      setTranslatedText(result);
      setShowTranslation(true);
    }
  };

  const handleClose = () => {
    setShowTranslation(false);
    setTranslatedText('');
  };

  if (!text || !text.trim()) return null;

  return (
    <div className={`translate-button-container ${className}`}>
      <button
        onClick={handleTranslate}
        disabled={isLoading}
        className="translate-button"
        title="Translate this text"
      >
        {isLoading ? '🌐 Translating...' : '🌐 Translate'}
      </button>

      {error && (
        <div className="translate-error">
          {error}
        </div>
      )}

      {showTranslation && translatedText && (
        <div className="translation-popup">
          <div className="translation-header">
            <span>Translation</span>
            <button onClick={handleClose} className="close-btn">×</button>
          </div>
          <div className="translation-content">
            <div className="original-text">
              <strong>Original:</strong> {text}
            </div>
            <div className="translated-text">
              <strong>Translated:</strong> {translatedText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslateButton;



