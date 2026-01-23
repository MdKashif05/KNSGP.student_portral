import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function listModels() {
  try {
    const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).countTokens("test"); 
    console.log("Model access check:", models);
  } catch (e) {
      console.log("Error accessing specific model directly, trying generic check...");
  }
}

// Since the node SDK might not have a direct listModels method exposed easily in all versions, 
// let's try to just hit the API or test a known working model.
// Actually, 'gemini-pro' is usually the standard. Let's try to revert to 'gemini-pro' but debug why it failed.
// Or try 'gemini-1.0-pro'.

console.log("Checking model availability...");
