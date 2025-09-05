import React, { createContext, useContext, useState, useEffect } from 'react';

const TranslationContext = createContext();

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

// Function to translate text using multiple CORS proxies
export const translateText = async (text, targetLang) => {
  if (!text || targetLang === 'en') return text;
  
  // Check if text contains "ThusoCare" (case insensitive)
  const thusoCareRegex = /thusocare/i;
  if (thusoCareRegex.test(text)) {
    console.log('Text contains "ThusoCare", preserving it during translation');
    
    // Split the text into parts, preserving "ThusoCare"
    const parts = text.split(/(thusocare)/i);
    
    // Translate each part that isn't "ThusoCare"
    const translatedParts = await Promise.all(
      parts.map(async (part) => {
        if (thusoCareRegex.test(part)) {
          return part; // Keep "ThusoCare" as is
        } else if (part.trim()) {
          // Translate other parts
          return await translateTextPart(part, targetLang);
        } else {
          return part; // Keep whitespace
        }
      })
    );
    
    // Rejoin the parts
    return translatedParts.join('');
  }
  
  // Normal translation for text without "ThusoCare"
  return await translateTextPart(text, targetLang);
    };

// Helper function to translate text parts
    const translateTextPart = async (text, targetLang) => {
    if (!text.trim()) return text;
  
  console.log(`Translating: "${text}" to ${targetLang}`);

  try {
    // Try multiple CORS proxies in sequence
    const proxies = [
      'https://api.codetabs.com/v1/proxy?quest=',
      'https://corsproxy.io/?',
      'https://api.allorigins.win/raw?url=',
      'https://cors-anywhere.herokuapp.com/'
    ];
    
    const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    let translatedText = text;
    let lastError = null;
    
    // Try each proxy until one works
    for (const proxy of proxies) {
      try {
        console.log(`Trying proxy: ${proxy}`);
        const response = await fetch(proxy + apiUrl, {
          method: 'GET',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        translatedText = data[0][0][0];
        console.log(`Translation successful: "${translatedText}"`);
        break; // Exit loop if successful
      } catch (error) {
        lastError = error;
        console.warn(`Proxy failed: ${proxy}`, error);
        continue; // Try next proxy
      }
    }
    
    if (translatedText === text && lastError) {
      throw lastError;
    }
    
    return translatedText;
  } catch (error) {
    console.error('All translation proxies failed:', error);
    return text;
  }
};

export const TranslationProvider = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(
    localStorage.getItem('selectedLanguage') || 'English'
  );
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Language code mapping
  const languageCodes = {
    'English': 'en',
    'Sotho': 'st',
    'IsiZulu': 'zu',
    'Xhosa': 'xh',
    'Afrikaans': 'af'
  };

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem('selectedLanguage', selectedLanguage);
  }, [selectedLanguage]);

  // Function to translate all text content in the DOM
