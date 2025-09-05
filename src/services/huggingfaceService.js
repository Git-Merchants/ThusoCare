import { InferenceClient } from '@huggingface/inference';

const hf = new InferenceClient(process.env.REACT_APP_HF_API_TOKEN);

// Enhanced AI suggestion system with better context understanding
export async function getIntelligentSuggestions(question, userContext = {}) {
  try {
    // Basic analysis for context
    const analysis = { urgency: 'medium', category: 'general' };
    
    // Generate context-aware prompt
    const enhancedPrompt = buildContextualPrompt(question, analysis, userContext);
    
    // Try multiple models with different approaches
    const models = [
      {
        name: 'meta-llama/Llama-3.1-8B-Instruct',
        method: 'textGeneration',
        params: { 
          max_new_tokens: 200,
          temperature: 0.7,
          return_full_text: false,
          do_sample: true,
          top_p: 0.9
        }
      },
      {
        name: 'microsoft/DialoGPT-medium',
        method: 'conversational',
        params: {
          past_user_inputs: userContext.previousQuestions || [],
          generated_responses: userContext.previousResponses || [],
          text: enhancedPrompt
        }
      },
      {
        name: 'google/flan-t5-large',
        method: 'textGeneration',
        params: {
          max_new_tokens: 150,
          temperature: 0.6,
          return_full_text: false
        }
      }
    ];

    for (const model of models) {
      try {
        let result;
        if (model.method === 'textGeneration') {
          result = await hf.textGeneration({
            model: model.name,
            inputs: enhancedPrompt,
            parameters: model.params,
          });
        } else if (model.method === 'conversational') {
          result = await hf.conversational({
            model: model.name,
            inputs: model.params,
          });
        }
        
        if (result && (result.generated_text || result.text)) {
          const response = result.generated_text || result.text;
          
          // Post-process and enhance the AI response
          const enhancedResponse = enhanceAIResponse(response, analysis);
          return enhancedResponse;
        }
      } catch (modelError) {
        console.log(`Model ${model.name} failed, trying next...`);
        continue;
      }
    }
    
    // If all AI models fail, use intelligent fallback
    const basicAnalysis = { urgency: 'medium', category: 'general' };
    return generateIntelligentFallback(question, basicAnalysis, userContext);
    
  } catch (error) {
    console.error('Error with intelligent suggestions:', error);
    const basicAnalysis = { urgency: 'medium', category: 'general' };
    return generateIntelligentFallback(question, basicAnalysis, userContext);
  }
}

