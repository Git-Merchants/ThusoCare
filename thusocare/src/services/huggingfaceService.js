// Lightweight wrapper around Hugging Face Inference API
// Set your token in environment: REACT_APP_HF_API_TOKEN

const HF_API_URL = 'https://api-inference.huggingface.co/models';

async function callHuggingFace(modelPath, payload) {
  const apiToken = process.env.REACT_APP_HF_API_TOKEN;
  if (!apiToken) {
    throw new Error('Missing REACT_APP_HF_API_TOKEN. Add it to your .env file.');
  }

  const response = await fetch(`${HF_API_URL}/${modelPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Hugging Face API error (${response.status}): ${text}`);
  }

  return response.json();
}

export async function analyzeTextZeroShot(inputText, candidateLabels) {
  const model = 'facebook/bart-large-mnli';
  const result = await callHuggingFace(model, {
    inputs: inputText,
    parameters: {
      candidate_labels: candidateLabels,
      multi_label: true,
    },
  });
  return result;
}

export async function summarizeText(inputText) {
  const model = 'sshleifer/distilbart-cnn-12-6';
  const result = await callHuggingFace(model, { inputs: inputText });
  return result;
}

export async function sentimentAnalysis(inputText) {
  const model = 'distilbert-base-uncased-finetuned-sst-2-english';
  const result = await callHuggingFace(model, { inputs: inputText });
  return result;
}

export default {
  analyzeTextZeroShot,
  summarizeText,
  sentimentAnalysis,
};


