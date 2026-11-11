import Anthropic from "@anthropic-ai/sdk";

/**
 * Task inference — derive the walk task from what the business is, so the
 * user never has to type one. The quick-read layer already detects the
 * industry; this turns that into "the thing a real visitor came to do."
 */

const TASK_MODEL = process.env.TASK_MODEL || "claude-sonnet-5";

const TASK_SCHEMA = {
  type: "object",
  properties: {
    task: {
      type: "string",
      description:
        "One concrete task a first-time visitor would come to this site to accomplish, " +
        "written in second person, ending with the safety boundary sentence.",
    },
  },
  required: ["task"],
  additionalProperties: false,
} as const;

const SAFETY_BOUNDARY =
  "Stop before submitting any personal contact details like email or phone — " +
  "you just want to see how far the process gets you.";

const FALLBACK_TASK =
  `You are a first-time visitor. Figure out what this site offers and try to complete ` +
  `the main action it is built around. ${SAFETY_BOUNDARY}`;

export async function inferWalkTask(
  url: string,
  pageType?: string,
  industry?: string
): Promise<string> {
  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: TASK_MODEL,
      max_tokens: 1000,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: TASK_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content:
            `A usability tester is about to visit ${url} for the first time.` +
            (pageType ? ` Page type: ${pageType}.` : "") +
            (industry ? ` Business: ${industry}.` : "") +
            `\n\nWrite the single most representative task a real visitor comes to this site to do — ` +
            `the money path (get a quote, reach checkout, start a signup), not a browsing errand. ` +
            `Second person, one or two sentences, concrete enough to attempt. ` +
            `End with exactly this sentence: "${SAFETY_BOUNDARY}"`,
        },
      ],
    } as Anthropic.MessageCreateParamsNonStreaming);

    const block = response.content.find((b) => b.type === "text");
    if (block && block.type === "text") {
      const parsed = JSON.parse(block.text) as { task: string };
      if (parsed.task && parsed.task.length > 20) return parsed.task;
    }
  } catch (err) {
    console.error("[task-inference] Falling back to generic task:", err);
  }
  return FALLBACK_TASK;
}
