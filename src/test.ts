import { executeAgentWorkflow } from './agent/graph.ts';

async function runDemo() {
  console.log("Starting Computer Use Agent Demo");
  
  try {
    console.log("📝 Test Case 1: Search for Central Park in Google Maps");
    const result1 = await executeAgentWorkflow(
      "Open Google Maps and search for Central Park, New York",
      "demo_test_001"
    );
  }
  catch (error) {
    console.error("Error during demo execution:", error);
  }
};

// Configuration helper
function setupEnvironment() {
  console.log("🔧 Setting up environment variables...");
  // Set default values if not provided
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  process.env.OMNIPARSER_URL = process.env.OMNIPARSER_URL || 'http://localhost:8000';
  process.env.LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai';
  process.env.LLM_MODEL = process.env.LLM_MODEL || 'gpt-4';
  
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
    const { captureScreenshot } = await import('./services/screenshotService.ts');
    const screenshot = await captureScreenshot();
    // console.log(screenshot ? "✅ Screenshot service working" : "❌ Screenshot service failed");
    
    console.log("👁️  Testing Perception API...");
    const { callPerceptionApi } = await import('./services/perceptionAPI.ts');
    if (screenshot) {
      const perceptionResult = await callPerceptionApi(screenshot);
      console.log(perceptionResult.success ? 
        `✅ Perception API working (${perceptionResult.elements.length} elements detected)` : 
        "❌ Perception API failed"
      );
    }
    
  } catch (error) {
    console.error("❌ Component testing failed:", error);
  }
}

async function main() {
  setupEnvironment();
  await testIndividualComponents();
  // await runDemo();
}

main().catch(console.error);


export { runDemo, testIndividualComponents, setupEnvironment };