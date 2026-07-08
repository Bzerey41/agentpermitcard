module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({
      message: "Agent Permit Card API is running. Send a POST request with { description }."
    });
  }

  try {
    const { description } = req.body || {};

    if (!description || description.trim().length < 10) {
      return res.status(400).json({
        error: "Please provide a longer agent description."
      });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You generate Agent Permit Cards for AI agents. " +
              "The user's description is the source of truth. " +
              "Do not force the agent into a generic template. " +
              "Do not add capabilities that the user did not state or strongly imply. " +
              "Prefer least privilege. " +
              "If something is unclear, put it in review_notes instead of inventing permissions. " +
              "Write concise, practical, product-ready text."
          },
          {
            role: "user",
            content:
              "Create an Agent Permit Card from this description:\n\n" +
              description
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "agent_permit_card",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                agent_name: {
                  type: "string"
                },
                purpose: {
                  type: "string"
                },
                can_do: {
                  type: "array",
                  items: {
                    type: "string"
                  }
                },
                needs_approval: {
                  type: "array",
                  items: {
                    type: "string"
                  }
                },
                cannot_do: {
                  type: "array",
                  items: {
                    type: "string"
                  }
                },
                data_access: {
                  type: "array",
                  items: {
                    type: "string"
                  }
                },
                logs: {
                  type: "array",
                  items: {
                    type: "string"
                  }
                },
                approval_rule: {
                  type: "string"
                },
                review_notes: {
                  type: "array",
                  items: {
                    type: "string"
                  }
                }
              },
              required: [
                "agent_name",
                "purpose",
                "can_do",
                "needs_approval",
                "cannot_do",
                "data_access",
                "logs",
                "approval_rule",
                "review_notes"
              ]
            }
          }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);

      return res.status(response.status).json({
        error: "OpenAI API request failed.",
        details: data
      });
    }

    const outputText = data.output_text;

    if (!outputText) {
      console.error("No output_text returned:", data);

      return res.status(500).json({
        error: "No structured output returned from OpenAI."
      });
    }

    const card = JSON.parse(outputText);

    return res.status(200).json(card);
  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Server error while generating the permit card."
    });
  }
};
