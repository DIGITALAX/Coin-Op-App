import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  ComfyUIWorkflow,
  SynthPrompt,
  CompositePrompt,
  LibraryStats,
  CreateLibraryItemRequest,
} from "../components/Activity/types/activity.types";
import { useFileStorage } from "../components/Activity/hooks/useFileStorage";
import { initializeDefaultLibrary } from "../lib/defaultLibrary";
import { v4 as uuidv4 } from "uuid";
import {
  LibraryContextType,
  LibraryProviderProps,
} from "../components/Common/types/common.types";

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);
export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
};

export const LibraryProvider = ({ children }: LibraryProviderProps) => {
  const { getItem, setItem } = useFileStorage();
  const [workflows, setWorkflows] = useState<ComfyUIWorkflow[]>([]);
  const [synthPrompts, setSynthPrompts] = useState<SynthPrompt[]>([]);
  const [compositePrompts, setCompositePrompts] = useState<CompositePrompt[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const stats: LibraryStats = {
    workflowsCount: workflows.length,
    synthPromptsCount: synthPrompts.length,
    compositePromptsCount: compositePrompts.length,
  };
  const refreshLibrary = useCallback(async () => {
    try {
      setIsLoading(true);
      const workflowsList =
        (await getItem("library-workflows", undefined, [])) || [];
      const synthPromptsList =
        (await getItem("library-synth-prompts", undefined, [])) || [];
      const compositePromptsList =
        (await getItem("library-composite-prompts", undefined, [])) || [];
      const loadedWorkflows: ComfyUIWorkflow[] = [];
      for (const workflowId of workflowsList) {
        try {
          const workflow = await getItem(
            `workflow-${workflowId}`,
            undefined,
            null
          );
          if (workflow) {
            loadedWorkflows.push(workflow as ComfyUIWorkflow);
          }
        } catch (error) {}
      }
      const loadedSynthPrompts: SynthPrompt[] = [];
      for (const promptId of synthPromptsList) {
        try {
          const prompt = await getItem(
            `synth-prompt-${promptId}`,
            undefined,
            null
          );
          if (prompt) {
            loadedSynthPrompts.push(prompt as SynthPrompt);
          }
        } catch (error) {}
      }
      const loadedCompositePrompts: CompositePrompt[] = [];
      for (const promptId of compositePromptsList) {
        try {
          const prompt = await getItem(
            `composite-prompt-${promptId}`,
            undefined,
            null
          );
          if (prompt) {
            loadedCompositePrompts.push(prompt as CompositePrompt);
          }
        } catch (error) {}
      }
      loadedWorkflows.sort(
        (a, b) =>
          new Date(b.lastModified).getTime() -
          new Date(a.lastModified).getTime()
      );
      loadedSynthPrompts.sort(
        (a, b) =>
          new Date(b.lastModified).getTime() -
          new Date(a.lastModified).getTime()
      );
      loadedCompositePrompts.sort(
        (a, b) =>
          new Date(b.lastModified).getTime() -
          new Date(a.lastModified).getTime()
      );
      setWorkflows(loadedWorkflows);
      setSynthPrompts(loadedSynthPrompts);
      setCompositePrompts(loadedCompositePrompts);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, [getItem]);
  const createWorkflow = useCallback(
    async (
      request: Omit<CreateLibraryItemRequest, "type"> & { data: any }
    ): Promise<ComfyUIWorkflow> => {
      try {
        const workflowId = uuidv4();
        const now = new Date();
        const workflow: ComfyUIWorkflow = {
          id: workflowId,
          name: request.name,
          workflowJson: request.data,
          description: request.description,
          createdAt: now,
          lastModified: now,
          isDefault: false,
        };
        await setItem(`workflow-${workflowId}`, workflow);
        const workflowsList =
          (await getItem("library-workflows", undefined, [])) || [];
        const updatedList = Array.isArray(workflowsList)
          ? [...workflowsList, workflowId]
          : [workflowId];
        await setItem("library-workflows", updatedList);
        await refreshLibrary();
        return workflow;
      } catch (error) {
        throw error;
      }
    },
    [getItem, setItem, refreshLibrary]
  );
  const createSynthPrompt = useCallback(
    async (
      request: Omit<CreateLibraryItemRequest, "type"> & { data: SynthPrompt }
    ): Promise<SynthPrompt> => {
      try {
        const promptId = uuidv4();
        const now = new Date();
        const synthPrompt: SynthPrompt = {
          ...request.data,
          id: promptId,
          name: request.name,
          description: request.description,
          createdAt: now,
          lastModified: now,
          isDefault: false,
        };
        await setItem(`synth-prompt-${promptId}`, synthPrompt);
        const promptsList =
          (await getItem("library-synth-prompts", undefined, [])) || [];
        const updatedList = Array.isArray(promptsList)
          ? [...promptsList, promptId]
          : [promptId];
        await setItem("library-synth-prompts", updatedList);
        await refreshLibrary();
        return synthPrompt;
      } catch (error) {
        throw error;
      }
    },
    [getItem, setItem, refreshLibrary]
  );
  const createCompositePrompt = useCallback(
    async (
      request: Omit<CreateLibraryItemRequest, "type"> & {
        data: CompositePrompt;
      }
    ): Promise<CompositePrompt> => {
      try {
        const promptId = uuidv4();
        const now = new Date();
        const compositePrompt: CompositePrompt = {
          ...request.data,
          id: promptId,
          name: request.name,
          description: request.description,
          createdAt: now,
          lastModified: now,
          isDefault: false,
        };
        await setItem(`composite-prompt-${promptId}`, compositePrompt);
        const promptsList =
          (await getItem("library-composite-prompts", undefined, [])) || [];
        const updatedList = Array.isArray(promptsList)
          ? [...promptsList, promptId]
          : [promptId];
        await setItem("library-composite-prompts", updatedList);
        await refreshLibrary();
        return compositePrompt;
      } catch (error) {
        throw error;
      }
    },
    [getItem, setItem, refreshLibrary]
  );
  const loadWorkflow = useCallback(
    (id: string): ComfyUIWorkflow | null => {
      return workflows.find((w) => w.id === id) || null;
    },
    [workflows]
  );
  const loadSynthPrompt = useCallback(
    (id: string): SynthPrompt | null => {
      return synthPrompts.find((p) => p.id === id) || null;
    },
    [synthPrompts]
  );
  const loadCompositePrompt = useCallback(
    (id: string): CompositePrompt | null => {
      return compositePrompts.find((p) => p.id === id) || null;
    },
    [compositePrompts]
  );
  const deleteWorkflow = useCallback(
    async (id: string) => {
      try {
        await setItem(`workflow-${id}`, null);
        const workflowsList =
          (await getItem("library-workflows", undefined, [])) || [];
        const updatedList = Array.isArray(workflowsList)
          ? workflowsList.filter((wId) => wId !== id)
          : [];
        await setItem("library-workflows", updatedList);
        await refreshLibrary();
      } catch (error) {
        throw error;
      }
    },
    [getItem, setItem, refreshLibrary]
  );
  const deleteSynthPrompt = useCallback(
    async (id: string) => {
      try {
        await setItem(`synth-prompt-${id}`, null);
        const promptsList =
          (await getItem("library-synth-prompts", undefined, [])) || [];
        const updatedList = Array.isArray(promptsList)
          ? promptsList.filter((pId) => pId !== id)
          : [];
        await setItem("library-synth-prompts", updatedList);
        await refreshLibrary();
      } catch (error) {
        throw error;
      }
    },
    [getItem, setItem, refreshLibrary]
  );
  const deleteCompositePrompt = useCallback(
    async (id: string) => {
      try {
        await setItem(`composite-prompt-${id}`, null);
        const promptsList =
          (await getItem("library-composite-prompts", undefined, [])) || [];
        const updatedList = Array.isArray(promptsList)
          ? promptsList.filter((pId) => pId !== id)
          : [];
        await setItem("library-composite-prompts", updatedList);
        await refreshLibrary();
      } catch (error) {
        throw error;
      }
    },
    [getItem, setItem, refreshLibrary]
  );
  useEffect(() => {
    const initializeLibrary = async () => {
      const hasInitialized = await getItem(
        "library-initialized",
        undefined,
        false
      );
      if (!hasInitialized) {
        try {
          await initializeDefaultLibrary(
            createWorkflow,
            createSynthPrompt,
            createCompositePrompt
          );
          await setItem("library-initialized", true);
        } catch (error) {}
      }
      await refreshLibrary();
    };
    initializeLibrary();
  }, [
    refreshLibrary,
    getItem,
    setItem,
    createWorkflow,
    createSynthPrompt,
    createCompositePrompt,
  ]);
  return (
    <LibraryContext.Provider
      value={{
        workflows,
        synthPrompts,
        compositePrompts,
        stats,
        isLoading,
        createWorkflow,
        createSynthPrompt,
        createCompositePrompt,
        loadWorkflow,
        loadSynthPrompt,
        loadCompositePrompt,
        deleteWorkflow,
        deleteSynthPrompt,
        deleteCompositePrompt,
        refreshLibrary,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};
