import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export type Provider = "openai" | "google";
export type ModelType = "fast" | "quality" | "pro" | "flash";

export function getModel(provider: Provider, type: ModelType, apiKey: string) {
  if (provider === "openai") {
    const openai = createOpenAI({ apiKey });
    const models = {
      fast: "gpt-4o-mini",
      quality: "gpt-4o",
    };
    // @ts-ignore
    return openai(models[type] || models.fast);
  }

  if (provider === "google") {
    const google = createGoogleGenerativeAI({ apiKey });
    const models = {
      pro: "gemini-1.5-pro-latest",
      flash: "gemini-1.5-flash-latest",
    };
    // @ts-ignore
    return google(models[type] || models.flash);
  }

  throw new Error(`Provider ${provider} not supported`);
}