// Advanced question analysis for better context understanding
function analyzeQuestion(question, userContext = {}) {
  const lowerQuestion = question.toLowerCase();
  
  const analysis = {
    urgency: 'low',
    category: 'general',
    symptoms: [],
    timeframe: null,
    previouslyAsked: false,
    complexity: 'simple',
    emotionalTone: 'neutral',
    specificConcerns: []
  };

  // Urgency assessment
  const emergencyKeywords = [
    'emergency', 'urgent', 'severe', 'sudden', 'intense', 'can\'t breathe',
    'chest pain', 'heart attack', 'stroke', 'bleeding heavily', 'unconscious',
    'overdose', 'poisoning', 'severe allergic reaction', 'seizure', 'choking'
  ];
  
  const highUrgencyKeywords = [
    'worsening', 'getting worse', 'very painful', 'high fever', 'difficulty breathing',
    'swelling', 'persistent', 'won\'t stop', 'concerning', 'worried'
  ];

  if (emergencyKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    analysis.urgency = 'emergency';
  } else if (highUrgencyKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    analysis.urgency = 'high';
  } else if (lowerQuestion.includes('mild') || lowerQuestion.includes('slight') || lowerQuestion.includes('minor')) {
    analysis.urgency = 'low';
  } else {
    analysis.urgency = 'medium';
  }

  // Category identification
  const categories = {
    mental_health: ['anxiety', 'depression', 'stress', 'panic', 'mental health', 'mood', 'emotional'],
    pain: ['pain', 'hurt', 'ache', 'sore', 'tender', 'stiff'],
    digestive: ['stomach', 'nausea', 'vomit', 'diarrhea', 'constipation', 'bloat', 'indigestion'],
    respiratory: ['cough', 'breathing', 'lungs', 'wheez', 'shortness of breath', 'congestion'],
    skin: ['rash', 'itch', 'skin', 'bump', 'lesion', 'acne', 'dry'],
    cardiovascular: ['heart', 'chest', 'blood pressure', 'circulation', 'pulse'],
    neurological: ['headache', 'migraine', 'dizziness', 'numbness', 'tingling', 'memory'],
    musculoskeletal: ['muscle', 'joint', 'back', 'neck', 'shoulder', 'knee'],
    medication: ['medication', 'drug', 'pill', 'prescription', 'dose'],
    sleep: ['sleep', 'insomnia', 'tired', 'fatigue', 'rest'],
    nutrition: ['diet', 'eating', 'weight', 'nutrition', 'appetite']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
      analysis.category = category;
      break;
    }
  }

  // Symptom extraction
  const symptomPatterns = [
    /(?:have|having|experiencing|feeling|getting|been) (\w+(?:\s+\w+)*)/g,
    /my (\w+(?:\s+\w+)*) (?:is|are|has|have|feels)/g,
    /(\w+) in my (\w+)/g
  ];

  symptomPatterns.forEach(pattern => {
    const matches = [...lowerQuestion.matchAll(pattern)];
    matches.forEach(match => {
      if (match[1] && match[1].length > 2) {
        analysis.symptoms.push(match[1]);
      }
    });
  });

  // Timeframe detection
  const timePatterns = {
    acute: ['sudden', 'just started', 'this morning', 'today', 'few hours'],
    recent: ['few days', 'this week', 'recently', 'lately', 'past few'],
    chronic: ['months', 'years', 'long time', 'always', 'chronic']
  };

  for (const [timeframe, patterns] of Object.entries(timePatterns)) {
    if (patterns.some(pattern => lowerQuestion.includes(pattern))) {
      analysis.timeframe = timeframe;
      break;
    }
  }

  // Emotional tone analysis
  const emotionalKeywords = {
    anxious: ['worried', 'concerned', 'anxious', 'scared', 'nervous'],
    frustrated: ['frustrated', 'annoyed', 'fed up', 'tired of'],
    hopeful: ['hoping', 'optimistic', 'looking for help'],
    desperate: ['desperate', 'nothing works', 'tried everything']
  };

  for (const [emotion, keywords] of Object.entries(emotionalKeywords)) {
    if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
      analysis.emotionalTone = emotion;
      break;
    }
  }

  // Complexity assessment
  const complexityIndicators = {
    simple: ['what is', 'how to', 'can i', 'should i'],
    moderate: ['why do i', 'when should', 'how long'],
    complex: ['multiple', 'various', 'complicated', 'different', 'several']
  };

  for (const [level, indicators] of Object.entries(complexityIndicators)) {
    if (indicators.some(indicator => lowerQuestion.includes(indicator))) {
      analysis.complexity = level;
      break;
    }
  }

  return analysis;
}

// Build contextual prompts based on analysis
function buildContextualPrompt(question, analysis, userContext) {
  let basePrompt = `You are a helpful health information assistant. Provide evidence-based, non-diagnostic guidance for the following health question:\n\n`;
  
  // Add context based on analysis
  if (analysis.urgency === 'emergency') {
    basePrompt += `URGENT SITUATION - Focus on immediate safety and when to seek emergency care:\n`;
  } else if (analysis.urgency === 'high') {
    basePrompt += `Important health concern - Provide thorough guidance including when to seek professional care:\n`;
  }
  
  if (analysis.category !== 'general') {
    basePrompt += `This appears to be related to ${analysis.category.replace('_', ' ')}. `;
  }
  
  if (analysis.timeframe) {
    basePrompt += `This seems to be a ${analysis.timeframe} issue. `;
  }
  
  if (userContext.age) {
    basePrompt += `Consider this is for someone aged ${userContext.age}. `;
  }
  
  if (userContext.existingConditions && userContext.existingConditions.length > 0) {
    basePrompt += `Relevant medical history includes: ${userContext.existingConditions.join(', ')}. `;
  }

  basePrompt += `\nQuestion: "${question}"\n\n`;
  
  basePrompt += `Please provide:\n`;
  basePrompt += `1. Immediate practical steps (if any)\n`;
  basePrompt += `2. General management advice\n`;
  basePrompt += `3. When to seek professional medical care\n`;
  basePrompt += `4. Important disclaimers\n\n`;
  basePrompt += `Response should be helpful, accurate, and emphasize the importance of professional medical advice for diagnosis and treatment.`;

  return basePrompt;
}

