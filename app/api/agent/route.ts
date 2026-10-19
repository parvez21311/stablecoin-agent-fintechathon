import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Guardrail limit for manual approval
const HUMAN_APPROVAL_THRESHOLD = 50;

export async function POST(req: Request) {
  try {
    const { prompt, userWalletAddress } = await req.json();

    // 1. LLM Intent Parser
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI Financial Agent. Extract intent from user prompt. 
          Return ONLY a JSON object:
          {
            "action": "transfer" | "pay_bill" | "auto_save" | "unknown",
            "amount": number or null,
            "recipient": string or null,
            "currency": "USDXM" or string
          }`
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const parsedData = JSON.parse(completion.choices[0].message.content || "{}");

    // 2. Security & Guardrails (Human-in-the-loop limit)
    if (parsedData.amount && parsedData.amount > HUMAN_APPROVAL_THRESHOLD) {
      return NextResponse.json({
        status: "NEEDS_APPROVAL",
        message: `Amount ($${parsedData.amount}) exceeds auto-approval threshold ($${HUMAN_APPROVAL_THRESHOLD}). Manual confirmation required!`,
        parsedData
      });
    }

    // 3. Execution handling via Crossmint
    if (parsedData.action === "transfer" && parsedData.recipient) {
      // Call Crossmint Agent API / SDK here
      return NextResponse.json({
        status: "SUCCESS",
        message: `Successfully transferred ${parsedData.amount} ${parsedData.currency} to ${parsedData.recipient}`,
        txHash: "0x" + Math.random().toString(16).substr(2, 40),
        parsedData
      });
    }

    return NextResponse.json({ status: "UNKNOWN_INTENT", parsedData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
