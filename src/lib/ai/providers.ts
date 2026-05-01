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
      pro: "gemini-2.5-pro",
      flash: "gemini-2.5-flash",
    };
    // @ts-ignore
    return google(models[type] || models.flash);
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
    return google("gemini-2.5-flash");
  }
  throw new Error(`Provider ${provider} not supported for vision`);
}
