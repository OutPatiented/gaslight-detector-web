const fetch = require("node-fetch");

exports.handler = async function(event, context) {
  try {
    const { text } = JSON.parse(event.body);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a Gaslighting and Manipulation Detection Analyst. Your job is to read conversations and detect tactics like gaslighting, DARVO, emotional invalidation, tone policing, guilt-tripping, etc. Give a clear and calm breakdown of what’s happening."
          },
          {
            role: "user",
            content: text
          }
        ]
      })
    });

    const result = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ result: result.choices[0].message.content })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};