// Enhance AI responses with additional context and safety measures
function enhanceAIResponse(aiResponse, analysis) {
  let enhanced = aiResponse.trim();
  
  // Add urgency warnings if needed
  if (analysis.urgency === 'emergency') {
    enhanced = `🚨 EMERGENCY SITUATION DETECTED\n\nIMMEDIATE ACTION: Call emergency services (112/10177) or go to the nearest emergency room NOW.\n\n${enhanced}`;
  } else if (analysis.urgency === 'high') {
    enhanced = `⚠️ IMPORTANT HEALTH CONCERN\n\nConsider contacting a healthcare provider promptly.\n\n${enhanced}`;
  }
  
  // Add category-specific safety information
  const safetyFooters = {
    mental_health: "\n\n🧠 MENTAL HEALTH SUPPORT:\nIf you're in crisis, contact emergency services or a mental health crisis hotline immediately.",
    cardiovascular: "\n\n❤️ HEART HEALTH:\nChest pain, severe shortness of breath, or heart-related symptoms require immediate medical attention.",
    medication: "\n\n💊 MEDICATION SAFETY:\nNever stop, start, or change medications without consulting your healthcare provider.",
    pain: "\n\n🩹 PAIN MANAGEMENT:\nSevere, persistent, or worsening pain should be evaluated by a healthcare professional."
  };
  
  if (safetyFooters[analysis.category]) {
    enhanced += safetyFooters[analysis.category];
  }
  
  // Always add medical disclaimer
  enhanced += `\n\n⚕️ IMPORTANT MEDICAL DISCLAIMER:\nThis information is for educational purposes only and does not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for personalized medical care.`;
  
  return enhanced;
}

// Intelligent fallback with context awareness
function generateIntelligentFallback(question, analysis, userContext) {
  const { urgency, category, symptoms, timeframe, emotionalTone } = analysis;
  
  // Emergency situations get priority handling
  if (urgency === 'emergency') {
    return generateEmergencyResponse(question, symptoms);
  }
  
  // Generate category-specific intelligent responses
  switch (category) {
    case 'mental_health':
      return generateMentalHealthResponse(question, analysis, userContext);
    case 'pain':
      return generatePainManagementResponse(question, analysis, userContext);
    case 'cardiovascular':
      return generateCardiovascularResponse(question, analysis, userContext);
    case 'respiratory':
      return generateRespiratoryResponse(question, analysis, userContext);
    case 'digestive':
      return generateDigestiveResponse(question, analysis, userContext);
    case 'medication':
      return generateMedicationResponse(question, analysis, userContext);
    default:
      return generateGeneralHealthResponse(question, analysis, userContext);
  }
}

// Emergency response generator
function generateEmergencyResponse(question, symptoms) {
  return `🚨 EMERGENCY SITUATION DETECTED

IMMEDIATE ACTIONS REQUIRED:
• Call emergency services (112, 10177, or 911) NOW
• Go to the nearest emergency room immediately
• Do NOT drive yourself - call an ambulance or have someone drive you
• Stay calm and follow emergency operator instructions
• If possible, have someone stay with you

WHILE WAITING FOR HELP:
• Stay conscious and alert
• Sit or lie down in a comfortable position
• Loosen tight clothing
• Don't eat or drink anything
• Keep track of your symptoms to report to medical professionals

⚠️ This appears to be a serious medical situation that requires immediate professional intervention. Do not delay seeking emergency medical care.

DISCLAIMER: This is not a medical diagnosis. The symptoms you've described suggest you need immediate professional medical evaluation and treatment.`;
}

