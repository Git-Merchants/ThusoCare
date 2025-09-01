# Amazon Translate Setup Guide

This guide will help you set up Amazon Translate in your React application.

## Prerequisites

1. An AWS account
2. AWS credentials with Translate permissions
3. Node.js and npm installed

## Step 1: AWS Setup

### 1.1 Create an AWS Account

If you don't have an AWS account, create one at [aws.amazon.com](https://aws.amazon.com)

### 1.2 Create IAM User

1. Go to AWS IAM Console
2. Create a new user with programmatic access
3. Attach the `TranslateFullAccess` policy (or create a custom policy with minimal permissions)

### 1.3 Get AWS Credentials

1. After creating the user, download the CSV file with Access Key ID and Secret Access Key
2. Keep these credentials secure

## Step 2: Environment Variables

Create a `.env` file in your project root (`thusocare/`) with the following variables:

```env
# AWS Configuration for Amazon Translate
REACT_APP_AWS_REGION=us-east-1
REACT_APP_AWS_ACCESS_KEY_ID=your_access_key_id_here
REACT_APP_AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
```

**Important:** Replace the placeholder values with your actual AWS credentials.

## Step 3: Install Dependencies

The AWS SDK has already been installed. If you need to reinstall:

```bash
npm install aws-sdk
```

## Step 4: Usage

### Access the Translation Page

Navigate to `/translation` in your application to use the translation feature.

### Using the Translation Widget

The `TranslationWidget` component can be imported and used in any component:

```jsx
import TranslationWidget from './components/TranslationWidget';

// Basic usage
<TranslationWidget />

// With props
<TranslationWidget
  initialText="Hello world"
  onTranslationComplete={(data) => console.log(data)}
  showLanguageSelector={true}
/>
```

### Using the Translation Service

You can also use the translation service directly:

```jsx
import TranslateService from "./services/translateService";

// Translate text
const translatedText = await TranslateService.translateText(
  "Hello world",
  "en",
  "es"
);

// Get supported languages
const languages = await TranslateService.getSupportedLanguages();

// Detect language
const detectedLanguage = await TranslateService.detectLanguage("Hola mundo");
```

## Step 5: Security Best Practices

### For Production

1. **Never commit AWS credentials to version control**
2. Use AWS IAM roles instead of access keys when possible
3. Implement proper CORS policies
4. Consider using AWS Cognito for user authentication

### For Development

1. Use environment variables (as shown above)
2. Add `.env` to your `.gitignore` file
3. Use AWS CLI profiles for local development

## Step 6: Troubleshooting

### Common Issues

1. **"Access Denied" Error**

   - Check if your AWS credentials are correct
   - Verify the IAM user has Translate permissions
   - Ensure the region is correct

2. **"Region not found" Error**

   - Make sure you're using a valid AWS region
   - Check if Amazon Translate is available in your region

3. **CORS Issues**
   - Configure CORS in your AWS account if needed
   - Check browser console for CORS errors

### Testing

To test if everything is working:

1. Start your development server: `npm start`
2. Navigate to `http://localhost:3000/translation`
3. Try translating a simple text like "Hello world"

## Supported Languages

Amazon Translate supports 75+ languages including:

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Portuguese (pt)
- Italian (it)
- Chinese (zh)
- Japanese (ja)
- Korean (ko)
- Arabic (ar)
- And many more...

## Cost Considerations

Amazon Translate pricing:

- $15.00 per million characters for standard translation
- $60.00 per million characters for custom terminology
- Free tier: 2 million characters per month for the first 12 months

Monitor your usage in the AWS Console to avoid unexpected charges.

## Additional Resources

- [Amazon Translate Documentation](https://docs.aws.amazon.com/translate/)
- [AWS SDK for JavaScript Documentation](https://docs.aws.amazon.com/sdk-for-javascript/)
- [AWS Pricing Calculator](https://calculator.aws/)



