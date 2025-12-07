import { useState } from 'react';
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai';
import { getObjectsByIds } from '@/lib/getObjectByIDs';
import { DisplayItemsInput } from './tools/DisplayItemsTool';
import config from '@/lib/constants';
import { Article, Product } from '@/lib/types/Product';


export const useAgent = () => {
  const { messages, sendMessage, addToolOutput,status } = useChat({
    transport: new DefaultChatTransport({
      api: `https://${process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!}.algolia.net/agent-studio/1/agents/${process.env.NEXT_PUBLIC_ALGOLIA_AGENT_ID!}/completions?stream=true&compatibilityMode=ai-sdk-5`,
      headers: {
        'x-algolia-application-id': process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
        'x-algolia-api-key': process.env.NEXT_PUBLIC_ALGOLIA_API_KEY!,
      },
    }),

    onToolCall: async (toolCall) => {
      console.log(toolCall);
      if (toolCall.toolCall.toolName === "display-items") {
        const input = toolCall.toolCall.input as DisplayItemsInput;
        // Default to products index, but can be extended to support different indices
        const indexName = config.verticals.articles.indexName;
        const products = await getObjectsByIds<Article>(input.objectIDs, indexName);

        console.log("products", products);
        addToolOutput({
          tool: toolCall.toolCall.toolName,
          toolCallId: toolCall.toolCall.toolCallId,
          state: "output-available",
          output: {
            response: products,
          },
        });
      }
    }
  })

  console.log("status", status);

  return { messages, sendMessage, addToolOutput, status }
}