// Mental health response generator
function generateMentalHealthResponse(question, analysis, userContext) {
  const { emotionalTone, timeframe } = analysis;
  
  let response = `🧠 MENTAL HEALTH SUPPORT AND GUIDANCE\n\n`;
  
  if (emotionalTone === 'anxious') {
    response += `IMMEDIATE ANXIETY MANAGEMENT TECHNIQUES:
• Practice the 4-7-8 breathing technique (inhale 4, hold 7, exhale 8)
• Use the 5-4-3-2-1 grounding method (5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste)
• Progressive muscle relaxation
• Step outside for fresh air if possible

`;
  }
  
  response += `GENERAL MENTAL WELLNESS STRATEGIES:
• Maintain a regular sleep schedule (7-9 hours)
• Engage in regular physical activity, even light walking
• Practice mindfulness or meditation (apps like Headspace, Calm)
• Connect with trusted friends, family, or support groups
• Limit caffeine and alcohol intake
• Create a daily routine that includes self-care activities

WHEN TO SEEK PROFESSIONAL HELP:
• Symptoms interfering with daily life or work
• Persistent feelings lasting more than 2 weeks
• Thoughts of self-harm or suicide
• Inability to cope with daily stressors
• Significant changes in sleep, appetite, or energy levels

CRISIS SUPPORT:
• If having thoughts of self-harm: Contact emergency services immediately
• National crisis hotlines are available 24/7
• Many communities have local mental health crisis services
• Don't hesitate to reach out - help is available

`;
  
  if (timeframe === 'chronic') {
    response += `LONG-TERM MENTAL HEALTH MANAGEMENT:
• Consider working with a therapist or counselor
• Explore different therapeutic approaches (CBT, DBT, etc.)
• Discuss medication options with a psychiatrist if appropriate
• Build a strong support network
• Develop healthy coping strategies for stress management

`;
  }
  
  response += `Remember: Mental health is just as important as physical health. Seeking help is a sign of strength, not weakness. Professional mental health support can provide personalized strategies and treatments that significantly improve quality of life.`;
  
  return response;
}

// Pain management response generator
function generatePainManagementResponse(question, analysis, userContext) {
  const { urgency, timeframe, symptoms } = analysis;
  
  let response = `🩹 PAIN MANAGEMENT GUIDANCE\n\n`;
  
  if (urgency === 'high') {
    response += `⚠️ SEVERE PAIN - SEEK MEDICAL ATTENTION PROMPTLY\n\n`;
  }
  
  response += `IMMEDIATE PAIN RELIEF STRATEGIES:
• Rest the affected area and avoid activities that worsen pain
• Apply ice for acute injuries or inflammation (15-20 minutes every 2-3 hours)
• Use heat therapy for muscle tension or chronic pain (warm compress or heating pad)
• Over-the-counter pain medications (follow package directions)
• Gentle movement or stretching as tolerated
• Maintain good posture to avoid additional strain

WHEN TO SEEK IMMEDIATE MEDICAL CARE:
• Severe, sudden, or worsening pain
• Pain following an injury or accident
• Pain with numbness, tingling, or weakness
• Signs of infection (redness, swelling, warmth, fever)
• Pain interfering significantly with daily activities or sleep
• Chest pain or abdominal pain

`;
  
  if (timeframe === 'chronic') {
    response += `CHRONIC PAIN MANAGEMENT:
• Work with healthcare providers to develop a comprehensive pain management plan
• Consider physical therapy for movement and strengthening
• Explore stress management techniques as stress can worsen pain
• Maintain regular, gentle exercise as approved by your doctor
• Keep a pain diary to identify triggers and patterns
• Consider complementary approaches (with medical approval): acupuncture, massage, yoga
• Join support groups for people with chronic pain

`;
  }
  
  response += `PAIN PREVENTION STRATEGIES:
• Regular exercise to maintain strength and flexibility
• Proper ergonomics at work and home
• Good sleep hygiene for healing and pain management
• Healthy weight maintenance to reduce stress on joints
• Stress management techniques
• Proper lifting techniques and body mechanics

IMPORTANT: Persistent or severe pain should always be evaluated by a healthcare professional. Pain is your body's signal that something needs attention, and proper medical evaluation can identify underlying causes and appropriate treatments.`;
  
  return response;
}