// Function to translate all text content in the DOM
const translatePage = async (targetLang) => {
  if (targetLang === 'en') {
    window.location.reload();
    return;
  }
  
  setIsTranslating(true);
  console.log(`Starting translation to ${targetLang}`);
  
  try {
    // Get all elements with text content but EXCLUDE map elements
    const textElements = document.querySelectorAll(`
      h1:not(.leaflet-popup-content h3):not(.leaflet-popup-content *),
      h2:not(.leaflet-popup-content *),
      h3:not(.leaflet-popup-content *),
      h4:not(.leaflet-popup-content *),
      h5:not(.leaflet-popup-content *),
      h6:not(.leaflet-popup-content *),
      p:not(.leaflet-popup-content *),
      span:not(.leaflet-popup-content *),
      a:not(.leaflet-popup-content *),
      li:not(.leaflet-popup-content *),
      button:not(.language-dropdown button):not(.leaflet-popup-content button),
      label:not(.leaflet-popup-content *),
      figcaption:not(.leaflet-popup-content *)
    `);
    
    console.log(`Found ${textElements.length} text elements to translate (excluding map elements)`);
    
    for (const element of textElements) {
      // Skip if element is empty or has user input
      if (element.textContent.trim() && !element.closest('input, textarea, select')) {
        try {
          const originalText = element.textContent;
          
          // Skip translation for elements containing "ThusoCare"
          if (originalText.toLowerCase().includes('thusocare')) {
            console.log('Skipping element with "ThusoCare"');
            continue;
          }
          
          // Skip translation for map-related elements
          if (element.closest('.leaflet-container') || 
              element.closest('.leaflet-popup') ||
              element.closest('.leaflet-control') ||
              element.closest('.leaflet-marker-icon')) {
            console.log('Skipping map element:', originalText);
            continue;
          }
          
          element.dataset.originalText = originalText;
          const translatedText = await translateText(originalText, targetLang);
          
          if (translatedText !== originalText) {
            element.textContent = translatedText;
            console.log(`Translated: "${originalText}" -> "${translatedText}"`);
          }
        } catch (error) {
          console.error('Error translating element:', error);
        }
      }
    }
    
    // Translate placeholders (but exclude map-related inputs)
    const inputElements = document.querySelectorAll('input:not(.leaflet-popup-content input), textarea:not(.leaflet-popup-content textarea)');
    console.log(`Found ${inputElements.length} input elements to check`);
    
    for (const element of inputElements) {
      if (element.placeholder) {
        try {
          const originalPlaceholder = element.placeholder;
          
          // Skip translation for placeholders containing "ThusoCare"
          if (originalPlaceholder.toLowerCase().includes('thusocare')) {
            console.log('Skipping placeholder with "ThusoCare"');
            continue;
          }
          
          // Skip map-related inputs
          if (element.closest('.leaflet-container')) {
            console.log('Skipping map input placeholder:', originalPlaceholder);
            continue;
          }
          
          element.dataset.originalPlaceholder = originalPlaceholder;
          const translatedPlaceholder = await translateText(originalPlaceholder, targetLang);
          
          if (translatedPlaceholder !== originalPlaceholder) {
            element.placeholder = translatedPlaceholder;
            console.log(`Translated placeholder: "${originalPlaceholder}" -> "${translatedPlaceholder}"`);
          }
        } catch (error) {
          console.error('Error translating placeholder:', error);
        }
      }
    }
    
    // Translate alt texts (but exclude map images)
    const imgElements = document.querySelectorAll('img:not(.leaflet-marker-icon):not(.leaflet-tile)');
    console.log(`Found ${imgElements.length} image elements to check`);
    
    for (const element of imgElements) {
      if (element.alt) {
        try {
          const originalAlt = element.alt;
          
          // Skip translation for alt texts containing "ThusoCare"
          if (originalAlt.toLowerCase().includes('thusocare')) {
            console.log('Skipping alt text with "ThusoCare"');
            continue;
          }
          
          // Skip map-related images
          if (element.closest('.leaflet-container')) {
            console.log('Skipping map image alt:', originalAlt);
            continue;
          }
          
          element.dataset.originalAlt = originalAlt;
          const translatedAlt = await translateText(originalAlt, targetLang);
          
          if (translatedAlt !== originalAlt) {
            element.alt = translatedAlt;
            console.log(`Translated alt: "${originalAlt}" -> "${translatedAlt}"`);
          }
        } catch (error) {
          console.error('Error translating alt text:', error);
        }
      }
    }
  } catch (error) {
    console.error('Translation error:', error);
  }
  
  setIsTranslating(false);
  console.log('Translation completed');
};

  // Handle language change
  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    const langCode = languageCodes[lang];
    translatePage(langCode);
  };

  const value = {
    selectedLanguage,
    setSelectedLanguage: handleLanguageChange,
    isTranslating,
    languageCodes,
    translateText,
    translatePage
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};