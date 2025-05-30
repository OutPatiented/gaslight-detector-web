// netlify/functions/analyze.js
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { text } = JSON.parse(event.body);
    
    if (!text || typeof text !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid input' })
      };
    }

    const analysis = analyzeForGaslighting(text.toLowerCase());
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ result: analysis })
    };
    
  } catch (error) {
    console.error('Analysis error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

function analyzeForGaslighting(text) {
  let score = 0;
  let detectedTactics = [];
  
  // Core gaslighting patterns with weights
  const patterns = {
    memoryDenial: {
      weight: 8,
      phrases: [
        /you'?re? (remembering|thinking|imagining) (it )?wrong/gi,
        /that never happened/gi,
        /i never said that/gi,
        /you'?re? making (it|things) up/gi,
        /you'?re? confused/gi,
        /that's not what (happened|i said)/gi,
        /you have a bad memory/gi,
        /you'?re? misremembering/gi
      ]
    },
    
    emotionalInvalidation: {
      weight: 7,
      phrases: [
        /you'?re? (being )?too (sensitive|emotional|dramatic)/gi,
        /you'?re? overreacting/gi,
        /it'?s not that (big of a )?deal/gi,
        /you'?re? being crazy/gi,
        /calm down/gi,
        /you need to chill/gi,
        /stop being so emotional/gi,
        /you'?re? acting (crazy|insane|nuts)/gi
      ]
    },
    
    realityDistortion: {
      weight: 8,
      phrases: [
        /everyone (else )?(thinks|knows|agrees|says)/gi,
        /you always (do this|twist|make)/gi,
        /your perception (isn'?t|is) (always )?(accurate|wrong)/gi,
        /you'?re? the only one who/gi,
        /nobody else has a problem with/gi,
        /ask anyone/gi,
        /everyone can see/gi
      ]
    },
    
    minimizing: {
      weight: 6,
      phrases: [
        /(it was )?just a joke/gi,
        /you can'?t take a joke/gi,
        /i was (just )?kidding/gi,
        /it'?s not a big deal/gi,
        /you'?re? making a mountain/gi,
        /get over it/gi,
        /move on/gi,
        /it'?s in the past/gi
      ]
    },
    
    blameShifting: {
      weight: 7,
      phrases: [
        /you made me/gi,
        /you forced me to/gi,
        /if you (hadn'?t|didn'?t)/gi,
        /you'?re? the one who/gi,
        /this is your fault/gi,
        /you caused this/gi,
        /you started it/gi,
        /look what you made me do/gi
      ]
    },
    
    deflection: {
      weight: 6,
      phrases: [
        /what about (when )?you/gi,
        /you do the same thing/gi,
        /you'?re? not perfect either/gi,
        /at least i don'?t/gi,
        /you have no right to/gi,
        /you'?re? one to talk/gi
      ]
    },
    
    controlAndIsolation: {
      weight: 8,
      phrases: [
        /you can'?t (see|talk to|visit)/gi,
        /i don'?t want you/gi,
        /you'?re? not allowed/gi,
        /if you loved me you (would|wouldn'?t)/gi,
        /nobody cares about you like i do/gi,
        /your (friends|family) don'?t understand/gi,
        /i'?m the only one who/gi
      ]
    },
    
    threatAndIntimidation: {
      weight: 9,
      phrases: [
        /if you leave/gi,
        /you'?ll never find/gi,
        /nobody will believe you/gi,
        /you'?ll regret/gi,
        /you need me/gi,
        /you can'?t survive without/gi,
        /i'?ll tell everyone/gi
      ]
    }
  };

  // Analyze each pattern category
  for (const [category, data] of Object.entries(patterns)) {
    let categoryMatches = [];
    
    for (const pattern of data.phrases) {
      const matches = text.match(pattern);
      if (matches) {
        categoryMatches = categoryMatches.concat(matches);
        score += data.weight * matches.length;
      }
    }
    
    if (categoryMatches.length > 0) {
      detectedTactics.push({
        category: category,
        matches: categoryMatches,
        weight: data.weight
      });
    }
  }

  // Additional context analysis
  const contextualRed = analyzeContextualPatterns(text);
  score += contextualRed.score;
  if (contextualRed.tactics.length > 0) {
    detectedTactics = detectedTactics.concat(contextualRed.tactics);
  }

  // Generate response based on score and detected tactics
  return generateAnalysisReport(score, detectedTactics, text);
}

function analyzeContextualPatterns(text) {
  let score = 0;
  let tactics = [];
  
  // Check for conversation flow patterns
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Pattern: Consistent dismissal after concerns raised
  let dismissalAfterConcern = 0;
  for (let i = 0; i < sentences.length - 1; i++) {
    const current = sentences[i].toLowerCase();
    const next = sentences[i + 1].toLowerCase();
    
    // If current sentence expresses concern/hurt
    if (/(i feel|i'm hurt|that hurt|i don't like|bothers me|upset)/gi.test(current)) {
      // And next sentence dismisses
      if (/(you're|stop|get over|not a big deal|overreacting)/gi.test(next)) {
        dismissalAfterConcern++;
        score += 5;
      }
    }
  }
  
  if (dismissalAfterConcern > 0) {
    tactics.push({
      category: 'dismissalPattern',
      matches: [`${dismissalAfterConcern} instances of dismissing concerns`],
      weight: 5
    });
  }
  
  // Check for DARVO pattern (Deny, Attack, Reverse Victim and Offender)
  const denyWords = /(i never|i didn't|that's not|no i)/gi;
  const attackWords = /(you always|you never|you're the one|your fault)/gi;
  const victimWords = /(i'm the victim|you're hurting me|i'm trying to help)/gi;
  
  if (denyWords.test(text) && attackWords.test(text)) {
    score += 8;
    tactics.push({
      category: 'DARVO',
      matches: ['Deny-Attack-Reverse pattern detected'],
      weight: 8
    });
  }
  
  return { score, tactics };
}

function generateAnalysisReport(score, detectedTactics, originalText) {
  // Determine risk level
  let riskLevel = 'Low';
  let riskColor = 'green';
  
  if (score >= 25) {
    riskLevel = 'High';
    riskColor = 'red';
  } else if (score >= 12) {
    riskLevel = 'Moderate';
    riskColor = 'orange';
  }
  
  if (score === 0) {
    return `**✅ Looking Good!**

GASLIGHTING ANALYSIS REPORT
========================================
Risk Level: Low (Score: ${score})

No obvious gaslighting patterns detected in this text.

Note: This is a basic analysis tool. Trust your instincts - if something feels wrong in your interactions, consider seeking support from a mental health professional.`;
  }
  
  // Generate detailed report
  let report = `**⚠️ ${riskLevel} Risk Detected**

GASLIGHTING ANALYSIS REPORT
========================================
Risk Level: ${riskLevel} (Score: ${score})

DETECTED MANIPULATION TACTICS:
`;

  // Group tactics by category
  const tacticsByCategory = {};
  detectedTactics.forEach(tactic => {
    if (!tacticsByCategory[tactic.category]) {
      tacticsByCategory[tactic.category] = [];
    }
    tacticsByCategory[tactic.category] = tacticsByCategory[tactic.category].concat(tactic.matches);
  });

  // Add descriptions for each category found
  const categoryDescriptions = {
    memoryDenial: "🧠 Memory Denial - Claiming events didn't happen or you remember wrong",
    emotionalInvalidation: "💔 Emotional Invalidation - Dismissing your feelings as excessive",
    realityDistortion: "🌀 Reality Distortion - Making you question your perception",
    minimizing: "📉 Minimizing - Downplaying the significance of harmful behavior",
    blameShifting: "👉 Blame Shifting - Making you responsible for their actions",
    deflection: "🔄 Deflection - Turning focus to your flaws instead",
    controlAndIsolation: "🔒 Control & Isolation - Limiting your autonomy and relationships",
    threatAndIntimidation: "⚡ Threats & Intimidation - Using fear to control behavior",
    dismissalPattern: "🚫 Dismissal Pattern - Consistently ignoring your concerns",
    DARVO: "🔄 DARVO - Deny, Attack, and Reverse Victim/Offender roles"
  };

  for (const [category, matches] of Object.entries(tacticsByCategory)) {
    const description = categoryDescriptions[category] || `${category} patterns`;
    report += `\n• ${description}`;
    if (matches.length <= 3) {
      report += `\n  Examples: "${matches.join('", "')}"`;
    } else {
      report += `\n  Found ${matches.length} instances`;
    }
  }

  // Add recommendations
  report += `\n\nRECOMMendations:
`;

  if (score >= 25) {
    report += `🚨 HIGH CONCERN: This conversation shows multiple serious manipulation tactics. Consider:
• Document these interactions
• Reach out to a trusted friend, family member, or counselor
• Contact domestic violence resources if you feel unsafe
• Trust your instincts - if it feels wrong, it probably is`;
  } else if (score >= 12) {
    report += `⚠️ MODERATE CONCERN: Some concerning patterns detected. Consider:
• Pay attention to how these interactions make you feel
• Talk to someone you trust about these conversations
• Set boundaries about respectful communication
• Trust your gut feelings about the relationship`;
  } else {
    report += `✅ LOWER CONCERN: Some minor patterns detected, but may not indicate systematic gaslighting.
• Monitor if these patterns become more frequent
• Communicate your boundaries clearly
• Trust your feelings if something seems off`;
  }

  report += `\n\nREMEMBER: You deserve to be heard, believed, and treated with respect. Your feelings and perceptions are valid.

If you're in immediate danger, contact emergency services or the National Domestic Violence Hotline: 1-800-799-7233`;

  return report;
}