// Generate other category-specific responses (cardiovascular, respiratory, etc.)
function generateCardiovascularResponse(question, analysis, userContext) {
  return `❤️ CARDIOVASCULAR HEALTH GUIDANCE

⚠️ IMPORTANT: Chest pain, severe shortness of breath, or heart-related symptoms can be medical emergencies. When in doubt, seek immediate medical attention.

IMMEDIATE CONCERNS - CALL EMERGENCY SERVICES IF YOU HAVE:
• Severe chest pain or pressure
• Pain spreading to arms, jaw, neck, or back
• Severe shortness of breath
• Sudden onset of symptoms
• Dizziness with chest symptoms
• Nausea or sweating with chest pain

HEART-HEALTHY LIFESTYLE PRACTICES:
• Regular moderate exercise (150 minutes per week)
• Heart-healthy diet rich in fruits, vegetables, whole grains
• Limit saturated fats, trans fats, and excess sodium
• Maintain healthy weight
• Don't smoke; limit alcohol consumption
• Manage stress through healthy coping strategies
• Get adequate sleep (7-9 hours)
• Monitor blood pressure and cholesterol regularly

WHEN TO SEE A HEALTHCARE PROVIDER:
• New or changing chest discomfort
• Unusual shortness of breath
• Irregular heartbeat or palpitations
• Swelling in legs, ankles, or feet
• Family history of heart disease
• High blood pressure or cholesterol
• Risk factors like diabetes or smoking

Regular cardiovascular health checkups are essential for prevention and early detection of heart conditions.`;
}

function generateRespiratoryResponse(question, analysis, userContext) {
  return `🫁 RESPIRATORY HEALTH GUIDANCE

IMMEDIATE BREATHING SUPPORT:
• Sit upright to ease breathing
• Breathe slowly and deeply through your nose
• Stay calm to avoid making breathing more difficult
• Use a humidifier or breathe steam from a hot shower
• Stay hydrated with warm fluids

SEEK IMMEDIATE MEDICAL CARE IF:
• Severe difficulty breathing or shortness of breath
• Chest pain with breathing
• Blue lips or fingernails
• High fever with breathing problems
• Coughing up blood
• Sudden onset of breathing difficulties

RESPIRATORY HEALTH MAINTENANCE:
• Avoid smoking and secondhand smoke
• Regular exercise to strengthen respiratory muscles
• Good air quality - avoid pollutants when possible
• Hand hygiene to prevent respiratory infections
• Stay up to date with recommended vaccinations
• Address allergies that may affect breathing

FOR COUGHS AND COLD SYMPTOMS:
• Rest and increase fluid intake
• Honey can help soothe throat irritation
• Warm salt water gargles for sore throat
• Over-the-counter medications as appropriate
• Use a humidifier to add moisture to air

Persistent cough, ongoing breathing difficulties, or worsening symptoms warrant medical evaluation.`;
}

