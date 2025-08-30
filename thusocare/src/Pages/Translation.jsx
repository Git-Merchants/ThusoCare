import React, { useState } from 'react';
import TranslationWidget from '../components/TranslationWidget';
import '../Styling/TranslationPage.css';

const Translation = () => {
  const [translationHistory, setTranslationHistory] = useState([]);

  const handleTranslationComplete = (translationData) => {
    setTranslationHistory(prev => [
      {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        ...translationData
      },
      ...prev.slice(0, 9) // Keep only last 10 translations
    ]);
  };

  const clearHistory = () => {
    setTranslationHistory([]);
  };

  return (
    <div className="translation-page">
      <div className="translation-header">
        <h1>Language Translation</h1>
        <p>Translate text between multiple languages using Amazon Translate</p>
      </div>

      <div className="translation-content">
        <div className="main-translation-section">
          <TranslationWidget 
            onTranslationComplete={handleTranslationComplete}
            className="main-widget"
          />
        </div>

        {translationHistory.length > 0 && (
          <div className="translation-history">
            <div className="history-header">
              <h3>Recent Translations</h3>
              <button onClick={clearHistory} className="clear-history-btn">
                Clear History
              </button>
            </div>
            
            <div className="history-list">
              {translationHistory.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-timestamp">{item.timestamp}</div>
                  <div className="history-languages">
                    {item.sourceLanguage} → {item.targetLanguage}
                  </div>
                  <div className="history-text">
                    <div className="original-text">
                      <strong>Original:</strong> {item.originalText}
                    </div>
                    <div className="translated-text">
                      <strong>Translated:</strong> {item.translatedText}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="translation-features">
        <h3>Features</h3>
        <div className="features-grid">
          <div className="feature-card">
            <h4>🌍 Multiple Languages</h4>
            <p>Support for 75+ languages including English, Spanish, French, German, and many more.</p>
          </div>
          <div className="feature-card">
            <h4>🔍 Auto Detection</h4>
            <p>Automatically detect the source language of your text for seamless translation.</p>
          </div>
          <div className="feature-card">
            <h4>⚡ Fast & Accurate</h4>
            <p>Powered by Amazon Translate for high-quality, real-time translations.</p>
          </div>
          <div className="feature-card">
            <h4>📝 History</h4>
            <p>Keep track of your recent translations for easy reference.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Translation;
