exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { text } = JSON.parse(event.body);
    
    if (!text || text.trim().length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No text provided' })
      };
    }

    // Simple gaslighting detection patterns
    const gaslightingPatterns = [
      // Denial and contradiction
      { pattern: /you're (crazy|insane|losing it|imagining things)/i, type: 'Reality Denial', severity: 'high' },
      { pattern: /that never happened/i, type: 'Memory Denial', severity: 'high' },
      { pattern: /you're being too sensitive/i, type: 'Emotion Invalidation', severity: 'medium' },
      { pattern: /you're overreacting/i, type: 'Emotion Invalidation', severity: 'medium' },
      
      // Minimizing and trivializing
      { pattern: /it's not that big of a deal/i, type: 'Minimization', severity: 'medium' },
      { pattern: /you're making a mountain out of a molehill/i, type: 'Minimization', severity: 'medium' },
      { pattern: /calm down/i, type: 'Emotion Policing', severity: 'low' },
      
      // Blame shifting
      { pattern: /if you hadn't/i, type: 'Blame Shifting', severity: 'medium' },
      { pattern: /you made me/i, type: 'Responsibility Avoidance', severity: 'high' },
      { pattern: /it's your fault/i, type: 'Blame Assignment', severity: 'high' },
      
      // Confusion and questioning reality
      { pattern: /are you sure that's what happened/i, type: 'Reality Questioning', severity: 'high' },
      { pattern: /i think you're confused/i, type: 'Reality Questioning', severity: 'medium' },
      { pattern: /you must be mistaken/i, type: 'Reality Questioning', severity: 'medium' },
      
      // Control and manipulation
      { pattern: /no one else would put up with you/i, type: 'Isolation Threat', severity: 'high' },
      { pattern: /you're lucky to have me/i, type: 'Dependency Creation', severity: 'medium' },
      { pattern: /everyone thinks you're/i, type: 'Social Isolation', severity: 'high' }
    ];

    const matches = [];
    let totalScore = 0;

    // Check for patterns
    gaslightingPatterns.forEach(({ pattern, type, severity }) => {
      const match = text.match(pattern);
      if (match) {
        let score = 0;
        switch(severity) {
          case 'high': score = 3; break;
          case 'medium': score = 2; break;
          case 'low': score = 1; break;
        }
        
        matches.push({
          text: match[0],
          type: type,
          severity: severity,
          score: score
        });
        totalScore += score;
      }
    });

    // Generate analysis result
    let riskLevel = 'Low';
    let riskColor = 'green';
    
    if (totalScore >= 6) {
      riskLevel = 'High';
      riskColor = 'red';
    } else if (totalScore >= 3) {
      riskLevel = 'Medium';
      riskColor = 'orange';
    }

    let result = `GASLIGHTING ANALYSIS REPORT
========================================

Risk Level: ${riskLevel} (Score: ${totalScore})

`;

    if (matches.length > 0) {
      result += `DETECTED PATTERNS (${matches.length} found):
----------------------------------------
`;
      matches.forEach((match, index) => {
        result += `${index + 1}. "${match.text}"
   Type: ${match.type}
   Severity: ${match.severity.toUpperCase()}
   
`;
      });

      result += `
WHAT THIS MEANS:
----------------
`;
      if (riskLevel === 'High') {
        result += `⚠️  HIGH RISK: This text contains multiple strong indicators of gaslighting behavior.
These patterns suggest potential psychological manipulation tactics.`;
      } else if (riskLevel === 'Medium') {
        result += `⚠️  MODERATE RISK: Some concerning language patterns detected.
Consider the context and frequency of such statements.`;
      } else {
        result += `⚠️  LOW RISK: Minor concerning elements detected.
May be situational rather than systematic gaslighting.`;
      }

      result += `

RECOMMENDATIONS:
----------------
• Trust your instincts and feelings
• Document concerning interactions
• Seek support from trusted friends/family
• Consider professional counseling if patterns persist
• Set clear boundaries where possible`;

    } else {
      result += `No obvious gaslighting patterns detected in this text.

Note: This is a basic analysis tool. Trust your instincts - if something feels wrong in your interactions, consider seeking support from a mental health professional.`;
    }

    result += `

----------------------------------------
Disclaimer: This tool provides educational analysis only and is not a substitute for professional mental health advice.`;

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ result })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Analysis failed',
        details: error.message 
      })
    };
  }
};
