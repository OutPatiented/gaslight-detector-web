const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  try {
    const { text } = JSON.parse(event.body);

    if (!text || typeof text !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid input text.' }),
      };
    }

    // Simulate analysis logic
    const detected = text.includes('manipulation');
    const tactics = detected
      ? [
          {
            line: 1,
            excerpt: 'manipulation',
            tactic: 'Gaslighting',
          },
        ]
      : [];

    return {
      statusCode: 200,
      body: JSON.stringify({ detected, tactics }),
    };
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
