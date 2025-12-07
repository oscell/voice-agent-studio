import { Product, Article } from "@/lib/types/Product";
import { algoliasearch } from "algoliasearch";

export async function getObjectsByIds<T extends Product | Article>(
  objectIDs: string[],
  indexName: string
): Promise<T[]> {
  const client = algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID ?? "",
    process.env.NEXT_PUBLIC_ALGOLIA_API_KEY ?? ""
  );
  const res = await client.getObjects({
    requests: objectIDs.map((objectID) => ({
      indexName,
      objectID,
    })),
  });

  return res.results as T[];
}

