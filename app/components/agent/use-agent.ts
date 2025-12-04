import { useState } from 'react';
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai';
import { getObjectsByIds } from '../search/getObjectByIDs';
import { DisplayItemsInput } from './tools/DisplayItemsTool';


export const useAgent = () => {
  const { messages, sendMessage, addToolOutput } = useChat({
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
        const products = await getObjectsByIds((toolCall.toolCall.input as DisplayItemsInput).objectIDs)

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

  return { messages, sendMessage }
}