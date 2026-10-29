import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AffectedEntitySchema, ChangeOperationTypeSchema } from '@/schemas/ai.schema';

const RequestSchema = z.object({
  eventState: z.object({
    profile: z.object({
      id: z.string().min(1).max(100),
      name: z.string().min(1).max(200),
      type: z.string().min(1).max(50),
      date: z.string().date(),
      guestCount: z.number().finite().int().nonnegative().max(1_000_000),
      totalBudget: z.number().finite().int().nonnegative().max(1_000_000_000_000),
      currency: z.string().length(3),
      city: z.string().min(1).max(100),
    }),
    budgetSummary: z.object({
      totalBudget: z.number(),
      allocations: z.array(z.object({
        categoryId: z.string(),
        plannedAmount: z.number(),
        actualAmount: z.number(),
      })),
    }).optional(),
    taskSummary: z.object({
      totalTasks: z.number(),
      completedTasks: z.number(),
      overdueTasks: z.number(),
    }).optional(),
  }),
  userMessage: z.string().min(1).max(2000),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(4000),
    timestamp: z.string().datetime(),
  })).max(10),
});

const AiResponseSchema = z.object({
  explanation: z.string(),
  requiresConfirmation: z.boolean().default(true),
  followUpQuestion: z.string().nullable().optional(),
  operations: z.array(z.object({
    type: ChangeOperationTypeSchema,
    entityId: z.string().nullable().optional(),
    field: z.string().nullable().optional(),
    newValue: z.unknown(),
    reason: z.string(),
  })).default([]),
  affectedEntities: z.array(
    AffectedEntitySchema.extend({ isHighImpact: z.boolean().default(false) }),
  ).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get('content-length') ?? 0);
    if (contentLength > 256_000) {
      return NextResponse.json({ error: 'Request body is too large', isLocalFallback: false }, { status: 413 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON', isLocalFallback: false }, { status: 400 });
    }

    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', isLocalFallback: false }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        isLocalFallback: true,
        explanation: 'No API key configured — using local planning engine.',
        changeSet: null,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? 'gemini-1.5-flash',
    });

    const systemPrompt = buildSystemPrompt(parsed.data.eventState);
    const userPrompt = parsed.data.userMessage;
    const conversationHistory = parsed.data.conversationHistory;

    const history = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history });

    const fullPrompt = `${systemPrompt}\n\nUser request: ${userPrompt}\n\nRespond with a JSON object matching this schema:
{
  "explanation": "string - human-readable explanation of what you recommend",
  "requiresConfirmation": boolean,
  "followUpQuestion": "string or null",
  "operations": [
    {
      "type": "one of: update-budget, update-task, update-vendor, update-event-profile, update-guest-count, update-event-date, update-dietary, update-theme, add-task, remove-task, rebalance-budget",
      "entityId": "string or null",
      "field": "string or null",
      "newValue": "any value",
      "reason": "string - why this change is recommended"
    }
  ],
  "affectedEntities": [
    {
      "entityType": "budget | task | vendor | guest | risk | runofshow | event-profile",
      "entityName": "string",
      "changeDescription": "string",
      "isHighImpact": boolean
    }
  ]
}

IMPORTANT: Only suggest operations that are explicitly supported. Never suggest arbitrary code execution. Keep operations factual and based on the event data provided.`;

    const result = await chat.sendMessage(fullPrompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        isLocalFallback: true,
        explanation: 'AI response could not be validated. Using the local planning engine.',
        changeSet: null,
      });
    }

    const aiData = JSON.parse(jsonMatch[0]);
    const validated = AiResponseSchema.safeParse(aiData);

    if (!validated.success) {
      return NextResponse.json({
        isLocalFallback: true,
        explanation: 'AI response did not match MOMENTRA’s safety schema. Using the local planning engine.',
        changeSet: null,
      });
    }

    const { v4: uuidv4 } = await import('uuid');

    const changeSet = {
      id: uuidv4(),
      userRequest: parsed.data.userMessage,
      operations: validated.data.operations.map(op => ({
        type: op.type,
        entityId: op.entityId ?? undefined,
        field: op.field ?? undefined,
        newValue: op.newValue,
        reason: op.reason,
      })),
      summary: validated.data.explanation,
      requiresConfirmation: validated.data.requiresConfirmation,
      affectedEntities: validated.data.affectedEntities.map(e => ({
        entityType: e.entityType,
        entityName: e.entityName,
        changeDescription: e.changeDescription,
        isHighImpact: e.isHighImpact,
      })),
      generatedBy: 'gemini' as const,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      isLocalFallback: false,
      explanation: validated.data.explanation,
      followUpQuestion: validated.data.followUpQuestion ?? null,
      changeSet,
    });

  } catch (error) {
    console.error('Copilot API error:', error instanceof Error ? error.message : 'Unknown error');

    return NextResponse.json({
      isLocalFallback: true,
      explanation: 'AI service temporarily unavailable. Using local planning engine.',
      changeSet: null,
    }, { status: 200 });
  }
}

function buildSystemPrompt(eventState: z.infer<typeof RequestSchema>['eventState']): string {
  return `You are MOMENTRA's AI planning copilot, helping plan a ${eventState.profile.type} called "${eventState.profile.name}" on ${eventState.profile.date} in ${eventState.profile.city} for ${eventState.profile.guestCount} guests with a budget of ${eventState.profile.currency} ${eventState.profile.totalBudget}.

You help users update their event plan by suggesting specific, structured changes. You:
- Suggest realistic, conservative changes based on the event data
- Never fabricate vendor names, prices, or availability
- Identify which parts of the plan are affected by requested changes
- Ask for clarification when a request is ambiguous
- Flag high-impact changes that need user confirmation

You have access to the following event summary:
${JSON.stringify(eventState, null, 2).substring(0, 2000)}`;
}
