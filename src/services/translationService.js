import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";

const translateClient = new TranslateClient({
    region: process.env.REACT_APP_AWS_REGION,
    credentials: {
        accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    }
});

export const translateText = async (text, targetLanguage) => {
    const params = {
        Text: text,
        SourceLanguageCode: "en",
        TargetLanguageCode: getLanguageCode(targetLanguage),
    };

    try {
        const command = new TranslateTextCommand(params);
        const response = await translateClient.send(command);
        return response.TranslatedText;
    } catch (error) {
        console.error("Translation error:", error);
        return text;
    }
};

const getLanguageCode = (language) => {
    const languageCodes = {
        'English': 'en',
        'Sotho': 'st',
        'IsiZulu': 'zu',
        'Xhosa': 'xh',
        'Afrikaans': 'af'
    };
    return languageCodes[language] || 'en';
};