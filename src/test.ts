import { captureScreenshot } from "./services/screenshotService";
import { callPerceptionApi } from "./services/perceptionAPI";
import path from "path";
import { fileURLToPath } from "url";

console.log(
  "Resolved perceptionAPI import:",
  import.meta.resolve("./services/perceptionAPI.ts")
);

function setupEnvironment() {
  console.log("🔧 Setting up environment variables...");
  // Set default values if not provided
  process.env.NODE_ENV = process.env.NODE_ENV || "development";
  process.env.OMNIPARSER_URL =
    process.env.OMNIPARSER_URL || "http://localhost:8000";
  process.env.LLM_PROVIDER = process.env.LLM_PROVIDER || "openai";
  process.env.LLM_MODEL = process.env.LLM_MODEL || "gpt-4";

  console.log(`- Environment: ${process.env.NODE_ENV}`);
  console.log(`- Omniparser URL: ${process.env.OMNIPARSER_URL}`);
  console.log(`- LLM Provider: ${process.env.LLM_PROVIDER}`);
  console.log(`- LLM Model: ${process.env.LLM_MODEL}`);
  console.log("");
}

async function testIndividualComponents() {
  console.log("🧪 Testing individual components...\n");

  try {
    // Test screenshot service
    console.log("📸 Testing Screenshot Service...");
    try {
      const screenshot = await captureScreenshot();
      console.log(
        screenshot
          ? "✅ Screenshot service working"
          : "❌ Screenshot service failed"
      );

      if (screenshot) {
        console.log("👁️  Testing Perception API...");
        const perceptionResult = await callPerceptionApi(screenshot);
        console.log(
          perceptionResult.success
            ? `✅ Perception API working (${perceptionResult.elements.length} elements detected)`
            : "❌ Perception API failed"
        );
      }
    } catch (error) {
      console.error(
        "❌ Screenshot/Perception test failed:",
        error instanceof Error ? error.message : error
      );
    }

    console.log("🤖 Testing LLM API...");
    try {
      const { callLLMApi } = await import("./services/llm/llmAPI");
      const testContext = {
        user_prompt:
          "You are in vscode, i want you to press inside the terminal, then type 'npm run dev' and press enter",
        current_elements: [],
        iteration_count: 1,
        previous_actions: [],
        test_id: "test_llm_001",
      };
      const actionPlan = await callLLMApi(testContext);
      console.log(
        actionPlan
          ? `✅ LLM API working (${actionPlan.actions.length} actions generated)`
          : "❌ LLM API failed"
      );
    } catch (error) {
      console.error(
        "❌ LLM API test failed:",
        error instanceof Error ? error.message : error
      );
    }
  } catch (error) {
    console.error("❌ Component testing failed:", error);
    throw error; // Re-throw to be caught by main
  }
}

async function main() {
  try {
    setupEnvironment();
    await testIndividualComponents();
    // await runDemo();
    console.log("\n✅ All tests completed");
  } catch (error) {
    console.error("\n❌ Test suite failed:", error);
    process.exit(1);
  }
}

main();

export { testIndividualComponents, setupEnvironment };
