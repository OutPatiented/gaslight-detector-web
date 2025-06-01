const fetch = require("node-fetch");

exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  const { text } = JSON.parse(event.body);
  if (!text || !text.trim()) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No text provided" })
    };
  }

  const tactics = [
    "Gaslighting", "DARVO", "Emotional Invalidation", "Guilt-tripping", "Blame-shifting",
    "Projection", "Deflection", "Stonewalling", "Silent Treatment", "Love-bombing",
    "Triangulation", "Smear Campaign", "Dehumanization", "Humiliation", "Threats",
    "Intimidation", "Fear Mongering", "Conditional Approval", "Praise Before Criticism",
    "Negative Labeling", "Name-Calling", "Catastrophizing", "Minimization", "Selective Memory",
    "Denial", "Withholding", "Interrupting", "Personal Attacks", "Character Assassination",
    "Scapegoating", "Whataboutism", "False Equivalence", "Logical Fallacies", "Framing",
    "Mind Reading", "Redirection", "Token Gesture", "Bait-and-Switch", "Foot-in-the-door",
    "Door-in-the-face", "Intermittent Reinforcement", "Emotional Blackmail", "Silent Rejection",
    "Emotional Withdrawal", "Negative Reinforcement", "Positive Reinforcement", "Reward-Punishment",
    "Love Withdrawal", "Time-Out/Walk Away", "Interpersonal Pressure", "Bandwagon Pressure",
    "Exaggeration", "Rationalization", "Justification", "Appeal to Authority", "Appeal to Fear",
    "Appeal to Spite", "Appeal to Ridicule", "Appeal to Tradition", "Appeal to Novelty",
    "Emotional Hijacking", "Emotional Overload", "Hoovering", "Future Faking", "Flying Monkeys",
    "Splitting", "Devaluation", "Idealization", "Grey Rock", "Mirroring", "Semantic Manipulation",
    "Doublespeak", "Euphemism", "Double Bind", "Backhanded Compliment", "Passive Aggression",
    "Gaslighting by Omission", "Gaslighting by Lying", "Gaslighting by Contradiction",
    "Moral Highground", "Scare Tactics", "Selective Disclosure", "Overgeneralization",
    "False Promise", "Stonewalling (silent refusal)", "Labeling Emotions", "Discrediting",
    "Emotional Flooding", "Minimizing Achievement", "Undermining", "Exclusion", "Isolation",
    "Triangulation via Rumors", "Conditional Love", "Vaporlighting", "Projection with Accusation",
    "Regressive Framing", "Defensive Hostility", "Divide and Conquer", "Intellectual Bullying",
    "Forced Apology", "Competitive One-Upmanship", "Dismissal", "Over-Responsibility Imposition",
    "Boundary Pushing", "Hostile Questioning"
  ];

  const systemPrompt = `
You are a Manipulation Analyst. When presented with a conversation,
your job is to scan each line for any of the following manipulation tactics:

${tactics.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Respond ONLY in this JSON format (no extra text):
{
  "tactics": [
    { "line": <lineNumber>, "tactic": "<tacticName>", "excerpt": "<exact text>" }
  ],
  "detected": <true|false>
}
If you find no tactics, return:
{
  "tactics": [],
  "detected": false
}
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: text }
      ],
      temperature: 0
    })
  });

  const payload = await response.json();

  if (!payload || !payload.choices || !payload.choices[0]) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Invalid response from OpenAI" })
    };
  }

  return {
    statusCode: 200,
    body: payload.choices[0].message.content
  };
};
