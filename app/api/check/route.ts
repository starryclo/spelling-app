import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `당신은 대한민국 국립국어원 어문 규범에 정통한 한국어 교정 전문가입니다.
속기사가 실시간으로 받아 적은 문장을 교정하는 것이 목적이므로, 다음 기준을 엄격히 적용하세요.

- 맞춤법: 한글 맞춤법 규정에 어긋난 표기
- 띄어쓰기: 띄어쓰기 규정에 어긋난 부분
- 외래어: 외래어 표기법에 어긋난 표기 (예: 화이팅→파이팅, 컨텐츠→콘텐츠)

규칙:
1. 의미를 바꾸지 말고 표기/규범만 교정합니다.
2. 실제로 틀린 부분만 corrections 에 담습니다. 올바른 부분은 넣지 않습니다.
3. type 은 반드시 "맞춤법", "띄어쓰기", "외래어" 중 하나입니다.
4. explanation 은 왜 그렇게 고쳐야 하는지 한 문장으로 간결하게 설명합니다.
5. corrected 는 모든 교정을 반영한 전체 문장입니다. 틀린 곳이 없으면 원문과 동일하게 둡니다.`;

const REPORT_TOOL: Anthropic.Tool = {
  name: "report_corrections",
  description: "교정 결과를 구조화하여 보고합니다.",
  input_schema: {
    type: "object" as const,
    properties: {
      corrected: {
        type: "string",
        description: "모든 교정을 반영한 전체 문장",
      },
      hasErrors: {
        type: "boolean",
        description: "교정할 부분이 하나라도 있으면 true",
      },
      corrections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            original: { type: "string", description: "원문에서 틀린 표현" },
            suggestion: { type: "string", description: "올바른 표현" },
            type: {
              type: "string",
              enum: ["맞춤법", "띄어쓰기", "외래어"],
            },
            explanation: { type: "string", description: "교정 이유 (한 문장)" },
          },
          required: ["original", "suggestion", "type", "explanation"],
          additionalProperties: false,
        },
      },
    },
    required: ["corrected", "hasErrors", "corrections"],
    additionalProperties: false,
  },
};

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "서버에 ANTHROPIC_API_KEY 가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  let text: string;
  try {
    const body = await request.json();
    text = typeof body?.text === "string" ? body.text : "";
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  text = text.trim();
  if (!text) {
    return NextResponse.json({ error: "검사할 문장을 입력하세요." }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json(
      { error: "한 번에 검사할 수 있는 길이는 4000자까지입니다." },
      { status: 400 }
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `다음 문장을 어문 규범에 따라 교정해 주세요.\n\n"""${text}"""`,
        },
      ],
      tools: [REPORT_TOOL],
      tool_choice: { type: "tool", name: "report_corrections" },
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (!toolUse) {
      return NextResponse.json(
        { error: "교정 결과를 받지 못했습니다. 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    const result = toolUse.input as {
      corrected: string;
      hasErrors: boolean;
      corrections: {
        original: string;
        suggestion: string;
        type: "맞춤법" | "띄어쓰기" | "외래어";
        explanation: string;
      }[];
    };

    return NextResponse.json({ original: text, ...result });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "AI 인증에 실패했습니다. 서버의 API 키를 확인하세요." },
        { status: 502 }
      );
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "요청이 많습니다. 잠시 후 다시 시도해 주세요." },
        { status: 429 }
      );
    }
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json(
      { error: `교정 중 오류가 발생했습니다: ${message}` },
      { status: 502 }
    );
  }
}
