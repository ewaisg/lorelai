"use client";

import { useEffect, useRef } from "react";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { initialArtifactData, useArtifact } from "@/hooks/use-artifact";
import { artifactDefinitions } from "./artifact";
import { useDataStream } from "./data-stream-provider";
import { getChatHistoryPaginationKey } from "./sidebar-history";

export function DataStreamHandler() {
  const { dataStream, setDataStream } = useDataStream();
  const { mutate } = useSWRConfig();

  const { artifact, setArtifact, setMetadata } = useArtifact();
  const isProcessingRef = useRef(false);

  useEffect(() => {
    // Skip if no data or already processing
    if (!dataStream?.length || isProcessingRef.current) {
      return;
    }

    // Mark as processing to prevent race conditions
    isProcessingRef.current = true;

    // Extract deltas and clear the stream immediately
    const deltas = dataStream.slice();
    setDataStream([]);

    // Track if we need to mutate chat history
    let shouldMutateChatHistory = false;

    // Process all deltas
    for (const delta of deltas) {
      // Handle chat title updates (defer mutation until after state updates)
      if (delta.type === "data-chat-title") {
        shouldMutateChatHistory = true;
        continue;
      }

      // Get artifact definition based on current artifact kind
      const artifactDefinition = artifactDefinitions.find(
        (currentArtifactDefinition) =>
          currentArtifactDefinition.kind === artifact.kind
      );

      if (artifactDefinition?.onStreamPart) {
        artifactDefinition.onStreamPart({
          streamPart: delta,
          setArtifact,
          setMetadata,
        });
      }

      setArtifact((draftArtifact) => {
        if (!draftArtifact) {
          return { ...initialArtifactData, status: "streaming" };
        }

        switch (delta.type) {
          case "data-id":
            return {
              ...draftArtifact,
              documentId: delta.data,
              status: "streaming",
            };

          case "data-title":
            return {
              ...draftArtifact,
              title: delta.data,
              status: "streaming",
            };

          case "data-kind":
            return {
              ...draftArtifact,
              kind: delta.data,
              status: "streaming",
            };

          case "data-clear":
            return {
              ...draftArtifact,
              content: "",
              status: "streaming",
            };

          case "data-finish":
            return {
              ...draftArtifact,
              status: "idle",
            };

          default:
            return draftArtifact;
        }
      });
    }

    // Mutate chat history after all state updates complete
    if (shouldMutateChatHistory) {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    }

    // Allow next batch
    isProcessingRef.current = false;
  }, [dataStream, setArtifact, setMetadata, artifact.kind, setDataStream, mutate]);

  return null;
}
