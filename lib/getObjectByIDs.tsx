import { Product, Article } from "@/lib/types/Product";
import { algoliasearch } from "algoliasearch";
import type { Suggestion } from "@/app/components/search/Suggestions";
import type { SummaryWithSourcesInput } from "@/app/components/agent/tools/SummaryWithSourcesTool";

const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID ?? "",
  process.env.NEXT_PUBLIC_ALGOLIA_WRITE_API_KEY ?? ""
);

export async function getObjectsByIds<T extends Product | Article | Suggestion>(
  objectIDs: string[],
  indexName: string
): Promise<T[]> {
  const res = await client.getObjects({
    requests: objectIDs.map((objectID) => ({
      indexName,
      objectID,
    })),
  });

  return res.results as T[];
}

export async function UpdateSuggestion(
  objectID: string,
  result_object_ids?: string[],
  tool_output?: SummaryWithSourcesInput
) {
  console.groupCollapsed("UpdateSuggestion");
  console.log(
    "Updating suggestion: ",
    objectID,
    "result_object_ids",
    result_object_ids,
    "tool_output",
    tool_output
  );
  try {
    const indexName = "news_paper_generic_v2_query_suggestions";

    console.log("Fetching existing suggestion", indexName, objectID);
    // Fetch existing record so we can merge fields instead of overwriting.
    const existing = await client
      .getObject({
        indexName,
        objectID,
      })
      .catch((err) => {
        console.warn("Failed to fetch existing suggestion before save", err);
        return undefined;
      });

    console.log("Existing suggestion", existing);
    console.log(
      "Existing result_object_ids",
      existing && (existing as any).result_object_ids
    );

    const payload = {
      ...(existing ?? {}),
      objectID,
      ...(result_object_ids ? { result_object_ids } : {}),
      ...(tool_output ? { tool_output } : {}),
    };
    console.log("Saving suggestion payload", payload);

    const res = await client.saveObject({
      indexName,
      body: payload,
    });
    console.log("Algolia saveObject response", res);
    if (res.taskID) {
      console.log("Waiting for task", res.taskID);
      await client.waitForTask({
        indexName,
        taskID: res.taskID,
      });
      console.log("Task completed", res.taskID);
    }
  } catch (error) {
    console.error("UpdateSuggestion failed", error);
    throw error;
  } finally {
    console.groupEnd();
  }
  return {
    objectID,
    result_object_ids,
    tool_output,
  };
}
