import React, { createContext, useState, useContext } from 'react';
import { translateText } from '../services/translationService';

const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState('English');
    const [translations, setTranslations] = useState({});

    const translateContent = async (content) => {
        if (currentLanguage === 'English') return content;
        
        if (translations[currentLanguage]?.[content]) {
            return translations[currentLanguage][content];
        }

        const translatedText = await translateText(content, currentLanguage);
        
        setTranslations(prev => ({
            ...prev,
            [currentLanguage]: {
                ...(prev[currentLanguage] || {}),
                [content]: translatedText
            }
        }));

        return translatedText;
    };

    return (
        <TranslationContext.Provider value={{ 
            currentLanguage, 
            setCurrentLanguage, 
            translateContent 
        }}>
            {children}
        </TranslationContext.Provider>
    );
};

export const useTranslation = () => useContext(TranslationContext);