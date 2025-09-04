import { InferenceClient } from '@huggingface/inference';

const hf = new InferenceClient(process.env.REACT_APP_HF_API_TOKEN);

// Option 1: Use a different model that supports text-generation
export async function getSuggestions(question) {
  try {
    const prompt = `Provide advice or answer the following question in a helpful manner:\n${question}`;
    
    // Try using a different model that definitely supports text-generation
    const result = await hf.textGeneration({
      model: 'microsoft/DialoGPT-medium', // Alternative model
      inputs: prompt,
      parameters: { 
        max_new_tokens: 150,
        temperature: 0.7,
        return_full_text: false
      },
    });
    
    return result.generated_text || 'No response available.';
  } catch (error) {
    console.error('Error with text generation:', error);
    
    // Fallback: Try with conversational task since Cerebras supports it
    try {
      const result = await hf.conversational({
        model: 'meta-llama/Llama-3.1-8B-Instruct',
        inputs: {
          past_user_inputs: [],
          generated_responses: [],
          text: `Provide advice or answer the following question in a helpful manner: ${question}`
        },
      });
      
      return result.generated_text || 'No response available.';
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw new Error('Unable to get AI suggestions at this time');
    }
  }
}

// Option 2: Alternative implementation using conversational task directly
export async function getSuggestionsConversational(question) {
  try {
    // Try different models that work with Cerebras conversational API
    const models = [
      'microsoft/DialoGPT-medium',
      'microsoft/DialoGPT-small',
      'facebook/blenderbot-400M-distill'
    ];

    for (const model of models) {
      try {
        const result = await hf.conversational({
          model: model,
          inputs: {
            past_user_inputs: [],
            generated_responses: [],
            text: `Medical question: ${question}`
          },
        });
        
        if (result && result.generated_text) {
          return result.generated_text;
        }
      } catch (modelError) {
        console.log(`Model ${model} failed, trying next...`);
        continue;
      }
    }
    
    // If all models fail, return a helpful fallback response
    return generateFallbackAdvice(question);
    
  } catch (error) {
    console.error('Error with conversational API:', error);
    return generateFallbackAdvice(question);
  }
}

