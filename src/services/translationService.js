import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/TranslationContext';

const LanguageSelector = () => {
  const { selectedLanguage, setSelectedLanguage, isTranslating } = useTranslation();
  const [showLanguages, setShowLanguages] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.language-dropdown')) {
        setShowLanguages(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="language-dropdown">
      <button 
        className="nav-btn language-btnL"
        onClick={(e) => {
          e.stopPropagation();
          setShowLanguages(!showLanguages);
        }}
        aria-expanded={showLanguages}
        aria-haspopup="true"
        disabled={isTranslating}
      >
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span className="nav-text">
          {isTranslating ? 'Translating...' : 'Change Language'}
        </span>
        <svg className={`nav-icon chevron ${showLanguages ? 'rotate' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {showLanguages && (
        <div className="dropdown-menu">
          {['English', 'Sotho', 'IsiZulu', 'Xhosa', 'Afrikaans'].map((lang) => (
            <button
              key={lang}
              className={`dropdown-item ${selectedLanguage === lang ? 'active' : ''}`}
              onClick={() => {
                setSelectedLanguage(lang);
                setShowLanguages(false);
              }}
              disabled={isTranslating}
            >
              {lang}
              {selectedLanguage === lang && (
                <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;