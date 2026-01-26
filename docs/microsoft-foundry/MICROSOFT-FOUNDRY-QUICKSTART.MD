# Microsoft Foundry Quickstart

<Callout type="note">
  This document refers to the [Microsoft Foundry (classic)](../what-is-foundry#microsoft-foundry-portals) portal.

  🔄 [Switch to the Microsoft Foundry (new) documentation](?view=foundry\&preserve-view=true) if you're using the new portal.
</Callout>

<Callout type="note">
  This document refers to the [Microsoft Foundry (new)](../what-is-foundry#microsoft-foundry-portals) portal.
</Callout>

In this quickstart, you use [Microsoft Foundry](https://ai.azure.com/?cid=learnDocs) to interact with a Foundry model, create, and chat with an agent.

## Prerequisites

* A model deployed in Microsoft Foundry. If you don't have a model, first complete [Quickstart: Set up Microsoft Foundry resources](../tutorials/quickstart-create-foundry-resources).
* The required language runtimes, global tools, and Visual Studio Code extensions as described in [Prepare your development environment](../how-to/develop/install-cli-sdk).

## Set environment variables and get the code

Store [your project endpoint](../tutorials/quickstart-create-foundry-resources#get-your-project-connection-details) as an environment variable. Also set these values for use in your scripts.

```plaintext
PROJECT_ENDPOINT=<endpoint copied from welcome screen>
AGENT_NAME="MyAgent"
MODEL_DEPLOYMENT_NAME="gpt-4.1-mini"
```

<Tabs>
  <Tab title="Python">
    Follow along below or get the code:

    <Callout type="nextstepaction">
      [Get the code](https://github.com/azure-ai-foundry/foundry-samples/tree/main/samples/python/quickstart)
    </Callout>

    Sign in using the CLI `az login` command to authenticate before running your Python scripts.
  </Tab>

  <Tab title="C#">
    Follow along below or get the code:

    <Callout type="nextstepaction">
      [Get the code](https://github.com/azure-ai-foundry/foundry-samples/tree/main/samples/csharp/quickstart)
    </Callout>

    Sign in using the CLI `az login` command to authenticate before running your C# scripts.
  </Tab>

  <Tab title="TypeScript">
    Follow along below or get the code:

    <Callout type="nextstepaction">
      [Get the code](https://github.com/azure-ai-foundry/foundry-samples/tree/main/samples/typescript/quickstart/src)
    </Callout>

    Sign in using the CLI `az login` command to authenticate before running your TypeScript scripts.
  </Tab>

  <Tab title="Java">
    Follow along below or get the code:

    <Callout type="nextstepaction">
      [Get the code](https://github.com/azure-ai-foundry/foundry-samples/tree/main/samples/java/quickstart/src/main/java/com/microsoft/foundry/samples/)
    </Callout>

    Sign in using the CLI `az login` command to authenticate before running your Java scripts.
  </Tab>

  <Tab title="REST API">
    Follow along below or get the code:

    <Callout type="nextstepaction">
      [Get the code](https://github.com/azure-ai-foundry/foundry-samples/tree/main/samples/microsoft/REST/mslearn-resources/quickstart).
    </Callout>

    1. Sign in using the CLI `az login` command to authenticate before running the next command.

    2. Get a temporary access token. It will expire in 60-90 minutes, you'll need to refresh after that.

       ```azurecli
       az account get-access-token --scope https://ai.azure.com/.default
       ```

    3. Save the results as the environment variable `AZURE_AI_AUTH_TOKEN`.
  </Tab>

  <Tab title="Foundry portal">
    No code is necessary when using the Foundry portal.
  </Tab>
</Tabs>

## Install and authenticate

Make sure you install the correct preview/prerelease version of the packages as shown here.

<Tabs>
  <Tab title="Python">
    1. Install these packages, including the preview version of `azure-ai-projects`. This version uses the **Foundry projects (new) API** (preview).

       ```
       pip install azure-ai-projects --pre
       pip install openai azure-identity python-dotenv
       ```

    2. Sign in using the CLI `az login` command to authenticate before running your Python scripts.
  </Tab>

  <Tab title="C#">
    1. Install packages:

       Add NuGet packages using the .NET CLI in the integrated terminal: These packages use the **Foundry projects (new) API** (preview).

       ```bash
       dotnet add package Azure.AI.Projects --prerelease
       dotnet add package Azure.AI.Projects.OpenAI --prerelease
       dotnet add package Azure.Identity
       ```

    2. Sign in using the CLI `az login` command to authenticate before running your C# scripts.
  </Tab>

  <Tab title="TypeScript">
    1. Install these packages, including the preview version of `@azure/ai-projects`. This version uses the **Foundry projects (new) API** (preview).:

       ```bash
       npm install @azure/ai-projects@beta @azure/identity dotenv
       ```

    2. Sign in using the CLI `az login` command to authenticate before running your TypeScript scripts.
  </Tab>

  <Tab title="Java">
    1. Sign in using the CLI `az login` command to authenticate before running your Java scripts.
  </Tab>

  <Tab title="REST API">
    1. Sign in using the CLI `az login` command to authenticate before running the next command.

    2. Get a temporary access token. It will expire in 60-90 minutes, you'll need to refresh after that.

       ```azurecli
       az account get-access-token --scope https://ai.azure.com/.default
       ```

    3. Save the results as the environment variable `AZURE_AI_AUTH_TOKEN`.
  </Tab>

  <Tab title="Foundry portal">
    No installation is necessary to use the Foundry portal.
  </Tab>
</Tabs>

<Callout type="tip">
  Code uses **Azure AI Projects 2.x (preview)** and is incompatible with Azure AI Projects 1.x. [Switch to Foundry (classic) documentation](?view=foundry-classic\&preserve-view=true) for the Azure AI Projects 1.x GA version.
</Callout>

## Chat with a model

Interacting with a model is the basic building block of AI applications. Send an input and receive a response from the model:

<Tabs>
  <Tab title="Python">
    ```python
    import os
    from dotenv import load_dotenv
    from azure.identity import DefaultAzureCredential
    from azure.ai.projects import AIProjectClient

    load_dotenv()

    print(f"Using PROJECT_ENDPOINT: {os.environ['PROJECT_ENDPOINT']}")
    print(f"Using MODEL_DEPLOYMENT_NAME: {os.environ['MODEL_DEPLOYMENT_NAME']}")

    project_client = AIProjectClient(
        endpoint=os.environ["PROJECT_ENDPOINT"],
        credential=DefaultAzureCredential(),
    )

    openai_client = project_client.get_openai_client()

    response = openai_client.responses.create(
        model=os.environ["MODEL_DEPLOYMENT_NAME"],
        input="What is the size of France in square miles?",
    )
    print(f"Response output: {response.output_text}")
    ```
  </Tab>

  <Tab title="C#">
    ```csharp
    using Azure.AI.Projects;
    using Azure.AI.Projects.OpenAI;
    using Azure.Identity;
    using OpenAI;
    using OpenAI.Responses;

    #pragma warning disable OPENAI001

    string projectEndpoint  = Environment.GetEnvironmentVariable("PROJECT_ENDPOINT")
        ?? throw new InvalidOperationException("Missing environment variable 'PROJECT_ENDPOINT'");
    string modelDeploymentName  = Environment.GetEnvironmentVariable("MODEL_DEPLOYMENT_NAME")
        ?? throw new InvalidOperationException("Missing environment variable 'MODEL_DEPLOYMENT_NAME'");

    AIProjectClient projectClient = new(new Uri(projectEndpoint ), new AzureCliCredential());

    ProjectResponsesClient responseClient = projectClient.OpenAI.GetProjectResponsesClientForModel(modelDeploymentName);
    ResponseResult response = await responseClient.CreateResponseAsync("What is the size of France in square miles?");

    Console.WriteLine(response.GetOutputText());
    ```
  </Tab>

  <Tab title="TypeScript">
    ```typescript
    import { DefaultAzureCredential } from "@azure/identity";
    import { AIProjectClient } from "@azure/ai-projects";
    import "dotenv/config";

    const projectEndpoint = process.env["PROJECT_ENDPOINT"] || "<project endpoint>";
    const deploymentName = process.env["MODEL_DEPLOYMENT_NAME"] || "<model deployment name>";

    async function main(): Promise<void> {
        const project = new AIProjectClient(projectEndpoint, new DefaultAzureCredential());
        const openAIClient = await project.getOpenAIClient();
        const response = await openAIClient.responses.create({
            model: deploymentName,
            input: "What is the size of France in square miles?",
        });
        console.log(`Response output: ${response.output_text}`);
    }

    main().catch(console.error);
    ```
  </Tab>

  <Tab title="Java">
    ```java
    package com.azure.ai.agents;

    import com.azure.core.util.Configuration;
    import com.azure.identity.DefaultAzureCredentialBuilder;
    import com.openai.models.responses.Response;
    import com.openai.models.responses.ResponseCreateParams;

    public class CreateResponse {
        public static void main(String[] args) {
            String endpoint = Configuration.getGlobalConfiguration().get("PROJECT_ENDPOINT");
            String model = Configuration.getGlobalConfiguration().get("MODEL_DEPLOYMENT_NAME");
            // Code sample for creating a response
            ResponsesClient responsesClient = new AgentsClientBuilder()
                    .credential(new DefaultAzureCredentialBuilder().build())
                    .endpoint(endpoint)
                    .serviceVersion(AgentsServiceVersion.V2025_11_15_PREVIEW)
                    .buildResponsesClient();

            ResponseCreateParams responseRequest = new ResponseCreateParams.Builder()
                    .input("Hello, how can you help me?")
                    .model(model)
                    .build();

            Response response = responsesClient.getResponseService().create(responseRequest);

            System.out.println("Response ID: " + response.id());
            System.out.println("Response Model: " + response.model());
            System.out.println("Response Created At: " + response.createdAt());
            System.out.println("Response Output: " + response.output());
        }
    }
    ```
  </Tab>

  <Tab title="REST API">
    Replace `YOUR-FOUNDRY-RESOURCE-NAME` with your values:

    ```console
    curl -X POST https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR-PROJECT-NAME/openai/responses?api-version=2025-11-15-preview \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AZURE_AI_AUTH_TOKEN" \
    -d '{
            "model": "gpt-4.1-mini",
            "input": "What is the size of France in square miles?"
    }'
    ```
  </Tab>

  <Tab title="Foundry portal">
    1. After the model deploys, you're automatically moved from **Home** to the **Build** section. Your new model is selected and ready for you to try out.

    2. Start chatting with your model, for example, "Write me a poem about flowers."
  </Tab>
</Tabs>

<Callout type="tip">
  Code uses **Azure AI Projects 2.x (preview)** and is incompatible with Azure AI Projects 1.x. [Switch to Foundry (classic) documentation](?view=foundry-classic\&preserve-view=true) for the Azure AI Projects 1.x GA version.
</Callout>

## Create an agent

Create an agent using your deployed model.

An agent defines core behavior. Once created, it ensures consistent responses in user interactions without repeating instructions each time. You can update or delete agents anytime.

<Tabs>
  <Tab title="Python">
    ```python
    import os
    from dotenv import load_dotenv
    from azure.identity import DefaultAzureCredential
    from azure.ai.projects import AIProjectClient
    from azure.ai.projects.models import PromptAgentDefinition

    load_dotenv()

    project_client = AIProjectClient(
        endpoint=os.environ["PROJECT_ENDPOINT"],
        credential=DefaultAzureCredential(),
    )

    agent = project_client.agents.create_version(
        agent_name=os.environ["AGENT_NAME"],
        definition=PromptAgentDefinition(
            model=os.environ["MODEL_DEPLOYMENT_NAME"],
            instructions="You are a helpful assistant that answers general questions",
        ),
    )
    print(f"Agent created (id: {agent.id}, name: {agent.name}, version: {agent.version})")
    ```
  </Tab>

  <Tab title="C#">
    ```csharp
    using Azure.AI.Projects;
    using Azure.AI.Projects.OpenAI;
    using Azure.Identity;

    string projectEndpoint = Environment.GetEnvironmentVariable("PROJECT_ENDPOINT")
        ?? throw new InvalidOperationException("Missing environment variable 'PROJECT_ENDPOINT'");
    string modelDeploymentName = Environment.GetEnvironmentVariable("MODEL_DEPLOYMENT_NAME")
        ?? throw new InvalidOperationException("Missing environment variable 'MODEL_DEPLOYMENT_NAME'");
    string agentName = Environment.GetEnvironmentVariable("AGENT_NAME")
        ?? throw new InvalidOperationException("Missing environment variable 'AGENT_NAME'");

    AIProjectClient projectClient = new(new Uri(projectEndpoint), new AzureCliCredential());

    AgentDefinition agentDefinition = new PromptAgentDefinition(modelDeploymentName)
    {
        Instructions = "You are a helpful assistant that answers general questions",
    };

    AgentVersion newAgentVersion = projectClient.Agents.CreateAgentVersion(
        agentName,
        options: new(agentDefinition));

    List<AgentVersion> agentVersions = projectClient.Agents.GetAgentVersions(agentName);
    foreach (AgentVersion agentVersion in agentVersions)
    {
        Console.WriteLine($"Agent: {agentVersion.Id}, Name: {agentVersion.Name}, Version: {agentVersion.Version}");
    }
    ```
  </Tab>

  <Tab title="TypeScript">
    ```typescript
    import { DefaultAzureCredential } from "@azure/identity";
    import { AIProjectClient } from "@azure/ai-projects";
    import "dotenv/config";

    const projectEndpoint = process.env["PROJECT_ENDPOINT"] || "<project endpoint>";
    const deploymentName = process.env["MODEL_DEPLOYMENT_NAME"] || "<model deployment name>";

    async function main(): Promise<void> {
        const project = new AIProjectClient(projectEndpoint, new DefaultAzureCredential());
        const agent = await project.agents.createVersion("my-agent-basic", {
            kind: "prompt",
            model: deploymentName,
            instructions: "You are a helpful assistant that answers general questions",
      });
      console.log(`Agent created (id: ${agent.id}, name: ${agent.name}, version: ${agent.version})`);
    }

    main().catch(console.error);
    ```
  </Tab>

  <Tab title="Java">
    ```java
    package com.azure.ai.agents;

    import com.azure.ai.agents.models.AgentVersionDetails;
    import com.azure.ai.agents.models.PromptAgentDefinition;
    import com.azure.core.util.Configuration;
    import com.azure.identity.DefaultAzureCredentialBuilder;

    public class CreateAgent {
        public static void main(String[] args) {
            String endpoint = Configuration.getGlobalConfiguration().get("PROJECT_ENDPOINT");
            String model = Configuration.getGlobalConfiguration().get("MODEL_DEPLOYMENT_NAME");
            // Code sample for creating an agent
            AgentsClient agentsClient = new AgentsClientBuilder()
                    .credential(new DefaultAzureCredentialBuilder().build())
                    .endpoint(endpoint)
                    .buildAgentsClient();

            PromptAgentDefinition request = new PromptAgentDefinition(model);
            AgentVersionDetails agent = agentsClient.createAgentVersion("MyAgent", request);

            System.out.println("Agent ID: " + agent.getId());
            System.out.println("Agent Name: " + agent.getName());
            System.out.println("Agent Version: " + agent.getVersion());
        }
    }
    ```
  </Tab>

  <Tab title="REST API">
    Replace `YOUR-FOUNDRY-RESOURCE-NAME` with your values:

    ```console
    curl -X POST https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR-PROJECT-NAME/agents?api-version=2025-11-15-preview \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AZURE_AI_AUTH_TOKEN" \
      -d '{
            "name": "MyAgent",
            "definition": {
                "kind": "prompt",
                "model": "gpt-4.1-mini", 
                "instructions": "You are a helpful assistant that answers general questions"
            }
        }'
    ```
  </Tab>

  <Tab title="Foundry portal">
    Now create an agent and interact with it.

    1. Still in the **Build** section, select **Agents** in the left pane.
    2. Select **Create agent** and give it a name.
  </Tab>
</Tabs>

<Callout type="tip">
  Code uses **Azure AI Projects 2.x (preview)** and is incompatible with Azure AI Projects 1.x. [Switch to Foundry (classic) documentation](?view=foundry-classic\&preserve-view=true) for the Azure AI Projects 1.x GA version.
</Callout>

## Chat with an agent

Use the previously created agent named "MyAgent" to interact by asking a question and a related follow-up. The conversation maintains history across these interactions.

<Tabs>
  <Tab title="Python">
    ```python
    import os
    from dotenv import load_dotenv
    from azure.identity import DefaultAzureCredential
    from azure.ai.projects import AIProjectClient

    load_dotenv()

    project_client = AIProjectClient(
        endpoint=os.environ["PROJECT_ENDPOINT"],
        credential=DefaultAzureCredential(),
    )

    agent_name = os.environ["AGENT_NAME"]
    openai_client = project_client.get_openai_client()

    # Optional Step: Create a conversation to use with the agent
    conversation = openai_client.conversations.create()
    print(f"Created conversation (id: {conversation.id})")

    # Chat with the agent to answer questions
    response = openai_client.responses.create(
        conversation=conversation.id, #Optional conversation context for multi-turn
        extra_body={"agent": {"name": agent_name, "type": "agent_reference"}},
        input="What is the size of France in square miles?",
    )
    print(f"Response output: {response.output_text}")

    # Optional Step: Ask a follow-up question in the same conversation
    response = openai_client.responses.create(
        conversation=conversation.id,
        extra_body={"agent": {"name": agent_name, "type": "agent_reference"}},
        input="And what is the capital city?",
    )
    print(f"Response output: {response.output_text}")
    ```
  </Tab>

  <Tab title="C#">
    ```csharp
    using Azure.AI.Projects;
    using Azure.AI.Projects.OpenAI;
    using Azure.Identity;
    using OpenAI.Responses;

    #pragma warning disable OPENAI001

    string projectEndpoint = Environment.GetEnvironmentVariable("PROJECT_ENDPOINT")
        ?? throw new InvalidOperationException("Missing environment variable 'PROJECT_ENDPOINT'");
    string modelDeploymentName = Environment.GetEnvironmentVariable("MODEL_DEPLOYMENT_NAME")
        ?? throw new InvalidOperationException("Missing environment variable 'MODEL_DEPLOYMENT_NAME'");
    string agentName = Environment.GetEnvironmentVariable("AGENT_NAME")
        ?? throw new InvalidOperationException("Missing environment variable 'AGENT_NAME'");

    AIProjectClient projectClient = new(new Uri(projectEndpoint), new AzureCliCredential());

    // Optional Step: Create a conversation to use with the agent
    ProjectConversation conversation = projectClient.OpenAI.Conversations.CreateProjectConversation();

    ProjectResponsesClient responsesClient = projectClient.OpenAI.GetProjectResponsesClientForAgent(
        defaultAgent: agentName,
        defaultConversationId: conversation.Id);

    // Chat with the agent to answer questions
    ResponseResult response = responsesClient.CreateResponse("What is the size of France in square miles?");
    Console.WriteLine(response.GetOutputText());

    // Optional Step: Ask a follow-up question in the same conversation
    response = responsesClient.CreateResponse("And what is the capital city?");
    Console.WriteLine(response.GetOutputText());
    ```
  </Tab>

  <Tab title="TypeScript">
    ```typescript
    import { DefaultAzureCredential } from "@azure/identity";
    import { AIProjectClient } from "@azure/ai-projects";
    import "dotenv/config";

    const projectEndpoint = process.env["PROJECT_ENDPOINT"] || "<project endpoint>";
    const deploymentName = process.env["MODEL_DEPLOYMENT_NAME"] || "<model deployment name>";

    async function main(): Promise<void> {
        const project = new AIProjectClient(projectEndpoint, new DefaultAzureCredential());
        const openAIClient = await project.getOpenAIClient();
        const response = await openAIClient.responses.create({
            model: deploymentName,
            input: "What is the size of France in square miles?",
        });
        const response2 = await openAIClient.responses.create({
            model: deploymentName,
            input: "And what is the capital city?",
            previous_response_id: response.id,
        });
        console.log(`Response output: ${response2.output_text}`);
    };

    main().catch(console.error);
    ```
  </Tab>

  <Tab title="Java">
    ```java
    package com.azure.ai.agents;

    import com.azure.ai.agents.models.AgentReference;
    import com.azure.ai.agents.models.AgentVersionDetails;
    import com.azure.ai.agents.models.PromptAgentDefinition;
    import com.azure.identity.AuthenticationUtil;
    import com.azure.identity.DefaultAzureCredentialBuilder;
    import com.openai.azure.AzureOpenAIServiceVersion;
    import com.openai.azure.AzureUrlPathMode;
    import com.openai.client.OpenAIClient;
    import com.openai.client.okhttp.OpenAIOkHttpClient;
    import com.openai.credential.BearerTokenCredential;
    import com.openai.models.conversations.Conversation;
    import com.openai.models.conversations.items.ItemCreateParams;
    import com.openai.models.responses.EasyInputMessage;
    import com.openai.models.responses.Response;
    import com.openai.models.responses.ResponseCreateParams;

    public class ChatWithAgent {
        public static void main(String[] args) {
            String endpoint = Configuration.getGlobalConfiguration().get("AZURE_AGENTS_ENDPOINT");
            String agentName = "MyAgent";
            
            AgentsClient agentsClient = new AgentsClientBuilder()
                    .credential(new DefaultAzureCredentialBuilder().build())
                    .endpoint(endpoint)
                    .buildAgentsClient();

            AgentDetails agent = agentsClient.getAgent(agentName);

            Conversation conversation = conversationsClient.getConversationService().create();
            conversationsClient.getConversationService().items().create(
                ItemCreateParams.builder()
                    .conversationId(conversation.id())
                    .addItem(EasyInputMessage.builder()
                        .role(EasyInputMessage.Role.SYSTEM)
                        .content("You are a helpful assistant that speaks like a pirate.")
                        .build()
                    ).addItem(EasyInputMessage.builder()
                        .role(EasyInputMessage.Role.USER)
                        .content("Hello, agent!")
                        .build()
                ).build()
            );

            AgentReference agentReference = new AgentReference(agent.getName()).setVersion(agent.getVersion());
            Response response = responsesClient.createWithAgentConversation(agentReference, conversation.id());

            OpenAIClient client = OpenAIOkHttpClient.builder()
                .baseUrl(endpoint.endsWith("/") ? endpoint + "openai" : endpoint + "/openai")
                .azureUrlPathMode(AzureUrlPathMode.UNIFIED)
                .credential(BearerTokenCredential.create(AuthenticationUtil.getBearerTokenSupplier(
                        new DefaultAzureCredentialBuilder().build(), "https://ai.azure.com/.default")))
                .azureServiceVersion(AzureOpenAIServiceVersion.fromString("2025-11-15-preview"))
                .build();

            ResponseCreateParams responseRequest = new ResponseCreateParams.Builder()
                .input("Hello, how can you help me?")
                .model(model)
                .build();

            Response result = client.responses().create(responseRequest);
        }
    }
    ```
  </Tab>

  <Tab title="REST API">
    Replace `YOUR-FOUNDRY-RESOURCE-NAME` with your values:

    ```console
    # Optional Step: Create a conversation to use with the agent
    curl -X POST https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR-PROJECT-NAME/openai/conversations?api-version=2025-11-15-preview \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AZURE_AI_AUTH_TOKEN" \
      -d '{}'
    # Lets say Conversation ID created is conv_123456789. Use this in the next step

    #Chat with the agent to answer questions
    curl -X POST https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR-PROJECT-NAME/openai/responses?api-version=2025-11-15-preview \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AZURE_AI_AUTH_TOKEN" \
      -d '{
            "agent": {"type": "agent_reference", "name": "MyAgent"},
            "conversation" : "<YOUR_CONVERSATION_ID>",
            "input" : "What is the size of France in square miles?"
        }'

    #Optional Step: Ask a follow-up question in the same conversation
    curl -X POST https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR-PROJECT-NAME/openai/responses?api-version=2025-11-15-preview \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $AZURE_AI_AUTH_TOKEN" \
      -d '{
            "agent": {"type": "agent_reference", "name": "MyAgent"},
            "conversation" : "<YOUR_CONVERSATION_ID>",
            "input" : "And what is the capital city?"
        }'
    ```
  </Tab>

  <Tab title="Foundry portal">
    Interact with your agent.

    1. Add instructions, such as, "You are a helpful writing assistant."
    2. Start chatting with your agent, for example, "Write a poem about the sun."
    3. Follow up with "How about a haiku?"
  </Tab>
</Tabs>

<Callout type="tip">
  Code uses **Azure AI Projects 2.x (preview)** and is incompatible with Azure AI Projects 1.x. [Switch to Foundry (classic) documentation](?view=foundry-classic\&preserve-view=true) for the Azure AI Projects 1.x GA version.
</Callout>

## Clean up resources

If you no longer need any of the resources you created, delete the resource group associated with your project.

* In the [Azure portal](https://portal.azure.com), select the resource group, and then select **Delete**. Confirm that you want to delete the resource group.

## Next step

<Callout type="nextstepaction">
  [Idea to prototype - Build and evaluate an enterprise agent](../tutorials/developer-journey-idea-to-prototype)
</Callout>

In this quickstart, you use [Microsoft Foundry](https://ai.azure.com/?cid=learnDocs) to:

* Create a project
* Deploy a model
* Run a chat completion
* Create and run an agent
* Upload files to the agent

The Microsoft Foundry SDK is available in multiple languages, including Python, Java, TypeScript, and C#. This quickstart provides instructions for each of these languages.

<Callout type="tip">
  The rest of this article shows how to create and use a **Foundry project**. See [Quickstart: Get started with Microsoft Foundry (Hub projects)](hub-get-started-code) if you want to use a hub-based project instead. [Which type of project do I need?](../what-is-foundry#which-type-of-project-do-i-need)
</Callout>

## Prerequisites

* An Azure account with an active subscription. If you don't have one, create a [free Azure account, which includes a free trial subscription](https://azure.microsoft.com/pricing/purchase-options/azure-account?cid=msft_learn).
* Access to a role that allows you to create a Foundry resource, such as **Azure Account AI Owner** or **Azure AI Owner** on the subscription or resource group. For more information about permissions, see [Role-based access control for Microsoft Foundry](../concepts/rbac-foundry#permissions-for-each-built-in-role).
* Install the required language runtimes, global tools, and VS Code extensions as described in [Prepare your development environment](../how-to/develop/install-cli-sdk).

<Callout type="important">
  Before starting, make sure your development environment is ready.\
  This Quickstart focuses on **scenario-specific steps** like SDK installation, authentication, and running sample code.
</Callout>

In the portal, you can explore a rich catalog of cutting-edge models from many different providers. For this tutorial, search and then select the **gpt-4o** model.

1. Sign in to [Microsoft Foundry](https://ai.azure.com/?cid=learnDocs). Make sure the **New Foundry** toggle is off. These steps refer to **Foundry (classic)**.

   ![](https://learn.microsoft.com/azure/ai-foundry/default/media/version-banner/classic-foundry.png)

2. If you're in a project, select **Microsoft Foundry** in the upper-left breadcrumb to leave the project. You'll create a new one in a moment.

3. From the landing page or **[Model catalog](https://ai.azure.com/explore/models)**, select **gpt-4o** (or **gpt-4o-mini**).

   ![Screenshot shows how to start with a model in Foundry portal.](https://learn.microsoft.com/azure/ai-foundry/media/quickstarts/start-building.png)

4. Select **Use this model**. When prompted, enter a new project name and select **Create**.

5. Review the deployment name and select **Create**.

6. Then select **Connect and deploy** after selecting a deployment type.

7. Select **Open in playground** from the deployment page after it's deployed.

8. You land in the Chat playground with the model pre-deployed and ready to use.

If you're building an agent, you can instead start with **Create an agent**. The steps are similar, but in a different order. Once the project is created, you arrive at the Agent playground instead of the Chat playground.

## Get ready to code

<Callout type="tip">
  Code uses **Azure AI Projects 1.x SDK** and is incompatible with Azure AI Projects 2.x (preview). [Switch to Foundry (new) documentation](?view=foundry\&preserve-view=true) for the Azure AI Projects 2.x (preview) version.
</Callout>

<Tabs>
  <Tab title="Python">
    1. Install these packages:

       ```
       pip install openai azure-identity azure-ai-projects==1.0.0
       ```

    2. Microsoft Foundry Models allows customers to consume the most powerful models from flagship model providers using a single endpoint and credentials. This means that you can switch between models and consume them from your application without changing a single line of code.

       Copy the **Foundry project endpoint** in the **Overview** section of your project. You'll use it in a moment.

       ![Screenshot shows the project overview for a Foundry project.](https://learn.microsoft.com/azure/ai-foundry/media/how-to/projects/fdp-project-overview.png)

       <Callout type="tip">
         If you don't see the **Foundry project endpoint**, you're using a hub-based project. (See [Types of projects](../what-is-foundry#types-of-projects)). Switch to a Foundry project, or use the preceding steps to create one.
       </Callout>

    3. Make sure to sign in using the CLI `az login` (or `az login --use-device-code`) command to authenticate before running your Python scripts.

    Follow along below or get the code:

    <Callout type="nextstepaction">
      [Get the code](https://github.com/azure-ai-foundry/foundry-samples/tree/main/samples-classic/python/quickstart)
    </Callout>
  </Tab>

  <Tab title="C#">
    1. Install packages:

       To work with Foundry Tools in your .NET project, you'll need to install several NuGet packages. Add NuGet packages using the .NET CLI in the integrated terminal:

       ```bash
       # Add Azure AI SDK packages
       dotnet add package Azure.Identity
       dotnet add package Azure.AI.Projects 
       dotnet add package Azure.AI.Agents.Persistent
       dotnet add package Azure.AI.Inference
       ```

    2. Microsoft Foundry Models allows customers to consume the most powerful models from flagship model providers using a single endpoint and credentials. This means that you can switch between models and consume them from your application without changing a single line of code.

       Copy the **Foundry project endpoint** in the **Overview** section of your project. You'll use it in a moment.

       ![Screenshot shows the project overview for a Foundry project.](https://learn.microsoft.com/azure/ai-foundry/media/how-to/projects/fdp-project-overview.png)

       <Callout type="tip">
         If you don't see the **Foundry project endpoint**, you're using a hub-based project. (See [Types of projects](../what-is-foundry#types-of-projects)). Switch to a Foundry project, or use the preceding steps to create one.
       </Callout>

    3. Set these environment variables to use in your scripts. The `AZURE_AI_ENDPOINT` is the project endpoint you copied earlier. Remove everything after `.com/` in that endpoint to form `AZURE_AI_INFERENCE`.

       ```plaintext
       AZURE_AI_ENDPOINT=https://your.services.ai.azure.com/api/projects/project
       AZURE_AI_INFERENCE=https://your.services.ai.azure.com/
       AZURE_AI_MODEL=your_model_name
       ```

       <Callout type="tip">
         The agent samples require the `AZURE_AI_MODEL` environment variable to be set to an OpenAI-compatible model, e.g. `gpt-4.1`, as not all models are supported for agent use cases, including tooling.
       </Callout>

    4. Make sure to sign in using the CLI `az login` (or `az login --use-device-code`) command to authenticate before running your C# scripts.

    Follow along below or get the code:

    <Callout type="nextstepaction">
      [Get the code](https://github.com/azure-ai-foundry/foundry-samples/tree/main/samples-classic/csharp/quickstart)
    </Callout>
  </Tab>

  <Tab title="TypeScript">
    1. Make sure to sign in using the CLI `az login` (or `az login --use-device-code`) command to authenticate before running your TypeScript scripts.

    2. Download [package.json](https://github.com/azure-ai-foundry/foundry-samples/blob/main/samples-classic/typescript/quickstart/package.json).

    3. Install packages with `npm install`

    4. Microsoft Foundry Models allows customers to consume the most powerful models from flagship model providers using a single endpoint and credentials. This means that you can switch between models and consume them from your application without changing a single line of code.

       Copy the **Foundry project endpoint** in the **Overview** section of your project. You'll use it in a moment.

       ![Screenshot shows the project overview for a Foundry project.](https://learn.microsoft.com/azure/ai-foundry/media/how-to/projects/fdp-project-overview.png)

       <Callout type="tip">
         If you don't see the **Foundry project endpoint**, you're using a hub-based project. (See [Types of projects](../what-is-foundry#types-of-projects)). Switch to a Foundry project, or use the preceding steps to create one.
       </Callout>

    5. Set these environment variables to use in your scripts:

       ```plaintext
       MODEL_DEPLOYMENT_NAME=gpt-4o
       PROJECT_ENDPOINT=https://<your-foundry-resource-name>.services.ai.azure.com/api/projects/<your-foundry-project-name>
       ```

    6. Start your code with these imports:

       ```typescript
       import fs from 'fs';
       import path from 'path';
       import { fileURLToPath } from 'url';
       import { DefaultAzureCredential } from '@azure/identity';
       import { ToolUtility, DoneEvent, ErrorEvent, ThreadMessage } from '@azure/ai-agents';
       import { AIProjectClient } from '@azure/ai-projects';
       import { config } from 'dotenv';
       config();
       ```

    Follow along below or get the code:

    <Callout type="nextstepaction">
      [Get the code](https://github.com/azure-ai-foundry/foundry-samples/tree/main/samples-classic/typescript/quickstart)
    </Callout>
  </Tab>

  <Tab title="Java">
    1. Microsoft Foundry Models allows customers to consume the most powerful models from flagship model providers using a single endpoint and credentials. This means that you can switch between models and consume them from your application without changing a single line of code.

       Copy the **Foundry project endpoint** in the **Overview** section of your project. You'll use it in a moment.

       ![Screenshot shows the project overview for a Foundry project.](https://learn.microsoft.com/azure/ai-foundry/media/how-to/projects/fdp-project-overview.png)

       <Callout type="tip">
         If you don't see the **Foundry project endpoint**, you're using a hub-based project. (See [Types of projects](../what-is-foundry#types-of-projects)). Switch to a Foundry project, or use the preceding steps to create one.
       </Callout>

    2. Set these environment variables to use in your scripts:

       ```txt
       MODEL_DEPLOYMENT_NAME=gpt-4o
       PROJECT_ENDPOINT=https://<your-foundry-resource-name>.services.ai.azure.com/api/projects/<your-foundry-project-name>
       ```

    3. Make sure to sign in using the CLI `az login` (or `az login --use-device-code`) command to authenticate before running your Java scripts.

    4. Download [POM.XML](https://github.com/azure-ai-foundry/foundry-samples/blob/main/samples-classic/java/quickstart/pom.xml) to your Java IDE.

    Follow along below or get the code:

    <Callout type="nextstepaction">
      [Get the code](https://github.com/azure-ai-foundry/foundry-samples/blob/main/samples-classic/java/quickstart)
    </Callout>
  </Tab>

  <Tab title="REST API">
    1. Make sure to sign in using the CLI `az login` (or `az login --use-device-code`) command to authenticate before running the next command.

    2. Get a temporary access token. It will expire in 60-90 minutes, you'll need to refresh after that.

       ```azurecli
       az account get-access-token --scope https://ai.azure.com/.default
       ```

    3. Save the results as the environment variable `AZURE_AI_AUTH_TOKEN`.

    Follow along below or get the code:

    <Callout type="nextstepaction">
      [Get the code](https://github.com/azure-ai-foundry/foundry-samples/tree/main/samples-classic/REST/quickstart).
    </Callout>
  </Tab>

  <Tab title="Foundry portal">
    No installation is necessary to use the Foundry portal.
  </Tab>
</Tabs>

## Chat with a model

Chat completions are the basic building block of AI applications. Using chat completions you can send a list of messages and get a response from the model.

<Callout type="tip">
  Code uses **Azure AI Projects 1.x SDK** and is incompatible with Azure AI Projects 2.x (preview). [Switch to Foundry (new) documentation](?view=foundry\&preserve-view=true) for the Azure AI Projects 2.x (preview) version.
</Callout>

<Tabs>
  <Tab title="Python">
    Substitute your endpoint for the `endpoint` in this code:

    ```python
    from azure.ai.projects import AIProjectClient
    from azure.identity import DefaultAzureCredential

    project = AIProjectClient(
        endpoint="https://your-foundry-resource-name.ai.azure.com/api/projects/project-name",
        credential=DefaultAzureCredential(),
    )

    models = project.get_openai_client(api_version="2024-10-21")
    response = models.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful writing assistant"},
            {"role": "user", "content": "Write me a poem about flowers"},
        ],
    )

    print(response.choices[0].message.content)
    ```
  </Tab>

  <Tab title="C#">
    ```csharp
    using System.ClientModel.Primitives;
    using Azure.Identity;
    using OpenAI;
    using OpenAI.Chat;

    #pragma warning disable OPENAI001

    string projectEndpoint = System.Environment.GetEnvironmentVariable("AZURE_AI_INFERENCE")!;
    string modelDeploymentName = System.Environment.GetEnvironmentVariable("AZURE_AI_MODEL")!;

    BearerTokenPolicy tokenPolicy = new(
        new DefaultAzureCredential(),
        "https://ai.azure.com/.default");
    OpenAIClient openAIClient = new(
        authenticationPolicy: tokenPolicy,
        options: new OpenAIClientOptions()
        {
            Endpoint = new($"{projectEndpoint}/openai/v1"),
        });
    ChatClient chatClient = openAIClient.GetChatClient(modelDeploymentName);

    ChatCompletion completion = await chatClient.CompleteChatAsync(
        [
            new SystemChatMessage("You are a helpful assistant."),
                        new UserChatMessage("How many feet are in a mile?")
        ]);

    Console.WriteLine(completion.Content[0].Text);
    ```
  </Tab>

  <Tab title="TypeScript">
    ```typescript
    // Get the Azure AI endpoint and deployment name from environment variables
    const endpoint = process.env.PROJECT_ENDPOINT as string;
    const deployment = process.env.MODEL_DEPLOYMENT_NAME || 'gpt-4o';

    // Create an Azure OpenAI Client
    const project = new AIProjectClient(endpoint, new DefaultAzureCredential());
    const client = await project.getAzureOpenAIClient({
        // The API version should match the version of the Azure OpenAI resource
        apiVersion: "2024-12-01-preview"
    });

    // Create a chat completion
    const chatCompletion = await client.chat.completions.create({
        model: deployment,
        messages: [
            { role: "system", content: "You are a helpful writing assistant" },
            { role: "user", content: "Write me a poem about flowers" },
        ],
    });
    console.log(`\n==================== 🌷 COMPLETIONS POEM ====================\n`);
    console.log(chatCompletion.choices[0].message.content);
    ```
  </Tab>

  <Tab title="Java (preview)">
    ```java
    package com.azure.ai.foundry.samples;

    import com.azure.ai.inference.ChatCompletionsClient;
    import com.azure.ai.inference.ChatCompletionsClientBuilder;
    import com.azure.ai.inference.models.ChatCompletions;
    import com.azure.core.credential.AzureKeyCredential;
    import com.azure.core.credential.TokenCredential;
    import com.azure.core.exception.HttpResponseException;
    import com.azure.core.util.logging.ClientLogger;
    import com.azure.identity.DefaultAzureCredentialBuilder;

    /**
     * Sample demonstrating non-streaming chat completion functionality
     * using the Azure AI Inference SDK, wired to your AOAI project endpoint.
     *
     * Environment variables:
     * - PROJECT_ENDPOINT:          Required. Your Azure AI project endpoint.
     * - AZURE_AI_API_KEY:          Optional. Your API key (falls back to DefaultAzureCredential).
     * - AZURE_MODEL_DEPLOYMENT_NAME: Optional. Model deployment name (default: "phi-4").
     * - AZURE_MODEL_API_PATH:      Optional. API path segment (default: "deployments").
     * - CHAT_PROMPT:               Optional. The prompt to send (uses a default if not provided).
     * 
     * SDK Features Demonstrated:
     * - Using the Azure AI Inference SDK (com.azure:azure-ai-inference:1.0.0-beta.5)
     * - Creating a ChatCompletionsClient with Azure or API key authentication
     * - Configuring endpoint paths for different model deployments
     * - Using the simplified complete() method for quick completions
     * - Accessing response content through strongly-typed objects
     * - Implementing proper error handling for service requests
     * - Choosing between DefaultAzureCredential and AzureKeyCredential
     * 
     */

    public class ChatCompletionSample {
        private static final ClientLogger logger = new ClientLogger(ChatCompletionSample.class);

        public static void main(String[] args) {
            // 1) Read and validate the project endpoint
            String projectEndpoint = System.getenv("PROJECT_ENDPOINT");
            if (projectEndpoint == null || projectEndpoint.isBlank()) {
                logger.error("PROJECT_ENDPOINT is required but not set");
                return;
            }

            // 2) Optional auth + model settings
            String apiKey          = System.getenv("AZURE_AI_API_KEY");
            String deploymentName  = System.getenv("AZURE_MODEL_DEPLOYMENT_NAME");
            String apiPath         = System.getenv("AZURE_MODEL_API_PATH");
            String prompt          = System.getenv("CHAT_PROMPT");

            if (deploymentName == null || deploymentName.isBlank()) {
                deploymentName = "phi-4";
                logger.info("No AZURE_MODEL_DEPLOYMENT_NAME provided, using default: {}", deploymentName);
            }
            if (apiPath == null || apiPath.isBlank()) {
                apiPath = "deployments";
                logger.info("No AZURE_MODEL_API_PATH provided, using default: {}", apiPath);
            }
            if (prompt == null || prompt.isBlank()) {
                prompt = "What best practices should I follow when asking an AI model to review Java code?";
                logger.info("No CHAT_PROMPT provided, using default prompt: {}", prompt);
            }

            try {
                // 3) Build the full inference endpoint URL
                String fullEndpoint = projectEndpoint.endsWith("/") 
                    ? projectEndpoint 
                    : projectEndpoint + "/";
                fullEndpoint += apiPath + "/" + deploymentName;
                logger.info("Using inference endpoint: {}", fullEndpoint);

                // 4) Create the client with key or token credential :contentReference[oaicite:0]{index=0}
                ChatCompletionsClient client;
                if (apiKey != null && !apiKey.isBlank()) {
                    logger.info("Authenticating using API key");
                    client = new ChatCompletionsClientBuilder()
                        .credential(new AzureKeyCredential(apiKey))
                        .endpoint(fullEndpoint)
                        .buildClient();
                } else {
                    logger.info("Authenticating using DefaultAzureCredential");
                    TokenCredential credential = new DefaultAzureCredentialBuilder().build();
                    client = new ChatCompletionsClientBuilder()
                        .credential(credential)
                        .endpoint(fullEndpoint)
                        .buildClient();
                }

                // 5) Send a simple chat completion request
                logger.info("Sending chat completion request with prompt: {}", prompt);
                ChatCompletions completions = client.complete(prompt);

                // 6) Process the response
                String content = completions.getChoice().getMessage().getContent();
                logger.info("Received response from model");
                System.out.println("\nResponse from AI assistant:\n" + content);
            } catch (HttpResponseException e) {
                // Handle API errors
                int status = e.getResponse().getStatusCode();
                logger.error("Service error {}: {}", status, e.getMessage());
                if (status == 401 || status == 403) {
                    logger.error("Authentication failed. Check API key or Azure credentials.");
                } else if (status == 404) {
                    logger.error("Deployment not found. Verify deployment name and endpoint.");
                } else if (status == 429) {
                    logger.error("Rate limit exceeded. Please retry later.");
                }
            } catch (Exception e) {
                // Handle all other exceptions
                logger.error("Error in chat completion: {}", e.getMessage(), e);
            }
        }
    }
    ```
  </Tab>

  <Tab title="REST API">
    Replace `YOUR-FOUNDRY-RESOURCE-NAME` with your values:

    ```console

    curl --request POST --url 'https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-10-21' \
    -h 'authorization: Bearer $AZURE_AI_AUTH_TOKEN' \
    -h 'content-type: application/json' \
    -d '{
            "messages": [
                {"role": "system", 
                "content": "You are a helpful writing assistant"},
                {"role": "user", 
                "content": "Write me a poem about flowers"}
            ],
            "model": "gpt-4o"
        }'
    ```
  </Tab>

  <Tab title="Foundry portal">
    1. In the chat playground, fill in the prompt and select **Send**.
    2. The model returns a response in the **Response** pane.
  </Tab>
</Tabs>

## Chat with an agent

Create an agent and chat with it.

<Callout type="tip">
  Code uses **Azure AI Projects 1.x SDK** and is incompatible with Azure AI Projects 2.x (preview). [Switch to Foundry (new) documentation](?view=foundry\&preserve-view=true) for the Azure AI Projects 2.x (preview) version.
</Callout>

<Tabs>
  <Tab title="Python">
    Substitute your endpoint for the `endpoint` in this code:

    ```python
    from azure.ai.projects import AIProjectClient
    from azure.identity import DefaultAzureCredential
    from azure.ai.agents.models import ListSortOrder, FilePurpose

    project = AIProjectClient(
        endpoint="https://your-foundry-resource-name.ai.azure.com/api/projects/project-name",
        credential=DefaultAzureCredential(),
    )

    agent = project.agents.create_agent(
        model="gpt-4o",
        name="my-agent",
        instructions="You are a helpful writing assistant")

    thread = project.agents.threads.create()
    message = project.agents.messages.create(
        thread_id=thread.id, 
        role="user", 
        content="Write me a poem about flowers")

    run = project.agents.runs.create_and_process(thread_id=thread.id, agent_id=agent.id)
    if run.status == "failed":
        # Check if you got "Rate limit is exceeded.", then you want to get more quota
        print(f"Run failed: {run.last_error}")

    # Get messages from the thread
    messages = project.agents.messages.list(thread_id=thread.id)

    # Get the last message from the sender
    messages = project.agents.messages.list(thread_id=thread.id, order=ListSortOrder.ASCENDING)
    for message in messages:
        if message.run_id == run.id and message.text_messages:
            print(f"{message.role}: {message.text_messages[-1].text.value}")

    # Delete the agent once done
    project.agents.delete_agent(agent.id)
    print("Deleted agent")
    ```
  </Tab>

  <Tab title="C#">
    ```csharp
    using Azure;
    using Azure.Identity;
    using Azure.AI.Agents.Persistent;

    // Creating the Client for agents
    var projectEndpoint = System.Environment.GetEnvironmentVariable("AZURE_AI_ENDPOINT");
    var modelDeploymentName = System.Environment.GetEnvironmentVariable("AZURE_AI_MODEL");
    PersistentAgentsClient client = new(projectEndpoint, new DefaultAzureCredential());

    // Create an Agent with toolResources and process Agent run
    PersistentAgent agent = client.Administration.CreateAgent(
            model: modelDeploymentName,
            name: "SDK Test Agent - Tutor",
            instructions: "You are a personal electronics tutor. Write and run code to answer questions.",
            tools: new List<ToolDefinition> { new CodeInterpreterToolDefinition() });

    // Create thread for communication
    PersistentAgentThread thread = client.Threads.CreateThread();

    // Create message to thread
    PersistentThreadMessage messageResponse = client.Messages.CreateMessage(
        thread.Id,
        MessageRole.User,
        "I need to solve the equation `3x + 11 = 14`. Can you help me?");

    // Run the Agent
    ThreadRun run = client.Runs.CreateRun(thread, agent);

    // Wait for the run to complete
    do
    {
        Thread.Sleep(TimeSpan.FromMilliseconds(500));
        run = client.Runs.GetRun(thread.Id, run.Id);
    }
    while (run.Status == RunStatus.Queued
        || run.Status == RunStatus.InProgress);
    Pageable<PersistentThreadMessage> messages = client.Messages.GetMessages(
        threadId: thread.Id,
        order: ListSortOrder.Ascending
    );
    // Print the messages in the thread
    WriteMessages(messages);

    // Delete the thread and agent after use
    client.Threads.DeleteThread(thread.Id);
    client.Administration.DeleteAgent(agent.Id);

    // Temporary function to use a list of messages in the thread and write them to the console.
    static void WriteMessages(IEnumerable<PersistentThreadMessage> messages)
    {
        foreach (PersistentThreadMessage threadMessage in messages)
        {
            Console.Write($"{threadMessage.CreatedAt:yyyy-MM-dd HH:mm:ss} - {threadMessage.Role,10}: ");
            foreach (MessageContent contentItem in threadMessage.ContentItems)
            {
                if (contentItem is MessageTextContent textItem)
                {
                    Console.Write(textItem.Text);
                }
                else if (contentItem is MessageImageFileContent imageFileItem)
                {
                    Console.Write($"<image from ID: {imageFileItem.FileId}");
                }
                Console.WriteLine();
            }
        }
    }
    ```
  </Tab>

  <Tab title="TypeScript">
    ```typescript
    const endpoint = process.env.PROJECT_ENDPOINT as string;
    const deployment = process.env.MODEL_DEPLOYMENT_NAME || 'gpt-4o';
    const client = new AIProjectClient(endpoint, new DefaultAzureCredential());

    // Create an Agent
    const agent = await client.agents.createAgent(deployment, {
        name: 'my-agent',
        instructions: 'You are a helpful agent'
    });
    console.log(`\n==================== 🕵️  POEM AGENT ====================`);

    // Create a thread and message
    const thread = await client.agents.threads.create();
    const prompt = 'Write me a poem about flowers';
    console.log(`\n---------------- 📝 User Prompt ---------------- \n${prompt}`);
    await client.agents.messages.create(thread.id, 'user', prompt);

    // Create run
    let run = await client.agents.runs.create(thread.id, agent.id);

    // Wait for run to complete
    console.log(`\n---------------- 🚦 Run Status ----------------`);
    while (['queued', 'in_progress', 'requires_action'].includes(run.status)) {
        // Avoid adding a lot of messages to the console
        await new Promise((resolve) => setTimeout(resolve, 1000));
        run = await client.agents.runs.get(thread.id, run.id);
        console.log(`Run status: ${run.status}`);
    }

    console.log('\n---------------- 📊 Token Usage ----------------');
    console.table([run.usage]);

    const messagesIterator = await client.agents.messages.list(thread.id);
    const assistantMessage = await getAssistantMessage(messagesIterator);
    console.log('\n---------------- 💬 Response ----------------');
    printAssistantMessage(assistantMessage);

    // Clean up
    console.log(`\n---------------- 🧹 Clean Up Poem Agent ----------------`);
    await client.agents.deleteAgent(agent.id);
    console.log(`Deleted Agent, Agent ID: ${agent.id}`);
    ```
  </Tab>

  <Tab title="Java (preview)">
    ```java
    package com.azure.ai.foundry.samples;

    import com.azure.ai.agents.persistent.PersistentAgentsClient;
    import com.azure.ai.agents.persistent.PersistentAgentsClientBuilder;
    import com.azure.ai.agents.persistent.PersistentAgentsAdministrationClient;
    import com.azure.ai.agents.persistent.models.CreateAgentOptions;
    import com.azure.ai.agents.persistent.models.CreateThreadAndRunOptions;
    import com.azure.ai.agents.persistent.models.PersistentAgent;
    import com.azure.ai.agents.persistent.models.ThreadRun;
    import com.azure.core.credential.TokenCredential;
    import com.azure.core.exception.HttpResponseException;
    import com.azure.core.util.logging.ClientLogger;
    import com.azure.identity.DefaultAzureCredentialBuilder;


    /**
     * Sample demonstrating how to work with Azure AI Agents using the Azure AI Agents Persistent SDK.
     * 
     * This sample shows how to:
     * - Set up authentication with Azure credentials
     * - Create a persistent agent with custom instructions
     * - Start a thread and run with the agent
     * - Access various properties of the agent and thread run
     * - Work with the PersistentAgentsClient and PersistentAgentsAdministrationClient
     * 
     * Environment variables:
     * - AZURE_ENDPOINT: Optional fallback. The base endpoint for your Azure AI service if PROJECT_ENDPOINT is not provided.
     * - PROJECT_ENDPOINT: Required. The endpoint for your Azure AI Project.
     * - MODEL_DEPLOYMENT_NAME: Optional. The model deployment name (defaults to "gpt-4o").
     * - AGENT_NAME: Optional. The name to give to the created agent (defaults to "java-quickstart-agent").
     * - AGENT_INSTRUCTIONS: Optional. The instructions for the agent (defaults to a helpful assistant).
     * 
     * Note: This sample requires proper Azure authentication. It uses DefaultAzureCredential which supports
     * multiple authentication methods including environment variables, managed identities, and interactive login.
     * 
     * SDK Features Demonstrated:
     * - Using the Azure AI Agents Persistent SDK (com.azure:azure-ai-agents-persistent:1.0.0-beta.2)
     * - Creating an authenticated client with DefaultAzureCredential
     * - Using the PersistentAgentsClientBuilder pattern for client instantiation
     * - Working with the PersistentAgentsAdministrationClient for agent management
     * - Creating agents with specific configurations (name, model, instructions)
     * - Starting threads and runs for agent conversations
     * - Working with agent state and thread management
     * - Accessing agent and thread run properties
     * - Implementing proper error handling for Azure service interactions
     */
    public class AgentSample {
        private static final ClientLogger logger = new ClientLogger(AgentSample.class);

        public static void main(String[] args) {
            // Load environment variables with better error handling, supporting both .env and system environment variables
            String endpoint = System.getenv("AZURE_ENDPOINT");
            String projectEndpoint = System.getenv("PROJECT_ENDPOINT");
            String modelName = System.getenv("MODEL_DEPLOYMENT_NAME");
            String agentName = System.getenv("AGENT_NAME");
            String instructions = System.getenv("AGENT_INSTRUCTIONS");

            

            // Check for required endpoint configuration
            if (projectEndpoint == null && endpoint == null) {
                String errorMessage = "Environment variables not configured. Required: either PROJECT_ENDPOINT or AZURE_ENDPOINT must be set.";
                logger.error("ERROR: {}", errorMessage);
                logger.error("Please set your environment variables or create a .env file. See README.md for details.");
                return;
            }
            
            // Use AZURE_ENDPOINT as fallback if PROJECT_ENDPOINT not set
            if (projectEndpoint == null) {
                projectEndpoint = endpoint;
                logger.info("Using AZURE_ENDPOINT as PROJECT_ENDPOINT: {}", projectEndpoint);
            }

            // Set defaults for optional parameters with informative logging
            if (modelName == null) {
                modelName = "gpt-4o";
                logger.info("No MODEL_DEPLOYMENT_NAME provided, using default: {}", modelName);
            }
            if (agentName == null) {
                agentName = "java-quickstart-agent";
                logger.info("No AGENT_NAME provided, using default: {}", agentName);
            }
            if (instructions == null) {
                instructions = "You are a helpful assistant that provides clear and concise information.";
                logger.info("No AGENT_INSTRUCTIONS provided, using default instructions");
            }

            // Create Azure credential with DefaultAzureCredentialBuilder
            // This supports multiple authentication methods including environment variables,
            // managed identities, and interactive browser login
            logger.info("Building DefaultAzureCredential");
            TokenCredential credential = new DefaultAzureCredentialBuilder().build();

            try {
                // Build the general agents client
                logger.info("Creating PersistentAgentsClient with endpoint: {}", projectEndpoint);
                PersistentAgentsClient agentsClient = new PersistentAgentsClientBuilder()
                    .endpoint(projectEndpoint)
                    .credential(credential)
                    .buildClient();

                // Derive the administration client
                logger.info("Getting PersistentAgentsAdministrationClient");
                PersistentAgentsAdministrationClient adminClient =
                    agentsClient.getPersistentAgentsAdministrationClient();

                // Create an agent
                logger.info("Creating agent with name: {}, model: {}", agentName, modelName);
                PersistentAgent agent = adminClient.createAgent(
                    new CreateAgentOptions(modelName)
                        .setName(agentName)
                        .setInstructions(instructions)
                );
                logger.info("Agent created: ID={}, Name={}", agent.getId(), agent.getName());
                logger.info("Agent model: {}", agent.getModel());

                // Start a thread/run on the general client
                logger.info("Creating thread and run with agent ID: {}", agent.getId());
                ThreadRun runResult = agentsClient.createThreadAndRun(
                    new CreateThreadAndRunOptions(agent.getId())
                );
                logger.info("ThreadRun created: ThreadId={}", runResult.getThreadId());

                // List available getters on ThreadRun for informational purposes
                logger.info("\nAvailable getters on ThreadRun:");
                for (var method : ThreadRun.class.getMethods()) {
                    if (method.getName().startsWith("get")) {
                        logger.info(" - {}", method.getName());
                    }
                }

                logger.info("\nDemo completed successfully!");
                
            } catch (HttpResponseException e) {
                // Handle service-specific errors with detailed information
                int statusCode = e.getResponse().getStatusCode();
                logger.error("Service error {}: {}", statusCode, e.getMessage());
                logger.error("Refer to the Azure AI Agents documentation for troubleshooting information.");
            } catch (Exception e) {
                // Handle general exceptions
                logger.error("Error in agent sample: {}", e.getMessage(), e);
            }
        }
    }
    ```
  </Tab>

  <Tab title="REST API">
    Replace `YOUR-FOUNDRY-RESOURCE-NAME` and `YOUR-PROJECT-NAME` with your values:

    ```console

    # Create agent
    curl --request POST --url "https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR-PROJECT-NAME/assistants?api-version=v1" \
        -h "authorization: Bearer $AZURE_AI_AUTH_TOKEN" \
        -h "content-type: application/json" \
        -d '{
                "model": "gpt-4o",
                "name": "my-agent",
                "instructions": "You are a helpful writing assistant"
            }'
    #Lets say agent ID created is asst_123456789. Use this to run the agent

    # Create thread
    curl --request POST --url 'https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR-PROJECT-NAME/threads?api-version=v1' \
        -h 'authorization: Bearer $AZURE_AI_AUTH_TOKEN' \
        -h 'content-type: application/json'

    #Lets say thread ID created is thread_123456789. Use this in the next step

    # Create message using thread ID
    curl --request POST --url 'https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR-PROJECT-NAME/threads/thread_123456789/messages?api-version=v1' \
        -h 'authorization: Bearer $AZURE_AI_AUTH_TOKEN' \
        -h 'content-type: application/json' \
        -d '{
                "role": "user",
                "content": "Write me a poem about flowers"
            }'

    # Run thread with the agent - use both agent id and thread id
    curl --request POST --url 'https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR-PROJECT-NAME/threads/thread_123456789/runs?api-version=v1' \
        -h 'authorization: Bearer $AZURE_AI_AUTH_TOKEN' \
        -h 'content-type: application/json' \
        --data '{
            "assistant_id": "asst_123456789"
        }'

    # List the messages in the thread using thread ID
    curl --request GET --url 'https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR-PROJECT-NAME/threads/thread_123456789/messages?api-version=v1' \
        -h 'authorization: Bearer $AZURE_AI_AUTH_TOKEN' \
        -h 'content-type: application/json'

    # Delete agent once done using agent id
    curl --request DELETE --url 'https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR-PROJECT-NAME/assistants/asst_123456789?api-version=v1' \
        -h 'authorization: Bearer $AZURE_AI_AUTH_TOKEN' \
        -h 'content-type: application/json'
    ```
  </Tab>

  <Tab title="Foundry portal">
    When you're ready to try an agent, a default agent is created for you. To chat with this agent:

    1. In the left pane, select **Playgrounds**.
    2. In the **Agents playground** card, select **Let's go**.
    3. Add instructions, such as, "You are a helpful writing assistant."
    4. Start chatting with your agent, for example, "Write me a poem about flowers."
  </Tab>
</Tabs>

## Add files to the agent

Agents have powerful capabilities through the use of tools. Let's add a file search tool that enables us to do knowledge retrieval.

* Download [product\_info\_1.md](https://github.com/azure-ai-foundry/foundry-samples/blob/main/samples-classic/data/product_info_1.md) to give to your agent.

<Callout type="tip">
  Code uses **Azure AI Projects 1.x SDK** and is incompatible with Azure AI Projects 2.x (preview). [Switch to Foundry (new) documentation](?view=foundry\&preserve-view=true) for the Azure AI Projects 2.x (preview) version.
</Callout>

<Tabs>
  <Tab title="Python">
    Substitute your endpoint for the `endpoint` in this code:

    ```python
    from azure.ai.projects import AIProjectClient
    from azure.identity import DefaultAzureCredential
    from azure.ai.agents.models import ListSortOrder, FileSearchTool

    project = AIProjectClient(
        endpoint="https://your-foundry-resource-name.ai.azure.com/api/projects/project-name",
        credential=DefaultAzureCredential(),
    )

    # Upload file and create vector store
    file = project.agents.files.upload(file_path="./product_info_1.md", purpose=FilePurpose.AGENTS)
    vector_store = project.agents.vector_stores.create_and_poll(file_ids=[file.id], name="my_vectorstore")

    # Create file search tool and agent
    file_search = FileSearchTool(vector_store_ids=[vector_store.id])
    agent = project.agents.create_agent(
        model="gpt-4o",
        name="my-assistant",
        instructions="You are a helpful assistant and can search information from uploaded files",
        tools=file_search.definitions,
        tool_resources=file_search.resources,
    )

    # Create thread and process user message
    thread = project.agents.threads.create()
    project.agents.messages.create(thread_id=thread.id, role="user", content="Hello, what Contoso products do you know?")
    run = project.agents.runs.create_and_process(thread_id=thread.id, agent_id=agent.id)

    # Handle run status
    if run.status == "failed":
        print(f"Run failed: {run.last_error}")

    # Print thread messages
    messages = project.agents.messages.list(thread_id=thread.id, order=ListSortOrder.ASCENDING)
    for message in messages:
        if message.run_id == run.id and message.text_messages:
            print(f"{message.role}: {message.text_messages[-1].text.value}")

    # Cleanup resources
    project.agents.vector_stores.delete(vector_store.id)
    project.agents.files.delete(file_id=file.id)
    project.agents.delete_agent(agent.id)
    ```
  </Tab>

  <Tab title="C#">
    ```csharp

    using Azure;
    using Azure.Identity;
    using Azure.AI.Agents.Persistent;

    // Creating the Client for agents and vector stores
    var projectEndpoint = System.Environment.GetEnvironmentVariable("AZURE_AI_ENDPOINT");
    var modelDeploymentName = System.Environment.GetEnvironmentVariable("AZURE_AI_MODEL");
    PersistentAgentsClient client = new(projectEndpoint, new DefaultAzureCredential());

    PersistentAgentFileInfo uploadedAgentFile = client.Files.UploadFile(
        filePath: "product_info_1.md",
        purpose: PersistentAgentFilePurpose.Agents);

    // Create a vector store with the file and wait for it to be processed.
    // If you do not specify a vector store, create_message will create a vector store with a default expiration policy of seven days after they were last active

    Dictionary<string, string> fileIds = new()
    {
        { uploadedAgentFile.Id, uploadedAgentFile.Filename }
    };

    PersistentAgentsVectorStore vectorStore = client.VectorStores.CreateVectorStore(
        name: "my_vector_store");

    // Add file ID to vector store.
    VectorStoreFile vctFile = client.VectorStores.CreateVectorStoreFile(
        vectorStoreId: vectorStore.Id,
        fileId: uploadedAgentFile.Id
    );

    Console.WriteLine($"Added file to vector store. The id file in the vector store is {vctFile.Id}.");

    FileSearchToolResource fileSearchToolResource = new FileSearchToolResource();
    fileSearchToolResource.VectorStoreIds.Add(vectorStore.Id);

    // Create an Agent with toolResources and process Agent run
    PersistentAgent agent = client.Administration.CreateAgent(
            model: modelDeploymentName,
            name: "SDK Test Agent - Retrieval",
            instructions: "You are a helpful agent that can help fetch data from files you know about.",
            tools: new List<ToolDefinition> { new FileSearchToolDefinition() },
            toolResources: new ToolResources() { FileSearch = fileSearchToolResource });

    // Create thread for communication
    PersistentAgentThread thread = client.Threads.CreateThread();

    // Create message to thread
    PersistentThreadMessage messageResponse = client.Messages.CreateMessage(
        thread.Id,
        MessageRole.User,
        "Can you give me information on how to mount the product?");

    // Run the Agent
    ThreadRun run = client.Runs.CreateRun(thread, agent);

    // Wait for the run to complete
    // This is a blocking call, so it will wait until the run is completed
    do
    {
        Thread.Sleep(TimeSpan.FromMilliseconds(500));
        run = client.Runs.GetRun(thread.Id, run.Id);
    }
    while (run.Status == RunStatus.Queued
        || run.Status == RunStatus.InProgress);

    // Create a list of messages in the thread and write them to the console.
    Pageable<PersistentThreadMessage> messages = client.Messages.GetMessages(
        threadId: thread.Id,
        order: ListSortOrder.Ascending
    );
    WriteMessages(messages, fileIds);

    // Delete the thread and agent after use
    client.VectorStores.DeleteVectorStore(vectorStore.Id);
    client.Files.DeleteFile(uploadedAgentFile.Id);
    client.Threads.DeleteThread(thread.Id);
    client.Administration.DeleteAgent(agent.Id);

    // Helper method to write messages to the console
    static void WriteMessages(IEnumerable<PersistentThreadMessage> messages, Dictionary<string, string> fileIds)
    {
        foreach (PersistentThreadMessage threadMessage in messages)
        {
            Console.Write($"{threadMessage.CreatedAt:yyyy-MM-dd HH:mm:ss} - {threadMessage.Role,10}: ");
            foreach (MessageContent contentItem in threadMessage.ContentItems)
            {
                if (contentItem is MessageTextContent textItem)
                {
                    if (threadMessage.Role == MessageRole.Agent && textItem.Annotations.Count > 0)
                    {
                        string strMessage = textItem.Text;
                        foreach (MessageTextAnnotation annotation in textItem.Annotations)
                        {
                            if (annotation is MessageTextFilePathAnnotation pathAnnotation)
                            {
                                strMessage = replaceReferences(fileIds, pathAnnotation.FileId, pathAnnotation.Text, strMessage);
                            }
                            else if (annotation is MessageTextFileCitationAnnotation citationAnnotation)
                            {
                                strMessage = replaceReferences(fileIds, citationAnnotation.FileId, citationAnnotation.Text, strMessage);
                            }
                        }
                        Console.Write(strMessage);
                    }
                    else
                    {
                        Console.Write(textItem.Text);
                    }
                }
                else if (contentItem is MessageImageFileContent imageFileItem)
                {
                    Console.Write($"<image from ID: {imageFileItem.FileId}");
                }
                Console.WriteLine();
            }
        }
    }

    // Helper method to replace file references in the text
    static string replaceReferences(Dictionary<string, string> fileIds, string fileID, string placeholder, string text)
    {
        if (fileIds.TryGetValue(fileID, out string replacement))
            return text.Replace(placeholder, $" [{replacement}]");
        else
            return text.Replace(placeholder, $" [{fileID}]");
    }
    ```
  </Tab>

  <Tab title="TypeScript">
    ```typescript
    // Upload a file named product_info_1.md
    console.log(`\n==================== 🕵️  FILE AGENT ====================`);
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const filePath = path.join(__dirname, '../data/product_info_1.md');
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('data', (chunk: string | Buffer) => {
        console.log(`Read ${chunk.length} bytes of data.`);
    });
    const file = await client.agents.files.upload(fileStream, 'assistants', {
        fileName: 'product_info_1.md'
    });
    console.log(`Uploaded file, ID: ${file.id}`);
    const vectorStore = await client.agents.vectorStores.create({
        fileIds: [file.id], // Associate the uploaded file with the vector store
        name: 'my_vectorstore'
    });
    console.log('\n---------------- 🗃️ Vector Store Info ----------------');
    console.table([
        {
            'Vector Store ID': vectorStore.id,
            'Usage (bytes)': vectorStore.usageBytes,
            'File Count': vectorStore.fileCounts?.total ?? 'N/A'
        }
    ]);

    // Create an Agent and a FileSearch tool
    const fileSearchTool = ToolUtility.createFileSearchTool([vectorStore.id]);
    const fileAgent = await client.agents.createAgent(deployment, {
        name: 'my-file-agent',
        instructions: 'You are a helpful assistant and can search information from uploaded files',
        tools: [fileSearchTool.definition],
        toolResources: fileSearchTool.resources
    });

    // Create a thread and message
    const fileSearchThread = await client.agents.threads.create({ toolResources: fileSearchTool.resources });
    const filePrompt = 'What are the steps to setup the TrailMaster X4 Tent?';
    console.log(`\n---------------- 📝 User Prompt ---------------- \n${filePrompt}`);
    await client.agents.messages.create(fileSearchThread.id, 'user', filePrompt);

    // Create run
    let fileSearchRun = await client.agents.runs.create(fileSearchThread.id, fileAgent.id).stream();

    for await (const eventMessage of fileSearchRun) {
        if (eventMessage.event === DoneEvent.Done) {
            console.log(`Run completed: ${eventMessage.data}`);
        }
        if (eventMessage.event === ErrorEvent.Error) {
            console.log(`An error occurred. ${eventMessage.data}`);
        }
    }

    const fileSearchMessagesIterator = await client.agents.messages.list(fileSearchThread.id);
    const fileAssistantMessage = await getAssistantMessage(fileSearchMessagesIterator);
    console.log(`\n---------------- 💬 Response ---------------- \n`);
    printAssistantMessage(fileAssistantMessage);

    // Clean up
    console.log(`\n---------------- 🧹 Clean Up File Agent ----------------`);
    client.agents.vectorStores.delete(vectorStore.id);
    client.agents.files.delete(file.id);
    client.agents.deleteAgent(fileAgent.id);
    console.log(`Deleted VectorStore, File, and FileAgent. FileAgent ID: ${fileAgent.id}`);
    ```
  </Tab>

  <Tab title="Java (preview)">
    ```java
    package com.azure.ai.foundry.samples;

    import java.io.IOException;
    import java.nio.file.Files;
    import java.nio.file.Path;

    import com.azure.ai.agents.persistent.PersistentAgentsClient;
    import com.azure.ai.agents.persistent.PersistentAgentsClientBuilder;
    import com.azure.ai.agents.persistent.PersistentAgentsAdministrationClient;
    import com.azure.ai.agents.persistent.models.CreateAgentOptions;
    import com.azure.ai.agents.persistent.models.CreateThreadAndRunOptions;
    import com.azure.ai.agents.persistent.models.PersistentAgent;
    import com.azure.ai.agents.persistent.models.ThreadRun;
    import com.azure.core.exception.HttpResponseException;
    import com.azure.core.util.logging.ClientLogger;
    import com.azure.identity.DefaultAzureCredentialBuilder;

    /**
     * Sample demonstrating agent creation with document capabilities using Azure AI Agents Persistent SDK.
     * 
     * This sample shows how to:
     * - Set up authentication with Azure credentials
     * - Create a temporary document file for demonstration purposes
     * - Create a persistent agent with custom instructions for document search
     * - Start a thread and run with the agent that can access document content
     * - Work with file-based knowledge sources for agent interactions
     * 
     * Environment variables:
     * - AZURE_ENDPOINT: Optional fallback. The base endpoint for your Azure AI service if PROJECT_ENDPOINT is not provided.
     * - PROJECT_ENDPOINT: Required. The endpoint for your Azure AI Project.
     * - MODEL_DEPLOYMENT_NAME: Optional. The model deployment name (defaults to "gpt-4o").
     * - AGENT_NAME: Optional. The name to give to the created agent (defaults to "java-file-search-agent").
     * - AGENT_INSTRUCTIONS: Optional. The instructions for the agent (defaults to document-focused instructions).
     * 
     * Note: This sample demonstrates the creation of an agent that can process document content.
     * In a real-world scenario, you might want to integrate with Azure AI Search or similar services
     * for more advanced document processing capabilities.
     * 
     * SDK Features Demonstrated:
     * - Using the Azure AI Agents Persistent SDK (com.azure:azure-ai-agents-persistent:1.0.0-beta.2)
     * - Creating an authenticated client with DefaultAzureCredential
     * - Using the PersistentAgentsClientBuilder for client instantiation 
     * - Working with the PersistentAgentsAdministrationClient for agent management
     * - Creating temporary document files for agent access
     * - Adding document knowledge sources to agents
     * - Creating document-aware agents that can search and reference content
     * - Starting threads and runs for document-based Q&A
     * - Error handling for Azure service and file operations
     */
    public class FileSearchAgentSample {
        private static final ClientLogger logger = new ClientLogger(FileSearchAgentSample.class);
        
        public static void main(String[] args) {
            // Load environment variables with proper error handling
            String endpoint = System.getenv("AZURE_ENDPOINT");
            String projectEndpoint = System.getenv("PROJECT_ENDPOINT");
            String modelName = System.getenv("MODEL_DEPLOYMENT_NAME");
            String agentName = System.getenv("AGENT_NAME");
            String instructions = System.getenv("AGENT_INSTRUCTIONS");

            // Check for required endpoint configuration
            if (projectEndpoint == null && endpoint == null) {
                String errorMessage = "Environment variables not configured. Required: either PROJECT_ENDPOINT or AZURE_ENDPOINT must be set.";
                logger.error("ERROR: {}", errorMessage);
                logger.error("Please set your environment variables or create a .env file. See README.md for details.");
                return;
            }
            
            // Set defaults for optional parameters
            if (modelName == null) {
                modelName = "gpt-4o";
                logger.info("No MODEL_DEPLOYMENT_NAME provided, using default: {}", modelName);
            }
            if (agentName == null) {
                agentName = "java-file-search-agent";
                logger.info("No AGENT_NAME provided, using default: {}", agentName);
            }
            if (instructions == null) {
                instructions = "You are a helpful assistant that can answer questions about documents.";
                logger.info("No AGENT_INSTRUCTIONS provided, using default instructions: {}", instructions);
            }

            logger.info("Building DefaultAzureCredential");
            var credential = new DefaultAzureCredentialBuilder().build();

            // Use AZURE_ENDPOINT as fallback if PROJECT_ENDPOINT not set
            String finalEndpoint = projectEndpoint != null ? projectEndpoint : endpoint;
            logger.info("Using endpoint: {}", finalEndpoint);

            try {
                // Build the general agents client with proper error handling
                logger.info("Creating PersistentAgentsClient with endpoint: {}", finalEndpoint);
                PersistentAgentsClient agentsClient = new PersistentAgentsClientBuilder()
                    .endpoint(finalEndpoint)
                    .credential(credential)
                    .buildClient();

                // Derive the administration client
                logger.info("Getting PersistentAgentsAdministrationClient");
                PersistentAgentsAdministrationClient adminClient =
                    agentsClient.getPersistentAgentsAdministrationClient();

                // Create sample document for demonstration
                Path tmpFile = createSampleDocument();
                logger.info("Created sample document at: {}", tmpFile);
                String filePreview = Files.readString(tmpFile).substring(0, 200) + "...";
                logger.info("{}", filePreview);

                // Create the agent with proper configuration
                logger.info("Creating agent with name: {}, model: {}", agentName, modelName);
                PersistentAgent agent = adminClient.createAgent(
                    new CreateAgentOptions(modelName)
                        .setName(agentName)
                        .setInstructions(instructions)
                );
                logger.info("Agent ID: {}", agent.getId());
                logger.info("Agent model: {}", agent.getModel());

                // Start a thread and run on the general client
                logger.info("Creating thread and run with agent ID: {}", agent.getId());
                ThreadRun threadRun = agentsClient.createThreadAndRun(
                    new CreateThreadAndRunOptions(agent.getId())
                );
                logger.info("ThreadRun ID: {}", threadRun.getThreadId());

                // Display success message
                logger.info("\nDemo completed successfully!");

            } catch (HttpResponseException e) {
                // Handle service-specific errors with detailed information
                int statusCode = e.getResponse().getStatusCode();
                logger.error("Service error {}: {}", statusCode, e.getMessage());
                logger.error("Refer to the Azure AI Agents documentation for troubleshooting information.");
                
            } catch (IOException e) {
                // Handle IO exceptions specifically for file operations
                logger.error("I/O error while creating sample document: {}", e.getMessage(), e);
                
            } catch (Exception e) {
                // Handle general exceptions
                logger.error("Error in file search agent sample: {}", e.getMessage(), e);
            }
        }

        /**
         * Creates a sample markdown document with cloud computing information.
         * 
         * This method demonstrates:
         * - Creating a temporary file that will be automatically deleted when the JVM exits
         * - Writing structured markdown content to the file
         * - Logging file creation and preview of content
         * 
         * In a real application, you might read existing files or create more complex documents.
         * You could also upload them to a document storage service for persistent access.
         * 
         * @return Path to the created temporary file
         * @throws IOException if an I/O error occurs during file creation or writing
         */
        private static Path createSampleDocument() throws IOException {
            logger.info("Creating sample document");
            String content = """
                # Cloud Computing Overview
                
                Cloud computing is the delivery of computing services over the internet, including servers, storage,
                databases, networking, software, analytics, and intelligence. Cloud services offer faster innovation,
                flexible resources, and economies of scale.
                
                ## Key Cloud Service Models
                
                1. **Infrastructure as a Service (IaaS)** - Provides virtualized computing resources
                2. **Platform as a Service (PaaS)** - Provides hardware and software tools over the internet
                3. **Software as a Service (SaaS)** - Delivers software applications over the internet
                
                ## Major Cloud Providers
                
                - Microsoft Azure
                - Amazon Web Services (AWS)
                - Google Cloud Platform (GCP)
                - IBM Cloud
                
                ## Benefits of Cloud Computing
                
                - Cost efficiency
                - Scalability
                - Reliability
                - Performance
                - Security
                """;
            
            Path tempFile = Files.createTempFile("cloud-doc", ".md");
            Files.writeString(tempFile, content);
            logger.info("Sample document created at: {}", tempFile);
            return tempFile;
        }
    }
    ```
  </Tab>

  <Tab title="REST API">
    Replace `YOUR-FOUNDRY-RESOURCE-NAME` and `YOUR-PROJECT-NAME` with your values:

    ```console
    #Upload the file
    curl --request POST --url 'https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR-PROJECT-NAME/files?api-version=v1' \ 
        -h 'authorization: Bearer $AZURE_AI_AUTH_TOKEN' \ 
        -f purpose="assistant" \
        -f file="@product_info_1.md" #File object (not file name) to be uploaded.
    #Lets say file ID created is assistant-123456789. Use this in the next step

    # create vector store
    curl --request POST --url 'https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR-PROJECT-NAME/vector_stores?api-version=v1' \ 
    -h 'authorization: Bearer $AZURE_AI_AUTH_TOKEN' \ 
    -h 'content-type: application/json' \ 
    -d '{
            "name": "my_vectorstore",
            "file_ids": ["assistant-123456789"]
        }'
    #Lets say Vector Store ID created is vs_123456789. Use this in the next step

    # Create Agent for File Search
    curl --request POST --url 'https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR-PROJECT-NAME/assistants?api-version=v1' \
        -h 'authorization: Bearer $AZURE_AI_AUTH_TOKEN' \ 
        -h 'content-type: application/json' \ 
        -d '{
            "model": "gpt-4o",
            "name": "my-assistant",
            "instructions": "You are a helpful assistant and can search information from uploaded files",
            "tools": [{"type": "file_search"}],
            "tool_resources": {"file_search": {"vector_store_ids": ["vs_123456789"]}}
        }'
    #Lets say agent ID created is asst_123456789. Use this to run the agent

    # Create thread
    curl --request POST --url 'https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR-PROJECT-NAME/threads?api-version=v1' \
        -h 'authorization: Bearer $AZURE_AI_AUTH_TOKEN' \
        -h 'content-type: application/json'
    #Lets say thread ID created is thread_123456789. Use this in the next step

    # Create message using thread ID
    curl --request POST --url 'https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR-PROJECT-NAME/threads/thread_123456789/messages?api-version=v1' \
        -h 'authorization: Bearer $AZURE_AI_AUTH_TOKEN' \
        -h 'content-type: application/json' \
        -d '{
                "role": "user",
                "content": "Hello, what Contoso products do you know?"
            }'

    # Run thread with the agent - use both agent id and thread id
    curl --request POST --url 'https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR-PROJECT-NAME/threads/thread_123456789/runs?api-version=v1' \
        -h 'authorization: Bearer $AZURE_AI_AUTH_TOKEN' \
        -h 'content-type: application/json' \
        --data '{
            "assistant_id": "asst_123456789"
        }'

    # List the messages in the thread using thread ID
    curl --request GET --url 'https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR-PROJECT-NAME/threads/thread_123456789/messages?api-version=v1' \
        -h 'authorization: Bearer $AZURE_AI_AUTH_TOKEN' \
        -h 'content-type: application/json'

    # Delete agent once done using agent id
    curl --request DELETE --url 'https://YOUR-FOUNDRY-RESOURCE-NAME.services.ai.azure.com/api/projects/YOUR-PROJECT-NAME/assistants/asst_123456789?api-version=v1' \
        -h 'authorization: Bearer $AZURE_AI_AUTH_TOKEN' \
        -h 'content-type: application/json'
    ```
  </Tab>

  <Tab title="Foundry portal">
    1. In your agent's **Setup** pane, scroll down if necessary to find **Knowledge**.
    2. Select **Add**.
    3. Select **Files** to upload the product\_info\_1.md file.
    4. Select **Select local files** under **Add files**.
    5. Select **Upload and save**.
    6. Change your agents instructions, such as, "You are a helpful assistant and can search information from uploaded files."
    7. Ask a question, such as, "Hello, what Contoso products do you know?"
    8. To add more files, select the **...** on the AgentVectorStore, then select **Manage**.
  </Tab>
</Tabs>

## Clean up resources

If you no longer need any of the resources you created, delete the resource group associated with your project.

In the Microsoft Foundry portal, select your project name in the top right corner. Then select the link for the resource group to open it in the Azure portal. Select the resource group, and then select **Delete**. Confirm that you want to delete the resource group.

## Related content

* [Quickstart: Create a new agent](../agents/quickstart)
* [Client library overview](../how-to/develop/sdk-overview)