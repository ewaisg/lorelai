export interface ChatModel {
  id: string;
  name: string;
  provider: string;
  providerName: string;
  description: string;
}

export function useUserModels() {
  const { useEffect, useMemo, useState } = require("react") as typeof import("react");

  const [models, setModels] = useState<ChatModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/foundry/chat-models");
      if (!res.ok) {
        setModels([]);
        return;
      }
      const data = await res.json();
      setModels(Array.isArray(data.models) ? data.models : []);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to load models"));
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchModels();
  }, []);

  const modelsByProvider = useMemo(() => {
    const grouped: Record<string, ChatModel[]> = {};
    for (const model of models) {
      const key = model.providerName || "Azure AI Foundry";
      grouped[key] ??= [];
      grouped[key].push(model);
    }
    return grouped;
  }, [models]);

  return {
    models,
    providers: [],
    modelsByProvider,
    loading,
    error,
    refetch: fetchModels,
  };
}
