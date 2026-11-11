import type Anthropic from "@anthropic-ai/sdk";
import { BrowserSession, GuardrailViolation, type PageObservation } from "./browser-session";
import type { Transcript } from "./transcript";

/**
 * Walk tools — the seam between the reasoning model and the browser.
 *
 * Definitions are plain Anthropic tool schemas; dispatch() executes them
 * against a BrowserSession and records every step (thought + screenshot)
 * into the Transcript. Designed so additional tool families (vendor MCP
 * tools, analytics lookups) can sit beside these in the same tools array
 * without changing the loop.
 */

const THOUGHT = {
  type: "string" as const,
  description:
    "Your first-person think-aloud narration BEFORE this action: what you see, what you expect, what confuses or reassures you.",
};

export const WALK_TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: "navigate",
    description: "Go to a URL on this website (address-bar navigation). Use links via click when possible — navigate is for going back to a known page.",
    input_schema: {
      type: "object",
      properties: { url: { type: "string" }, thought: THOUGHT },
      required: ["url", "thought"],
      additionalProperties: false,
    },
  },
  {
    name: "click",
    description: "Click an element. Use a selector from the element inventory in the latest observation.",
    input_schema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "CSS selector from the element inventory" },
        description: { type: "string", description: "What you believe you are clicking, in your own words" },
        thought: THOUGHT,
      },
      required: ["selector", "description", "thought"],
      additionalProperties: false,
    },
  },
  {
    name: "type_text",
    description: "Type into an input field. Use fake data (Alex Test / alex.test@example.com) — never real personal or payment details.",
    input_schema: {
      type: "object",
      properties: {
        selector: { type: "string" },
        text: { type: "string" },
        thought: THOUGHT,
      },
      required: ["selector", "text", "thought"],
      additionalProperties: false,
    },
  },
  {
    name: "scroll",
    description: "Scroll the page up or down by most of a screen, like a person skimming.",
    input_schema: {
      type: "object",
      properties: {
        direction: { type: "string", enum: ["up", "down"] },
        thought: THOUGHT,
      },
      required: ["direction", "thought"],
      additionalProperties: false,
    },
  },
  {
    name: "finish_walk",
    description: "End the walk when your task is complete OR when you would realistically give up.",
    input_schema: {
      type: "object",
      properties: {
        task_completed: { type: "boolean" },
        summary: {
          type: "string",
          description: "The whole experience in your own words: what went smoothly, where you struggled, how you feel about this site now.",
        },
        thought: THOUGHT,
      },
      required: ["task_completed", "summary", "thought"],
      additionalProperties: false,
    },
  },
];

export interface DispatchOutcome {
  /** Text observation returned to the model */
  text: string;
  /** Post-action screenshot (also saved to the transcript) */
  screenshot: Buffer | null;
  /** True when finish_walk was called */
  finished: boolean;
}

function formatObservation(obs: PageObservation): string {
  const elements = obs.elements
    .map(
      (e) =>
        `  ${e.tag}${e.inViewport ? "" : " (offscreen)"} [${e.selector}] "${e.text}"`
    )
    .join("\n");
  const position = obs.pageHeight > obs.viewportHeight
    ? `Scroll position: ${obs.scrollY}/${obs.pageHeight - obs.viewportHeight}px.`
    : "Whole page fits on one screen.";
  return `Now on: ${obs.title} (${obs.url})\n${position}\nInteractive elements:\n${elements}`;
}

export async function dispatchWalkTool(
  session: BrowserSession,
  transcript: Transcript,
  name: string,
  input: Record<string, unknown>
): Promise<DispatchOutcome> {
  const thought = String(input.thought ?? "");

  if (name === "finish_walk") {
    const summary = String(input.summary ?? "");
    const taskCompleted = Boolean(input.task_completed);
    const obs = await session.observe(0);
    transcript.addStep({
      action: name,
      input: { task_completed: taskCompleted },
      thought,
      url: obs.url,
      title: obs.title,
      screenshot: await session.screenshot(),
    });
    transcript.finish(summary, taskCompleted);
    return { text: "Walk finished. Thank you.", screenshot: null, finished: true };
  }

  let observation: string;
  let errorNote: string | undefined;

  try {
    switch (name) {
      case "navigate":
        await session.navigate(String(input.url));
        break;
      case "click":
        await session.click(String(input.selector));
        break;
      case "type_text":
        await session.typeText(String(input.selector), String(input.text));
        break;
      case "scroll":
        await session.scroll(input.direction === "up" ? "up" : "down");
        break;
      default:
        return { text: `Unknown tool: ${name}`, screenshot: null, finished: false };
    }
    observation = formatObservation(await session.observe());
  } catch (err) {
    // Errors are observations, not crashes: a failed click is exactly the
    // kind of thing a real user experiences. Guardrail refusals are surfaced
    // so the model changes course.
    errorNote =
      err instanceof GuardrailViolation
        ? `Action refused by walk rules: ${err.message}`
        : `That didn't work: ${err instanceof Error ? err.message.split("\n")[0] : String(err)}`;
    observation = `${errorNote}\n${formatObservation(await session.observe())}`;
  }

  const screenshot = await session.screenshot().catch(() => null);
  const obs = await session.observe(0);
  transcript.addStep({
    action: name,
    input: Object.fromEntries(Object.entries(input).filter(([k]) => k !== "thought")),
    thought,
    url: obs.url,
    title: obs.title,
    screenshot,
    observation: errorNote,
  });

  return { text: observation, screenshot, finished: false };
}