function generateGeneralHealthResponse(question, analysis, userContext) {
  return `⚕️ GENERAL HEALTH GUIDANCE

HEALTHY LIFESTYLE FOUNDATIONS:
• Balanced nutrition with variety of fruits, vegetables, whole grains, lean proteins
• Regular physical activity appropriate for your fitness level
• Adequate sleep (7-9 hours for adults)
• Effective stress management techniques
• Regular healthcare checkups and preventive screenings
• Good hygiene practices
• Stay hydrated throughout the day

WHEN TO CONSULT HEALTHCARE PROVIDERS:
• New or concerning symptoms
• Changes in existing health conditions
• Preventive care and health screenings
• Questions about medications or treatments
• Family history concerns
• Lifestyle and wellness planning

HEALTH MONITORING:
• Keep track of any symptoms or health changes
• Monitor vital signs if recommended by your doctor
• Maintain records of medications and medical history
• Stay informed about health recommendations for your age group

PREVENTIVE CARE:
• Follow recommended screening schedules
• Keep vaccinations current
• Regular dental and vision checkups
• Discuss family health history with your provider
• Address risk factors early

Remember: This information is educational and general in nature. Individual health needs vary, and professional medical advice is essential for proper diagnosis, treatment, and personalized health management.`;
}

function generateDigestiveResponse(question, analysis, userContext) {
  return `🍽️ DIGESTIVE HEALTH GUIDANCE

IMMEDIATE DIGESTIVE COMFORT MEASURES:
• Stay hydrated, especially if experiencing nausea or diarrhea
• BRAT diet for upset stomach (Bananas, Rice, Applesauce, Toast)
• Small, frequent meals rather than large portions
• Avoid dairy, caffeine, alcohol, and fatty foods temporarily
• Rest and avoid strenuous activity
• Ginger tea or ginger supplements may help with nausea

SEEK MEDICAL ATTENTION IF:
• Severe abdominal pain
• Persistent vomiting or inability to keep fluids down
• Signs of dehydration
• Blood in vomit or stool
• High fever with digestive symptoms
• Severe diarrhea lasting more than 2 days

DIGESTIVE HEALTH MAINTENANCE:
• Eat a balanced diet rich in fiber
• Regular meal timing
• Adequate water intake throughout the day
• Limit processed foods, excess sugar, and unhealthy fats
• Manage stress, which can affect digestion
• Regular physical activity aids digestion
• Identify and avoid trigger foods if you have sensitivities

Persistent digestive issues, changes in bowel habits, or concerning symptoms should be evaluated by a healthcare professional.`;
}

function generateMedicationResponse(question, analysis, userContext) {
  return `💊 MEDICATION SAFETY AND GUIDANCE

CRITICAL MEDICATION SAFETY RULES:
• NEVER stop, start, or change medications without consulting your healthcare provider
• Take medications exactly as prescribed - right dose, right time
• Complete full course of antibiotics even if feeling better
• Don't share prescription medications with others
• Store medications properly (temperature, light, moisture)
• Check expiration dates regularly

MANAGING YOUR MEDICATIONS:
• Keep an updated list of all medications, supplements, and vitamins
• Use pill organizers for complex medication schedules
• Set reminders for medication times
• Understand what each medication is for and potential side effects
• Check for drug interactions before starting new medications

PHARMACY SUPPORT:
• Ask your pharmacist about drug interactions
• Discuss cost-saving options like generic alternatives
• Understand proper storage and administration
• Know what to do if you miss a dose

WHEN TO CONTACT YOUR HEALTHCARE PROVIDER:
• Experiencing side effects
• Questions about dosing or administration
• Need to stop or change medications
• Starting new medications or supplements
• Cost concerns affecting medication adherence

EMERGENCY SITUATIONS:
• Severe allergic reactions - call emergency services immediately
• Suspected overdose - call poison control or emergency services
• Serious side effects or adverse reactions

Always work closely with your healthcare team for safe and effective medication management.`;
}

// Export all functions
export default {
  getIntelligentSuggestions,
  analyzeQuestion,
  buildContextualPrompt,
  enhanceAIResponse,
  generateIntelligentFallback,
  generateEmergencyResponse,
  generateMentalHealthResponse,
  generatePainManagementResponse,
  generateCardiovascularResponse,
  generateRespiratoryResponse,
  generateDigestiveResponse,
  generateMedicationResponse,
  generateGeneralHealthResponse
};