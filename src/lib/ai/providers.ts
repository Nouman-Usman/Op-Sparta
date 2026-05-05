import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export type Provider = "openai" | "google";
export type ModelType = "fast" | "quality" | "pro" | "flash" | string;

export function getModel(provider: Provider, type: ModelType, apiKey: string) {
  if (provider === "openai") {
    const openai = createOpenAI({ apiKey });
    
    // Determine primary based on type or specific model request
    let primary = "gpt-4o";

    if (type === "fast" || type === "gpt-4o-mini") {
      return openai("gpt-4o-mini");
    }

    if (type !== "quality" && type !== "pro") {
      primary = type;
    }

    return openai(primary);
  }

  if (provider === "google") {
    const google = createGoogleGenerativeAI({ apiKey });
    
    let primary = "gemini-3.1-pro-preview";

    if (type === "flash" || type === "gemini-3.1-flash-preview" || type === "gemini-2.0-flash" || type === "gemini-1.5-flash" || type === "gemini-1.5-flash-latest") {
      return google("gemini-3.1-flash-preview");
    }

    if (type === "pro" || type === "gemini-2.0-pro-exp" || type === "gemini-1.5-pro" || type === "gemini-1.5-pro-latest") {
      primary = "gemini-3.1-pro-preview";
    } else if (type !== "quality") {
      primary = type;
    }

    return google(primary);
  }

  throw new Error(`Provider ${provider} not supported`);
}

export function getVisionModel(provider: Provider, apiKey: string) {
  if (provider === "openai") {
    const openai = createOpenAI({ apiKey });
    return openai("gpt-4o");
  }
  if (provider === "google") {
    const google = createGoogleGenerativeAI({ apiKey });
    // Use 3.1 Pro Preview as primary for vision
    return google("gemini-3.1-pro-preview");
  }
  throw new Error(`Provider ${provider} not supported for vision`);
}


