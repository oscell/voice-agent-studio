import { Product } from "@/lib/types/Product";
import { algoliasearch } from "algoliasearch";

export async function getObjectsByIds(objectIDs: string[]): Promise<Product[]> {
  const client = algoliasearch(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID ?? "",
    process.env.NEXT_PUBLIC_ALGOLIA_API_KEY ?? ""
  );
  const res = await client.getObjects({
    requests: objectIDs.map((objectID) => ({
      indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME ?? "",
      objectID,
    })),
  });

  return res.results as Product[];
}
