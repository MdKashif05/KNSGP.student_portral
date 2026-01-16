import app from "../server/app";
import { registerRoutes } from "../server/routes";

// Initialize routes once
const setup = async () => {
  await registerRoutes(app);
};

// Vercel Serverless Function Handler
export default async function handler(req: any, res: any) {
  await setup();
  // Forward request to Express app
  return app(req, res);
}
