import Anthropic from "@anthropic-ai/sdk";
import { BrowserSession, DEFAULT_GUARDRAILS, type SessionGuardrails } from "./browser-session";
import { Transcript, type WalkResult } from "./transcript";
import { PERSONAS, buildWalkerSystemPrompt, type Persona } from "./personas";
import { WALK_TOOL_DEFINITIONS, dispatchWalkTool } from "./tools";

/**
 * Walk runner — orchestrates a persona walk.
 *
 * Two drivers share the same session/transcript/tools plumbing:
 *  - runScriptedWalk: deterministic action list. Used for harness testing
 *    (no AI tokens) and as the regression test for the browser mechanics.
 *  - runLlmWalk: the real thing. A manual tool loop (chosen over the SDK
 *    tool runner because tool results here carry image blocks — the model
 *    must SEE the page after every action).
 */

// Walker default: Sonnet-tier — walking is action-heavy, not insight-heavy
// (docs/03 §3). Override with WALK_MODEL.
const WALK_MODEL = process.env.WALK_MODEL || "claude-sonnet-5";

export interface WalkOptions {
  startUrl: string;
  task: string;
  persona?: Persona;
  guardrails?: SessionGuardrails;
  model?: string;
  /** Max LLM loop iterations (independent of the session's action budget) */
  maxTurns?: number;
}

// ─── Scripted driver (no AI) ───────────────────────────────────────

export interface ScriptedAction {
  tool: string;
  input: Record<string, unknown>;
}

export async function runScriptedWalk(
  opts: WalkOptions,
  actions: ScriptedAction[]
): Promise<WalkResult> {
  const persona = opts.persona ?? PERSONAS["busy-professional"];
  const session = await BrowserSession.launch(opts.startUrl, opts.guardrails ?? DEFAULT_GUARDRAILS);
  const transcript = new Transcript({
    personaId: persona.id,
    task: opts.task,
    startUrl: opts.startUrl,
  });

  try {
    for (const action of actions) {
      const outcome = await dispatchWalkTool(session, transcript, action.tool, action.input);
      if (outcome.finished) break;
    }
    if (transcript.data.finishedAt === null) {
      transcript.finish("(scripted walk ended without finish_walk)", false);
    }
    return transcript.data;
  } finally {
    await session.close();
  }
}

// ─── LLM driver ────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type CacheableBlock = { cache_control?: { type: "ephemeral" } };

/**
 * Move the cache breakpoint to the newest user message. The walk history —
 * every prior screenshot included — is identical from turn to turn, so each
 * call re-reads it at cached-input rates (~10x cheaper) instead of full price.
 */
function moveCacheBreakpoint(messages: Anthropic.MessageParam[]): void {
  for (const msg of messages) {
    if (msg.role !== "user" || !Array.isArray(msg.content)) continue;
    for (const block of msg.content) delete (block as CacheableBlock).cache_control;
  }
  const last = messages[messages.length - 1];
  if (last?.role === "user" && Array.isArray(last.content) && last.content.length > 0) {
    (last.content[last.content.length - 1] as CacheableBlock).cache_control = {
      type: "ephemeral",
    };
  }
}

export async function runLlmWalk(opts: WalkOptions): Promise<WalkResult> {
  const persona = opts.persona ?? PERSONAS["busy-professional"];
  const model = opts.model || WALK_MODEL;
  const maxTurns = opts.maxTurns ?? 30;

  const session = await BrowserSession.launch(opts.startUrl, opts.guardrails ?? DEFAULT_GUARDRAILS);
  const transcript = new Transcript({
    personaId: persona.id,
    task: opts.task,
    startUrl: opts.startUrl,
  });

  try {
    // Opening observation: the persona "arrives" at the page
    const firstShot = await session.screenshot();
    const firstObs = await session.observe();

    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: [
          { type: "text", text: "You have just arrived at the website. Here is what you see:" },
          {
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: firstShot.toString("base64") },
          },
          {
            type: "text",
            text: `Page: ${firstObs.title} (${firstObs.url})\nInteractive elements:\n${firstObs.elements
              .map((e) => `  ${e.tag} [${e.selector}] "${e.text}"`)
              .join("\n")}\n\nBegin your task. Think aloud in every tool call.`,
          },
        ],
      },
    ];

    for (let turn = 0; turn < maxTurns; turn++) {
      moveCacheBreakpoint(messages);
      const stream = anthropic.messages.stream({
        model,
        max_tokens: 4000,
        thinking: { type: "adaptive" },
        system: [
          {
            type: "text",
            text: buildWalkerSystemPrompt(persona, opts.task, opts.startUrl),
            cache_control: { type: "ephemeral" },
          },
        ],
        tools: WALK_TOOL_DEFINITIONS,
        messages,
      } as Anthropic.MessageStreamParams);
      const response = await stream.finalMessage();

      if (response.stop_reason !== "tool_use") break;

      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      let finished = false;

      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        const outcome = await dispatchWalkTool(
          session,
          transcript,
          block.name,
          block.input as Record<string, unknown>
        );

        const resultContent: Anthropic.ToolResultBlockParam["content"] = outcome.screenshot
          ? [
              { type: "text", text: outcome.text },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: outcome.screenshot.toString("base64"),
                },
              },
            ]
          : [{ type: "text", text: outcome.text }];

        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: resultContent });
        if (outcome.finished) finished = true;
      }

      messages.push({ role: "user", content: toolResults });
      if (finished) break;
    }

    if (transcript.data.finishedAt === null) {
      transcript.finish("(walk ended without finish_walk — turn budget reached)", false);
    }
    return transcript.data;
  } finally {
    await session.close();
  }
}
