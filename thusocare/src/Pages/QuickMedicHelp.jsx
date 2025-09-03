import React, { useState } from 'react';
import {
  getSuggestionsConversational,
} from '../services/huggingfaceService';
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
  const [suggestion, setSuggestion] = useState('');

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!userText.trim()) return;

    setLoading(true);
    setError('');
    setZeroShot(null);
    setSentiment(null);
    setSummary('');
    setSuggestion('');

    // Check for emergency keywords first
    const emergencyKeywords = [
      'emergency', 'severe', 'urgent', 'chest pain', 'bleeding', 'unconscious', 'difficulty breathing', 'heart attack', 'stroke', 'breathing',
      'choking', 'seizure', 'overdose', 'poisoning', 'allergic reaction', 'anaphylaxis', 'cardiac arrest', 'can\'t breathe', 'shortness of breath',
      'severe pain', 'intense pain', 'crushing pain', 'stabbing pain', 'burning pain', 'excruciating', 'unbearable pain',
      'blood loss', 'heavy bleeding', 'hemorrhage', 'vomiting blood', 'coughing blood', 'blood in stool', 'blood in urine',
      'broken bone', 'fracture', 'head injury', 'concussion', 'spinal injury', 'neck injury', 'back injury',
      'burns', 'severe burns', 'electrical burn', 'chemical burn', 'fire', 'smoke inhalation',
      'drowning', 'near drowning', 'hypothermia', 'heat stroke', 'dehydration severe',
      'suicide', 'suicidal', 'self harm', 'overdose', 'drug overdose', 'alcohol poisoning',
      'paralysis', 'numbness', 'weakness', 'slurred speech', 'confusion', 'disorientation',
      'high fever', 'very high temperature', 'convulsions', 'fits', 'fainting', 'collapsed',
      'severe headache', 'worst headache', 'sudden headache', 'migraine severe',
      'abdominal pain severe', 'stomach pain severe', 'appendicitis', 'kidney stones',
      'pregnancy emergency', 'miscarriage', 'labor pains', 'contractions',
      'diabetic emergency', 'low blood sugar', 'high blood sugar', 'insulin shock',
      'asthma attack', 'severe asthma', 'wheezing severe', 'respiratory distress'
    ];
    const textLower = userText.toLowerCase();
    const hasEmergencyKeywords = emergencyKeywords.some(keyword => textLower.includes(keyword));

    try {
      // Updated to use the conversational approach with fallback
      const suggestionResult = await getSuggestionsConversational(userText);
      setSuggestion(suggestionResult);

      // Create a simple category classification based on keywords
      const categoryScores = candidateLabels.map(label => {
        const keywords = {
          'medical emergency': [
            'emergency', 'severe', 'urgent', 'chest pain', 'bleeding', 'unconscious', 'difficulty breathing', 'heart attack', 'stroke',
            'choking', 'seizure', 'overdose', 'poisoning', 'allergic reaction', 'anaphylaxis', 'cardiac arrest', 'can\'t breathe',
            'severe pain', 'blood loss', 'broken bone', 'fracture', 'head injury', 'burns', 'drowning', 'suicide', 'paralysis',
            'high fever', 'fainting', 'collapsed', 'asthma attack', 'diabetic emergency'
          ],
          'medication advice': ['medication', 'drug', 'pill', 'dosage', 'prescription', 'side effect', 'medicine'],
          'symptom explanation': ['symptom', 'pain', 'ache', 'fever', 'headache', 'nausea', 'dizzy', 'hurt', 'sore'],
          'appointment scheduling': ['appointment', 'schedule', 'book', 'visit', 'see doctor', 'consultation'],
          'mental health support': ['depression', 'anxiety', 'stress', 'mental', 'mood', 'sad', 'worried', 'panic'],
          'nutrition and lifestyle': ['diet', 'exercise', 'nutrition', 'weight', 'food', 'lifestyle', 'eating'],
          'general health advice': ['health', 'advice', 'general', 'wellness', 'prevention', 'checkup']
        };

        const labelKeywords = keywords[label] || [];
        const matches = labelKeywords.filter(keyword => textLower.includes(keyword)).length;
        
        // If emergency keywords detected, prioritize medical emergency category
        if (label === 'medical emergency' && hasEmergencyKeywords) {
          return {
            label,
            score: 0.95 // Very high priority for emergency
          };
        }
        
        // Calculate score with better weighting
        const score = labelKeywords.length > 0 ? (matches / labelKeywords.length) * 0.8 + 0.1 : 0.1;
        
        return {
          label,
          score: Math.min(score, 1.0)
        };
      });

      // Sort by score and create the result structure
      const sortedCategories = categoryScores.sort((a, b) => b.score - a.score);
      setZeroShot({
        labels: sortedCategories.map(c => c.label),
        scores: sortedCategories.map(c => c.score)
      });

      // Enhanced sentiment analysis with emergency detection
      const urgentWords = ['emergency', 'severe', 'urgent', 'terrible', 'unbearable', 'heart attack', 'stroke'];
      const concernWords = ['pain', 'hurt', 'worried', 'concerned', 'uncomfortable'];
      const positiveWords = ['better', 'improving', 'good', 'fine', 'healthy'];
      
      const urgentCount = urgentWords.filter(word => textLower.includes(word)).length;
      const concernCount = concernWords.filter(word => textLower.includes(word)).length;
      const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
      
      let sentimentLabel = 'NEUTRAL';
      let sentimentScore = 0.5;
      
      if (hasEmergencyKeywords || urgentCount > 0) {
        sentimentLabel = 'EMERGENCY';
        sentimentScore = 0.95;
      } else if (concernCount > positiveCount) {
        sentimentLabel = 'CONCERNED';
        sentimentScore = 0.3;
      } else if (positiveCount > concernCount) {
        sentimentLabel = 'POSITIVE';
        sentimentScore = 0.7;
      }

      setSentiment([{
        label: sentimentLabel,
        score: sentimentScore
      }]);

      // Create a simple summary
      const sentences = userText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const summaryText = sentences.length > 2 
        ? sentences.slice(0, 2).join('. ') + '.'
        : userText.trim();
      setSummary(summaryText);

    } catch (err) {
      console.error('Analysis error:', err);
      setError('Analysis failed, but you can still see basic categorization below.');
      
      // Even if there's an error, still provide basic categorization with emergency priority
      const basicCategory = hasEmergencyKeywords
        ? 'medical emergency' 
        : 'general health advice';
      
      setZeroShot({
        labels: [basicCategory, 'general health advice'],
        scores: hasEmergencyKeywords ? [0.95, 0.05] : [0.8, 0.2]
      });
      
      // Use enhanced fallback advice from service
      const fallbackAdvice = hasEmergencyKeywords 
        ? "🚨 EMERGENCY DETECTED: Please call your local emergency number immediately or go to the nearest emergency room. Do not delay seeking immediate medical attention."
        : "Please consult with a healthcare professional for proper medical guidance.";
      setSuggestion(fallbackAdvice);
    } finally {
      setLoading(false);
    }
  }

  const handleCallEmergency = () => {
    // Redirect to Globfone's web dialer with the specified South African number pre-filled
    // Note: Globfone may have limitations on calling South African numbers
    const phoneNumber = '+27658901489';
    window.open(`https://globfone.com/call-phone/?phone=${encodeURIComponent(phoneNumber)}`, '_blank');
  };

  return (
    <div className="translation-page-container" style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2>Quick Medical Help</h2>
      <p>Describe your health concern or question. Our AI will provide general guidance and suggest next steps. <strong>This tool does not diagnose - always consult healthcare professionals for medical diagnosis.</strong></p>

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
          <button
            type="button"
            onClick={() => setUserText('')}
            disabled={loading}
            className="translate-btn secondary"
          >
            Clear
          </button>
        </div>
      </form>

      {error && <div style={{ marginTop: 16, color: '#b00020' }}>{error}</div>}

      {!loading && zeroShot && (
        <section style={{ marginTop: 24 }}>
          <h3>Suggested Categories</h3>
          {/* Emergency Alert Banner */}
          {zeroShot.labels?.[0] === 'medical emergency' && zeroShot.scores?.[0] > 0.7 && (
            <div style={{
              backgroundColor: '#ffebee',
              border: '2px solid #f44336',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              textAlign: 'center'
            }}>
              <h4 style={{ color: '#c62828', margin: '0 0 8px 0', fontSize: '1.1rem' }}>
                🚨 POTENTIAL MEDICAL EMERGENCY DETECTED
              </h4>
              <p style={{ color: '#d32f2f', margin: '0 0 12px 0', fontWeight: 'bold' }}>
                Call your local emergency number immediately (112 or 10177) or go to the nearest emergency room!
              </p>
              <button
                onClick={handleCallEmergency}
                style={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Call for Help
              </button>
            </div>
          )}
          
          <ul>
            {zeroShot.labels?.map((label, idx) => {
              const percentage = (zeroShot.scores?.[idx] * 100).toFixed(1);
              const percentageNum = parseFloat(percentage);
              
              // Determine color based on percentage
              let percentageColor = '#4CAF50'; // green for 70% and above
              if (percentageNum >= 70) {
                percentageColor = '#ff4444'; // red for emergency
              } else if (percentageNum >= 40) {
                percentageColor = '#FF9800'; // orange/yellow for 40-69%
              }
              
              return (
                <li key={label} style={{
                  backgroundColor: label === 'medical emergency' && percentageNum >= 70 ? '#ffebee' : '#f8f9fa',
                  border: label === 'medical emergency' && percentageNum >= 70 ? '1px solid #f44336' : '1px solid #eceff1'
                }}>
                  <strong>{label}</strong>: 
                  <span style={{ color: percentageColor, fontWeight: 'bold', marginLeft: '8px' }}>
                    {percentage}%
                  </span>
                  {label === 'medical emergency' && percentageNum >= 70 && (
                    <span style={{ color: '#c62828', marginLeft: '8px', fontSize: '0.9rem' }}>
                      ⚠️ HIGH PRIORITY
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!loading && sentiment && (
        <section style={{ marginTop: 24 }}>
          <h3>Sentiment Analysis</h3>
          <ul>
            {sentiment.map((item, idx) => {
              const percentage = (item.score * 100).toFixed(1);
              const isEmergency = item.label === 'EMERGENCY';
              
              return (
                <li key={idx} style={{
                  backgroundColor: isEmergency ? '#ffebee' : '#f8f9fa',
                  border: isEmergency ? '1px solid #f44336' : '1px solid #eceff1'
                }}>
                  <strong style={{ color: isEmergency ? '#c62828' : '#1a237e' }}>
                    {item.label}
                  </strong>: 
                  <span style={{ 
                    color: isEmergency ? '#c62828' : '#333', 
                    fontWeight: 'bold', 
                    marginLeft: '8px' 
                  }}>
                    {percentage}%
                  </span>
                  {isEmergency && (
                    <span style={{ color: '#c62828', marginLeft: '8px', fontSize: '0.9rem' }}>
                      🚨 SEEK IMMEDIATE HELP
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!loading && summary && (
        <section style={{ marginTop: 24 }}>
          <h3>Summary</h3>
          <p>{summary}</p>
        </section>
      )}

      {!loading && suggestion && (
        <section style={{ marginTop: 24 }}>
          <h3>AI Health Guidance</h3>
          <div style={{ 
            padding: 16, 
            backgroundColor: suggestion.includes('🚨') ? '#ffebee' : '#f5f5f5', 
            borderRadius: 8, 
            border: suggestion.includes('🚨') ? '2px solid #f44336' : '1px solid #ddd' 
          }}>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.5' }}>{suggestion}</p>
          </div>
          <div style={{ 
            marginTop: 12, 
            padding: 12, 
            backgroundColor: '#e3f2fd', 
            borderRadius: 6, 
            border: '1px solid #2196f3' 
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#1565c0', fontWeight: 'bold' }}>
              ⚠️ IMPORTANT: This AI provides general health guidance only and does not diagnose medical conditions. Always consult qualified healthcare professionals for medical advice, diagnosis, and treatment.
            </p>
          </div>
        </section>
      )}

      <section style={{ marginTop: 24 }}>
        <h3>Important Notice</h3>
        <ul>
          <li>If this seems like a medical emergency, call your local emergency number immediately.</li>
          <li>Use the categories and AI suggestions above to guide your next steps.</li>
          <li>This AI guidance is informational and not a substitute for professional medical advice.</li>
          <li>The call feature uses a third-party service (Globfone) and may have limitations, such as call duration or destination restrictions.</li>
        </ul>
      </section>
    </div>
  );
}