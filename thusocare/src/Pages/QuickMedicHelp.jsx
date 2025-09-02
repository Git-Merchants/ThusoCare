import React, { useState } from 'react';
import { analyzeTextZeroShot, sentimentAnalysis, summarizeText } from '../services/huggingfaceService';
import '../Styling/QuickHelp.css';

const candidateLabels = [
  'medical emergency',
  'medication advice',
  'symptom explanation',
  'appointment scheduling',
  'mental health support',
  'nutrition and lifestyle',
  'general health advice',
];

export default function QuickMedicHelp() {
  const [userText, setUserText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [zeroShot, setZeroShot] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [summary, setSummary] = useState('');

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!userText.trim()) return;
    setLoading(true);
    setError('');
    setZeroShot(null);
    setSentiment(null);
    setSummary('');
    try {
      const [zs, sa, sm] = await Promise.all([
        analyzeTextZeroShot(userText, candidateLabels),
        sentimentAnalysis(userText),
        summarizeText(userText.length > 600 ? userText.slice(0, 600) : userText),
      ]);
      setZeroShot(zs);
      setSentiment(sa);
      const summaryText = Array.isArray(sm) ? sm.map(s => s.summary_text).join(' ') : '';
      setSummary(summaryText);
    } catch (err) {
      setError(err.message || 'Failed to analyze text');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="translation-page-container" style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2>Quick Medical Help</h2>
      <p>Describe what help or advice you need. We will analyze it to guide you.</p>

      <form onSubmit={handleAnalyze}>
        <textarea
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          placeholder="E.g., I have a severe headache and blurred vision since morning..."
          rows={8}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading || !userText.trim()} className="translate-btn">
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
          <button type="button" onClick={() => setUserText('')} disabled={loading} className="translate-btn secondary">
            Clear
          </button>
        </div>
      </form>

      {error && (
        <div style={{ marginTop: 16, color: '#b00020' }}>{error}</div>
      )}

      {!loading && zeroShot && (
        <section style={{ marginTop: 24 }}>
          <h3>Suggested Categories</h3>
          <ul>
            {zeroShot.labels?.map((label, idx) => (
              <li key={label}>
                <strong>{label}</strong>: {(zeroShot.scores?.[idx] * 100).toFixed(1)}%
              </li>
            ))}
          </ul>
        </section>
      )}

      {!loading && sentiment && (
        <section style={{ marginTop: 24 }}>
          <h3>Sentiment</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(sentiment, null, 2)}</pre>
        </section>
      )}

      {!loading && summary && (
        <section style={{ marginTop: 24 }}>
          <h3>Summary</h3>
          <p>{summary}</p>
        </section>
      )}

      <section style={{ marginTop: 24 }}>
        <h3>What to do next</h3>
        <ul>
          <li>If this seems like a medical emergency, call your local emergency number immediately.</li>
          <li>Use the categories above to navigate to appropriate help or contact a professional.</li>
          <li>This AI guidance is informational and not a substitute for professional medical advice.</li>
        </ul>
      </section>
    </div>
  );
}


