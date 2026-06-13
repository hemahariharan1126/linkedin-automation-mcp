import linkedin from "./src/linkedin-api.js";

const text = `Stop writing wrappers. Start building Agents. 🤖👇

If you're still mapping out every single step for your LLM, you're missing out on the autonomous revolution. Agent frameworks give your LLMs "hands" (tools) and "memory" (state) to loop until the problem is solved. 

I've put together a technical breakdown of the 3 frameworks powering 90% of enterprise AI agents today.

In the attached architecture guide, we cover:
1️⃣ LangGraph: The stateful, complex routing engine that handles cyclical data pipelines.
2️⃣ Microsoft AutoGen: The multi-agent debate swarm that natively executes code.
3️⃣ CrewAI: The corporate hierarchy simulator that cuts boilerplate code by 60%.

Which framework are you currently testing in your stack? Let me know in the comments! 

#AI #AIAgents #LangChain #AutoGen #CrewAI #SoftwareEngineering #Architecture #MachineLearning`;

const filePath = "C:\\Users\\harih\\Downloads\\LinkedIn_AI_Frameworks_Carousel.pptx";

async function post() {
  try {
    const result = await linkedin.createPost(text, [], filePath);
    console.log("Post successful:", JSON.stringify(result, null, 2));
  } catch(e) {
    console.error("Error:", e);
  }
}
post();