// Enhanced fallback function that provides comprehensive non-diagnostic guidance
function generateFallbackAdvice(question) {
  const lowerQuestion = question.toLowerCase();
  
  // Emergency keywords - comprehensive list
  const emergencyKeywords = ['emergency', 'severe', 'urgent', 'chest pain', 'bleeding', 'unconscious', 'difficulty breathing', 'heart attack', 'stroke', 'choking', 'seizure', 'overdose', 'poisoning', 'allergic reaction', 'can\'t breathe', 'severe pain', 'blood loss', 'broken bone', 'burns', 'suicide', 'paralysis', 'high fever', 'fainting', 'collapsed'];
  
  if (emergencyKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return "🚨 EMERGENCY SITUATION DETECTED\n\nIMMEDIATE ACTION REQUIRED:\n• Call your local emergency number (112, 10177, or 911) NOW\n• Go to the nearest emergency room immediately\n• Do not drive yourself - call an ambulance or have someone drive you\n• Stay calm and follow emergency operator instructions\n\nThis is not a diagnosis, but your symptoms suggest you need immediate professional medical attention.";
  }
  
  // Symptom-based advice (non-diagnostic)
  if (lowerQuestion.includes('headache') || lowerQuestion.includes('head pain')) {
    return "HEADACHE MANAGEMENT ADVICE:\n\n• Rest in a quiet, dark room\n• Stay well hydrated with water\n• Apply cold or warm compress to head/neck\n• Consider over-the-counter pain relief (follow package directions)\n• Avoid screens and bright lights\n\nSEEK MEDICAL CARE IF:\n• Sudden, severe headache unlike any before\n• Headache with fever, stiff neck, or vision changes\n• Headaches becoming more frequent or severe\n• Headache after head injury\n\nThis advice does not replace professional medical evaluation.";
  }
  
  if (lowerQuestion.includes('fever') || lowerQuestion.includes('temperature')) {
    return "FEVER MANAGEMENT ADVICE:\n\n• Rest and get plenty of sleep\n• Drink fluids regularly (water, clear broths)\n• Dress lightly and keep room cool\n• Monitor temperature regularly\n• Consider fever reducers if appropriate (follow directions)\n\nSEEK MEDICAL CARE IF:\n• Fever over 103°F (39.4°C)\n• Fever lasting more than 3 days\n• Difficulty breathing or chest pain\n• Severe headache or stiff neck\n• Signs of dehydration\n\nThis is general guidance - consult healthcare providers for personalized advice.";
  }
  
  if (lowerQuestion.includes('anxiety') || lowerQuestion.includes('stress') || lowerQuestion.includes('panic') || lowerQuestion.includes('mental health')) {
    return "MENTAL HEALTH SUPPORT GUIDANCE:\n\n• Practice deep breathing exercises (4-7-8 technique)\n• Try grounding techniques (5-4-3-2-1 method)\n• Maintain regular sleep schedule\n• Engage in light physical activity\n• Connect with trusted friends or family\n• Consider mindfulness or meditation apps\n\nPROFESSIONAL SUPPORT:\n• Contact a mental health professional\n• Call mental health helplines if needed\n• Speak with your primary care doctor\n\nIF IN CRISIS:\n• Call emergency services or crisis hotlines immediately\n• Go to nearest emergency room\n• Don't stay alone\n\nYour mental health matters - professional support is available.";
  }
  
  if (lowerQuestion.includes('medication') || lowerQuestion.includes('drug') || lowerQuestion.includes('pill') || lowerQuestion.includes('prescription')) {
    return "MEDICATION GUIDANCE:\n\n• NEVER stop or change medications without consulting your doctor\n• Always follow prescribed dosages and timing\n• Keep an updated list of all medications\n• Check for drug interactions with pharmacist\n• Store medications properly (temperature, light)\n• Don't share prescription medications\n\nFOR QUESTIONS ABOUT:\n• Side effects - contact prescribing doctor or pharmacist\n• Missed doses - follow medication instructions or call pharmacist\n• Cost concerns - ask about generic alternatives\n\nEMERGENCY SITUATIONS:\n• Severe allergic reactions - call emergency services\n• Suspected overdose - call poison control or emergency services\n\nAlways consult healthcare professionals for medication advice.";
  }
  
  if (lowerQuestion.includes('pain') || lowerQuestion.includes('hurt') || lowerQuestion.includes('ache')) {
    return "PAIN MANAGEMENT GUIDANCE:\n\n• Rest the affected area if possible\n• Apply ice for acute injuries (first 48 hours)\n• Use heat for muscle tension or chronic pain\n• Consider over-the-counter pain relief (follow directions)\n• Gentle stretching or movement as tolerated\n• Maintain good posture\n\nSEEK MEDICAL ATTENTION IF:\n• Severe or worsening pain\n• Pain after injury or accident\n• Pain with numbness, tingling, or weakness\n• Pain interfering with daily activities\n• Signs of infection (redness, swelling, warmth)\n\nChronic pain may require professional pain management strategies.";
  }
  
  if (lowerQuestion.includes('sleep') || lowerQuestion.includes('insomnia') || lowerQuestion.includes('tired')) {
    return "SLEEP IMPROVEMENT ADVICE:\n\n• Maintain consistent sleep schedule\n• Create relaxing bedtime routine\n• Keep bedroom cool, dark, and quiet\n• Avoid screens 1 hour before bed\n• Limit caffeine after 2 PM\n• Get natural sunlight during day\n• Avoid large meals before bedtime\n\nIF SLEEP PROBLEMS PERSIST:\n• Keep a sleep diary\n• Consult healthcare provider\n• Consider sleep study if recommended\n• Address underlying stress or anxiety\n\nGood sleep is essential for overall health and recovery.";
  }
  
  if (lowerQuestion.includes('diet') || lowerQuestion.includes('nutrition') || lowerQuestion.includes('weight') || lowerQuestion.includes('eating')) {
    return "NUTRITION AND LIFESTYLE GUIDANCE:\n\n• Eat balanced meals with fruits, vegetables, whole grains\n• Stay hydrated throughout the day\n• Practice portion control\n• Limit processed foods and added sugars\n• Include regular physical activity\n• Plan meals and snacks ahead\n\nFOR SPECIFIC DIETARY NEEDS:\n• Consult registered dietitian\n• Discuss with healthcare provider\n• Consider food allergies or intolerances\n\nWEIGHT MANAGEMENT:\n• Focus on sustainable lifestyle changes\n• Avoid extreme diets\n• Seek professional guidance for significant weight concerns\n\nNutrition needs vary by individual - professional advice recommended.";
  }
  
  // General health advice
  return "GENERAL HEALTH GUIDANCE:\n\n• Maintain regular healthcare checkups\n• Stay up to date with preventive screenings\n• Practice good hygiene (handwashing, dental care)\n• Get adequate sleep (7-9 hours for adults)\n• Stay physically active as able\n• Manage stress through healthy coping strategies\n• Avoid smoking and limit alcohol\n• Stay connected with family and friends\n\nWHEN TO SEEK MEDICAL CARE:\n• New or concerning symptoms\n• Changes in existing conditions\n• Preventive care and screenings\n• Questions about medications or treatments\n\nIMPORTANT REMINDER:\nThis guidance is educational and does not replace professional medical advice. Always consult healthcare providers for personalized medical care and diagnosis.";
}

// Option 3: Use a completely different approach with a model known to work
export async function getSuggestionsAlternative(question) {
  try {
    // Use GPT-2 which definitely supports text generation
    const result = await hf.textGeneration({
      model: 'gpt2',
      inputs: `Medical advice request: ${question}\n\nHelpful response:`,
      parameters: { 
        max_new_tokens: 150,
        temperature: 0.8,
        return_full_text: false,
        pad_token_id: 50256
      },
    });
    
    return result.generated_text || 'No response available.';
  } catch (error) {
    console.error('Error with alternative model:', error);
    throw new Error('Unable to get AI suggestions at this time');
  }
}


export default {
  getSuggestions,
  getSuggestionsConversational,
  getSuggestionsAlternative,
  generateFallbackAdvice,
};