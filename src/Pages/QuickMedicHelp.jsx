import React, { useState, useEffect } from 'react';
import {
  getIntelligentSuggestions
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
  const [analysisDetails, setAnalysisDetails] = useState(null);
  const [videoSuggestions, setVideoSuggestions] = useState([]);

  
  // User context state (can be expanded based on user profile)
  const [userContext, setUserContext] = useState({
    age: null,
    existingConditions: [],
    previousQuestions: [],
    previousResponses: []
  });

  // Generate specific guidance based on user's exact prompt
  const generateSpecificGuidance = (userInput) => {
    const lowerInput = userInput.toLowerCase();
    
    // Emergency situations
    const emergencyKeywords = ['heart attack', 'stroke', 'cardiac arrest', 'unconscious', 'can\'t breathe', 'choking', 'overdose', 'anaphylaxis'];
    if (emergencyKeywords.some(keyword => lowerInput.includes(keyword))) {
      return "🚨 EMERGENCY DETECTED: Call emergency services (112/10177) immediately. Do not delay seeking immediate medical attention.";
    }
    
    // Chest-related symptoms
    if (lowerInput.includes('chest') && (lowerInput.includes('pain') || lowerInput.includes('sore') || lowerInput.includes('hurt'))) {
      return "CHEST DISCOMFORT GUIDANCE:\n\n⚠️ Chest pain can be serious. If you have severe, crushing pain, shortness of breath, or pain spreading to arm/jaw, call emergency services immediately.\n\nFor mild chest soreness:\n• Rest and avoid strenuous activity\n• Apply gentle heat or cold\n• Practice deep breathing\n• Monitor symptoms closely\n\nSeek medical care if pain persists, worsens, or you have breathing difficulties.";
    }
    
    // Headache symptoms
    if (lowerInput.includes('headache') || (lowerInput.includes('head') && lowerInput.includes('pain'))) {
      return "HEADACHE MANAGEMENT:\n\n• Rest in a quiet, dark room\n• Stay hydrated with water\n• Apply cold/warm compress to head or neck\n• Consider over-the-counter pain relief (follow directions)\n• Avoid screens and bright lights\n\nSeek immediate care if:\n• Sudden, severe headache unlike any before\n• Headache with fever, stiff neck, or vision changes\n• Headache after head injury";
    }
    
    // Cut/injury symptoms
    if (lowerInput.includes('cut') || lowerInput.includes('bleeding') || (lowerInput.includes('injured') && (lowerInput.includes('leg') || lowerInput.includes('arm') || lowerInput.includes('thumb') || lowerInput.includes('finger') || lowerInput.includes('hand')))) {
      return "CUT/INJURY MANAGEMENT:\n\n🚨 FOR SEVERE CUTS - CALL EMERGENCY SERVICES IF:\n• Deep cut that won't stop bleeding\n• Cut longer than 1/2 inch\n• Bleeding that soaks through bandages\n• Signs of severe blood loss\n\nFIRST AID FOR MINOR CUTS:\n• Apply direct pressure with clean cloth\n• Elevate the injured area above heart level\n• Clean wound gently with water once bleeding stops\n• Apply antibiotic ointment if available\n• Cover with sterile bandage\n• Change bandage daily and keep wound clean\n\nSEEK MEDICAL CARE IF:\n• Cut is deep or gaping\n• Bleeding doesn't stop after 10 minutes of pressure\n• Signs of infection (redness, swelling, pus, fever)\n• Numbness or inability to move the area\n• Cut was from dirty or rusty object\n• Tetanus shot is not up to date\n\nWARNING: Never apply tourniquets unless trained. For severe bleeding, maintain pressure and get emergency help immediately.";
    }
    
    // Fainting/dizziness symptoms
    if (lowerInput.includes('faint') || lowerInput.includes('dizzy') || lowerInput.includes('lightheaded') || lowerInput.includes('vertigo')) {
      return "FAINTING/DIZZINESS MANAGEMENT:\n\n⚠️ CALL EMERGENCY SERVICES IF:\n• Person is unconscious and not responding\n• Fainting with chest pain or difficulty breathing\n• Head injury from falling\n• Repeated fainting episodes\n\nIMMEDIATE CARE:\n• Sit or lie down immediately\n• If lying down, elevate legs 8-12 inches\n• Loosen tight clothing around neck\n• Get fresh air if possible\n• Stay hydrated with water\n• Avoid sudden position changes\n\nCOMMON CAUSES:\n• Dehydration or low blood sugar\n• Standing up too quickly\n• Heat exposure\n• Stress or anxiety\n• Certain medications\n\nSEEK MEDICAL CARE IF:\n• Frequent dizziness or fainting\n• Dizziness with hearing loss\n• Severe headache with dizziness\n• Chest pain or irregular heartbeat\n• Confusion or difficulty speaking";
    }
    
    // Default guidance for general health questions
    return "GENERAL HEALTH GUIDANCE:\n\nBased on your concern, here are some general recommendations:\n\n• Monitor your symptoms closely\n• Stay hydrated and get adequate rest\n• Maintain good hygiene practices\n• Consider when symptoms started and any triggers\n• Keep track of any changes\n\nConsult a healthcare provider if:\n• Symptoms persist or worsen\n• You develop new concerning symptoms\n• You have questions about your health\n\nThis guidance is educational only and does not replace professional medical advice.";
  };





  // Generate YouTube video suggestions based on user prompt
  const generateVideoSuggestions = (userInput) => {
    const lowerInput = userInput.toLowerCase();
    let suggestions = [];

    // Chest pain related videos
    if (lowerInput.includes('chest') && (lowerInput.includes('pain') || lowerInput.includes('sore'))) {
      suggestions = [
        { title: "Chest Pain: When to Worry - Mayo Clinic", query: "chest pain when to worry mayo clinic" },
        { title: "Heart Attack vs Chest Pain - Medical Explanation", query: "heart attack vs chest pain symptoms" },
        { title: "Chest Pain Relief Exercises", query: "chest pain relief exercises stretches" }
      ];
    }
    // Headache related videos
    else if (lowerInput.includes('headache') || (lowerInput.includes('head') && lowerInput.includes('pain'))) {
      suggestions = [
        { title: "Headache Relief Techniques - Medical Guide", query: "headache relief techniques medical" },
        { title: "Types of Headaches Explained", query: "types of headaches migraine tension" },
        { title: "Natural Headache Remedies", query: "natural headache remedies home treatment" }
      ];
    }
    // Anxiety/stress related videos
    else if (lowerInput.includes('anxiety') || lowerInput.includes('stress') || lowerInput.includes('panic')) {
      suggestions = [
        { title: "Anxiety Management Techniques", query: "anxiety management techniques breathing" },
        { title: "Stress Relief Methods - Medical Advice", query: "stress relief methods medical advice" },
        { title: "Panic Attack Help and Prevention", query: "panic attack help prevention techniques" }
      ];
    }
    // Cut/injury related videos
    else if (lowerInput.includes('cut') || lowerInput.includes('bleeding') || lowerInput.includes('wound') || lowerInput.includes('injured')) {
      suggestions = [
        { title: "First Aid for Cuts and Wounds - Medical Guide", query: "first aid cuts wounds bleeding treatment" },
        { title: "How to Stop Bleeding - Emergency Care", query: "how to stop bleeding first aid emergency" },
        { title: "Wound Care and Bandaging Techniques", query: "wound care bandaging techniques medical" }
      ];
    }
    // Fainting/dizziness related videos
    else if (lowerInput.includes('faint') || lowerInput.includes('dizzy') || lowerInput.includes('lightheaded') || lowerInput.includes('vertigo')) {
      suggestions = [
        { title: "Fainting and Dizziness - Causes and Treatment", query: "fainting dizziness causes treatment medical" },
        { title: "First Aid for Fainting - Emergency Response", query: "first aid fainting emergency response" },
        { title: "Vertigo and Balance Problems - Medical Guide", query: "vertigo balance problems medical treatment" }
      ];
    }
    // General health videos
    else {
      suggestions = [
        { title: "General Health Tips - Medical Professionals", query: "general health tips medical professionals" },
        { title: "When to See a Doctor - Health Guide", query: "when to see doctor health symptoms" },
        { title: "Basic First Aid and Health Care", query: "basic first aid health care tips" }
      ];
    }

    return suggestions;
  };

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!userText.trim()) return;

    setLoading(true);
    setError('');
    setZeroShot(null);
    setSentiment(null);
    setSummary('');
    setSuggestion('');
    setAnalysisDetails(null);

    const textLower = userText.toLowerCase();
    
    // Check if query is medically related
    const medicalKeywords = [
      'pain', 'ache', 'hurt', 'sick', 'illness', 'disease', 'symptom', 'fever', 'headache', 'nausea', 'dizzy', 'tired', 'fatigue', 'sore',
      'medication', 'medicine', 'drug', 'pill', 'prescription', 'doctor', 'hospital', 'clinic', 'health', 'medical',
      'emergency', 'severe', 'urgent', 'chest', 'bleeding', 'unconscious', 'difficulty breathing', 'heart attack', 'stroke',
      'breathing', 'choking', 'seizure', 'overdose', 'poisoning', 'allergic reaction', 'anaphylaxis', 'cardiac arrest',
      'blood', 'broken bone', 'fracture', 'injury', 'burns', 'drowning', 'hypothermia', 'heat stroke', 'dehydration',
      'suicide', 'suicidal', 'paralysis', 'numbness','dizzy', 'weak', 'confusion', 'convulsions', 'fainting', 'collapsed',
      'migraine', 'abdominal', 'stomach', 'appendicitis', 'kidney', 'pregnancy', 'miscarriage', 'diabetic', 'diabetes',
      'asthma', 'respiratory', 'anxiety', 'depression', 'mental health', 'stress','cut' ,'panic', 'insomnia', 'sleep',
      'diet', 'nutrition', 'weight', 'eating', 'allergy', 'infection', 'virus', 'bacteria', 'cold', 'faint','flu',
      'cancer', 'tumor', 'surgery', 'treatment', 'therapy', 'vaccine', 'immunization', 'checkup', 'screening',
      'cut', 'wound', 'injured', 'leg', 'arm', 'thumb', 'finger', 'hand', 'foot', 'toe', 'limb',
      'faint', 'fainting', 'dizzy', 'dizziness', 'lightheaded', 'vertigo'
    ];
    
    const isMedicallyRelated = medicalKeywords.some(keyword => textLower.includes(keyword));
    
    if (!isMedicallyRelated) {
      setSuggestion('This question doesn\'t appear to be health-related. Please ask a medical or health question for appropriate guidance.');
      setLoading(false);
      return;
    }

    try {
      // Check for emergency keywords
      const emergencyKeywords = [
        'emergency', 'severe', 'urgent', 'chest pain', 'bleeding', 'unconscious', 'difficulty breathing', 'cancer','tumor','heart attack', 'stroke','kidney','pregnancy','pregnant'
      ];
      const hasEmergencyKeywords = emergencyKeywords.some(keyword => textLower.includes(keyword));
      
      console.log('Emergency keywords check:', hasEmergencyKeywords);
      console.log('Text being checked:', textLower);
      
      // Basic analysis for display
      const analysis = { urgency: hasEmergencyKeywords ? 'emergency' : 'medium', category: 'general' };
      setAnalysisDetails(analysis);

      // Log emergency to database if detected
      if (hasEmergencyKeywords) {
        console.log('Emergency detected, attempting to log to database...');
        try {
          const supabase = window.supabaseClient;
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // First ensure user exists in users table
            const { error: upsertError } = await supabase
              .from('users')
              .upsert({
                user_id: user.id,
                email: user.email,
                name: user.user_metadata?.name || user.email.split('@')[0],
                surname: user.user_metadata?.surname || ''
              }, { onConflict: 'user_id' });
            
            if (upsertError) {
              console.error('Error creating user:', upsertError);
              return;
            }
            
            // Now insert emergency
            const { data, error } = await supabase
              .from('emergencies')
              .insert({
                id: crypto.randomUUID(),
                user_id: user.id,
                emergency: userText
              });
            
            if (error) {
              console.error('Database error:', error);
            } else {
              console.log('Emergency logged successfully');
            }
          }
        } catch (error) {
          console.error('Error logging emergency:', error);
        }
      }



      // Generate specific guidance based on user's prompt
      const aiSuggestion = generateSpecificGuidance(userText);
      setSuggestion(aiSuggestion);

      // Generate YouTube video suggestions
      const videos = generateVideoSuggestions(userText);
      setVideoSuggestions(videos);

      // Generate basic categorization
      const enhancedCategories = { labels: ['general health advice'], scores: [0.8] };
      setZeroShot(enhancedCategories);

      // Generate basic sentiment
      const enhancedSentiment = [{ label: 'NEUTRAL', score: 0.5 }];
      setSentiment(enhancedSentiment);

      // Create basic summary
      const intelligentSummary = userText.length > 100 ? userText.substring(0, 100) + '...' : userText;
      setSummary(intelligentSummary);

    } catch (err) {
      console.error('Analysis error:', err);
      setError('Analysis encountered an issue, but emergency detection is still active.');
      
      // Fallback to basic emergency detection if AI fails
      const emergencyKeywords = ['emergency', 'severe', 'urgent', 'chest pain', 'bleeding', 'unconscious', 'difficulty breathing', 'heart attack', 'stroke'];
      const hasEmergencyKeywords = emergencyKeywords.some(keyword => textLower.includes(keyword));
      const basicAnalysis = { urgency: hasEmergencyKeywords ? 'emergency' : 'low', category: 'general' };
      setAnalysisDetails(basicAnalysis);
      

      
      const hasEmergency = basicAnalysis.urgency === 'emergency';
      
      // Basic categorization fallback
      setZeroShot({
        labels: hasEmergency 
          ? ['medical emergency', 'general health advice']
          : [basicAnalysis.category.replace('_', ' '), 'general health advice'],
        scores: hasEmergency ? [0.95, 0.05] : [0.8, 0.2]
      });
      
      // Basic sentiment fallback
      setSentiment([{
        label: hasEmergency ? 'EMERGENCY' : basicAnalysis.urgency.toUpperCase(),
        score: hasEmergency ? 0.95 : 0.6
      }]);

      // Emergency fallback response
      const fallbackResponse = hasEmergency 
        ? "🚨 EMERGENCY SITUATION DETECTED\n\nIMMEDIATE ACTION REQUIRED:\n• Call your local emergency number (112, 10177, or 911) NOW\n• Go to the nearest emergency room immediately\n• Do not drive yourself - call an ambulance\n• Stay calm and follow emergency operator instructions\n\nThis appears to require immediate professional medical attention."
        : generateSpecificGuidance(userText);
      
      setSuggestion(fallbackResponse);
      
      // Basic summary
      setSummary(userText.length > 100 ? userText.substring(0, 100) + '...' : userText);
    } finally {
      setLoading(false);
    }
  }

  // Generate enhanced categorization based on AI analysis
  const generateEnhancedCategorization = (analysis, userText) => {
    const { urgency, category, symptoms, timeframe } = analysis;
    
    // Calculate scores based on analysis
    const categoryMap = {
      'mental_health': 'mental health support',
      'pain': 'symptom explanation',
      'cardiovascular': 'medical emergency',
      'respiratory': 'symptom explanation',
      'digestive': 'symptom explanation',
      'medication': 'medication advice',
      'sleep': 'general health advice',
      'nutrition': 'nutrition and lifestyle',
      'general': 'general health advice'
    };

    const primaryCategory = categoryMap[category] || 'general health advice';
    
    // Emergency gets highest priority
    if (urgency === 'emergency') {
      return {
        labels: ['medical emergency', primaryCategory, 'general health advice'],
        scores: [0.95, 0.3, 0.1]
      };
    }

    // High urgency situations
    if (urgency === 'high') {
      return {
        labels: [primaryCategory, 'medical emergency', 'general health advice'],
        scores: [0.85, 0.4, 0.2]
      };
    }

    // Normal categorization
    const scores = [0.8, 0.3, 0.15];
    const labels = [primaryCategory, 'general health advice', 'symptom explanation'];
    
    return { labels, scores };
  };

  // Generate enhanced sentiment analysis
  const generateEnhancedSentiment = (analysis, userText) => {
    const { urgency, emotionalTone, category } = analysis;
    
    let sentimentLabel = 'NEUTRAL';
    let sentimentScore = 0.5;
    
    if (urgency === 'emergency') {
      sentimentLabel = 'CRITICAL_EMERGENCY';
      sentimentScore = 0.95;
    } else if (urgency === 'high') {
      sentimentLabel = 'URGENT_CONCERN';
      sentimentScore = 0.8;
    } else if (emotionalTone === 'anxious') {
      sentimentLabel = 'ANXIOUS';
      sentimentScore = 0.7;
    } else if (emotionalTone === 'frustrated') {
      sentimentLabel = 'FRUSTRATED';
      sentimentScore = 0.6;
    } else if (emotionalTone === 'hopeful') {
      sentimentLabel = 'SEEKING_HELP';
      sentimentScore = 0.4;
    } else if (category === 'mental_health') {
      sentimentLabel = 'MENTAL_HEALTH_CONCERN';
      sentimentScore = 0.65;
    }

    return [{
      label: sentimentLabel,
      score: sentimentScore
    }];
  };

  // Generate intelligent summary based on analysis
  const generateIntelligentSummary = (userText, analysis) => {
    const { category, urgency, symptoms, timeframe } = analysis;
    
    let summary = `Health concern: ${category.replace('_', ' ')}`;
    
    if (urgency === 'emergency') {
      summary += ' (EMERGENCY)';
    } else if (urgency === 'high') {
      summary += ' (urgent)';
    }
    
    if (symptoms && symptoms.length > 0) {
      summary += `. Key symptoms: ${symptoms.slice(0, 3).join(', ')}`;
    }
    
    if (timeframe) {
      summary += `. Timeline: ${timeframe}`;
    }
    
    return summary;
  };

  // Update user context for better future interactions
  const updateUserContext = (question, response) => {
    setUserContext(prev => ({
      ...prev,
      previousQuestions: [...prev.previousQuestions.slice(-4), question],
      previousResponses: [...prev.previousResponses.slice(-4), response.substring(0, 100)]
    }));
  };

  // Basic guidance generator for fallback
  const generateBasicGuidance = (userText, analysis) => {
    const { category, urgency } = analysis;
    
    const basicGuidance = {
      pain: "For pain management:\n• Rest the affected area\n• Apply ice or heat as appropriate\n• Consider over-the-counter pain relief\n• Monitor symptoms\n\nSeek medical care if pain is severe or persistent.",
      mental_health: "For mental health concerns:\n• Practice deep breathing\n• Reach out to trusted friends or family\n• Consider professional counseling\n• If in crisis, contact emergency services\n\nMental health support is available - you're not alone.",
      cardiovascular: "For heart-related concerns:\n• Call emergency services immediately if severe\n• Rest and avoid strenuous activity\n• Monitor symptoms closely\n\nHeart symptoms always warrant medical evaluation.",
      general: "General health guidance:\n• Monitor your symptoms\n• Stay hydrated and rest\n• Consult healthcare providers for concerning symptoms\n• Maintain good health practices"
    };

    return basicGuidance[category] || basicGuidance.general;
  };

  // Clear function with context reset
  const handleClear = () => {
    setUserText('');
    setZeroShot(null);
    setSentiment(null);
    setSummary('');
    setSuggestion('');
    setAnalysisDetails(null);
    setError('');
    setVideoSuggestions([]);
  };

  return (
    <div className="translation-page-container" style={{ maxWidth: 900, margin: '0 auto' }}>
      <button className="back-btn" onClick={() => window.history.back()}>← Back</button>
      <h2>Advanced Medical Assistant</h2>
      <p>
        Describe your health concern in detail. Our enhanced tool will analyze your situation and provide 
        personalized guidance with appropriate urgency levels. 
        <strong> This tool provides educational information only - always consult healthcare professionals for medical diagnosis and treatment.</strong>
      </p>

      <form onSubmit={handleAnalyze}>
        <textarea
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          placeholder="E.g., I've been having severe chest pain for the last hour, along with shortness of breath and sweating. "
          rows={8}
          style={{ 
            width: '100%', 
            padding: 12, 
            borderRadius: 8, 
            border: '1px solid #ccc',
            fontSize: '14px',
            lineHeight: '1.4'
          }}
        />
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="submit" disabled={loading || !userText.trim()} className="translate-btn">
            {loading ? 'Analyzing...' : 'Analyze Health Concern'}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="translate-btn secondary"
          >
            Clear All
          </button>
        </div>
      </form>

      {error && (
        <div style={{ 
          marginTop: 16, 
          color: '#b00020', 
          backgroundColor: '#ffebee', 
          padding: 12, 
          borderRadius: 6,
          border: '1px solid #f44336'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Analysis Details */}
      {!loading && analysisDetails && (
        <section style={{ marginTop: 24 }}>
          <h3>Analysis Summary</h3>
          <div style={{ 
            padding: 16, 
            backgroundColor: '#f8f9fa', 
            borderRadius: 8, 
            border: '1px solid #dee2e6' 
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <strong>Urgency Level:</strong>
                <span style={{ 
                  marginLeft: 8,
                  color: analysisDetails.urgency === 'emergency' ? '#d32f2f' : 
                        analysisDetails.urgency === 'high' ? '#f57c00' : '#388e3c',
                  fontWeight: 'bold'
                }}>
                  {analysisDetails.urgency.toUpperCase()}
                </span>
              </div>
              {analysisDetails.timeframe && (
                <div>
                  <strong>Timeline:</strong>
                  <span style={{ marginLeft: 8 }}>{analysisDetails.timeframe}</span>
                </div>
              )}
            </div>
            {analysisDetails.symptoms && analysisDetails.symptoms.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <strong>Detected Symptoms:</strong>
                <div style={{ marginTop: 4 }}>
                  {analysisDetails.symptoms.slice(0, 5).map((symptom, idx) => (
                    <span key={idx} style={{ 
                      display: 'inline-block',
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: '0.9rem',
                      marginRight: 8,
                      marginBottom: 4
                    }}>
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Emergency Alert Banner */}
      {!loading && zeroShot && zeroShot.labels?.[0] === 'medical emergency' && zeroShot.scores?.[0] > 0.7 && (
        <section style={{ marginTop: 24 }}>
          <div style={{
            backgroundColor: '#ffebee',
            border: '3px solid #f44336',
            borderRadius: 12,
            padding: 20,
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)'
          }}>
            <h2 style={{ color: '#c62828', margin: '0 0 12px 0', fontSize: '1.5rem' }}>
              🚨 CRITICAL MEDICAL EMERGENCY DETECTED
            </h2>
            <p style={{ color: '#d32f2f', margin: '0 0 16px 0', fontWeight: 'bold', fontSize: '1.1rem' }}>
              This situation requires IMMEDIATE medical attention!
            </p>
            <div style={{ 
              backgroundColor: '#c62828', 
              color: 'white', 
              padding: '12px 24px', 
              borderRadius: 6,
              display: 'inline-block',
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}>
              📞 CALL EMERGENCY SERVICES NOW: 112 or 10177
            </div>
          </div>
        </section>
      )}

      {!loading && suggestion && (
        <section style={{ marginTop: 24 }}>
          <h3>Health Guidance & Recommendations</h3>
          <div style={{ 
            padding: 20, 
            backgroundColor: suggestion.includes('🚨') ? '#ffebee' : '#f5f5f5', 
            borderRadius: 12, 
            border: suggestion.includes('🚨') ? '3px solid #f44336' : '2px solid #ddd',
            boxShadow: suggestion.includes('🚨') ? '0 4px 12px rgba(244, 67, 54, 0.2)' : '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              margin: 0, 
              whiteSpace: 'pre-wrap', 
              fontSize: '15px', 
              lineHeight: '1.6',
              color: suggestion.includes('🚨') ? '#c62828' : '#333'
            }}>
              {suggestion}
            </div>
          </div>
          
          {/* Enhanced Medical Disclaimer */}
          <div style={{ 
            marginTop: 16, 
            padding: 16, 
            backgroundColor: '#e3f2fd', 
            borderRadius: 8, 
            border: '2px solid #2196f3' 
          }}>
            <div style={{ fontSize: '14px', color: '#1565c0', fontWeight: 'bold' }}>
              ⚕️ IMPORTANT MEDICAL DISCLAIMER
            </div>
            <ul style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#1976d2' }}>
              <li>This tool provides educational health information only</li>
              <li>It does not diagnose medical conditions or replace professional medical advice</li>
              <li>Always consult qualified healthcare providers for medical care</li>
              <li>In emergencies, call emergency services immediately</li>
              <li>Individual medical needs may vary significantly</li>
            </ul>
          </div>
        </section>
      )}

      {/* YouTube Video Suggestions */}
      {!loading && videoSuggestions.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h3>Recommended Educational Videos</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {videoSuggestions.map((video, idx) => (
              <div key={idx} style={{
                padding: 16,
                backgroundColor: '#f8f9fa',
                borderRadius: 8,
                border: '1px solid #dee2e6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong style={{ color: '#333' }}>{video.title}</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#666' }}>Educational content related to your health concern</p>
                </div>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video.query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#b90a0aff',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: 16,
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}
                >
                  Watch on YouTube
                </a>
              </div>
            ))}
          </div>
          <div style={{ 
            marginTop: 12, 
            padding: 12, 
            backgroundColor: '#e3f2fd', 
            borderRadius: 6, 
            fontSize: '0.85rem',
            color: '#1565c0'
          }}>
            📺 These videos are for educational purposes only. Always consult healthcare professionals for medical advice.
          </div>
        </section>
      )}

      <section style={{ marginTop: 32, padding: 20, backgroundColor: '#fff3e0', borderRadius: 8, border: '2px solid #ff9800' }}>
        <h3 style={{ color: '#f57c00', marginTop: 0 }}>🚨 Emergency Guidelines</h3>
        <div style={{ fontSize: '14px', color: '#ef6c00' }}>
          <p><strong>Call Emergency Services Immediately (112/10177) if you experience:</strong></p>
          <ul>
            <li>Severe chest pain or difficulty breathing</li>
            <li>Signs of stroke (facial drooping, arm weakness, speech difficulty)</li>
            <li>Severe bleeding or loss of consciousness</li>
            <li>Suspected heart attack or severe allergic reaction</li>
            <li>Any life-threatening situation</li>
          </ul>
          <p><strong>Remember:</strong> This AI assistant is designed to provide guidance, but human life and emergency situations always require immediate professional medical intervention.</p>
        </div>
      </section>
    </div>
  );
}