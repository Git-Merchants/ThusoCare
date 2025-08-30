import AWS from 'aws-sdk';

// Configure AWS
AWS.config.update({
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
});

// Initialize the Translate service
const translate = new AWS.Translate();

class TranslateService {
  /**
   * Translate text from one language to another
   * @param {string} text - Text to translate
   * @param {string} sourceLanguage - Source language code (e.g., 'en', 'es', 'fr')
   * @param {string} targetLanguage - Target language code (e.g., 'en', 'es', 'fr')
   * @returns {Promise<string>} - Translated text
   */
  static async translateText(text, sourceLanguage = 'auto', targetLanguage = 'en') {
    try {
      const params = {
        Text: text,
        SourceLanguageCode: sourceLanguage === 'auto' ? 'auto' : sourceLanguage,
        TargetLanguageCode: targetLanguage,
      };

      const result = await translate.translateText(params).promise();
      return result.TranslatedText;
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  /**
   * Get list of supported languages
   * @returns {Promise<Array>} - Array of supported languages
   */
  static async getSupportedLanguages() {
    try {
      const result = await translate.listLanguages().promise();
      return result.Languages;
    } catch (error) {
      console.error('Error fetching supported languages:', error);
      throw new Error(`Failed to fetch languages: ${error.message}`);
    }
  }

  /**
   * Detect the language of the input text
   * @param {string} text - Text to detect language for
   * @returns {Promise<string>} - Detected language code
   */
  static async detectLanguage(text) {
    try {
      const params = {
        Text: text,
      };

      const result = await translate.detectLanguage(params).promise();
      return result.LanguageCode;
    } catch (error) {
      console.error('Language detection error:', error);
      throw new Error(`Language detection failed: ${error.message}`);
    }
  }
}

export default TranslateService;
