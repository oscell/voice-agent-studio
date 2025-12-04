"use client";

import { useEffect, useRef, useState } from "react";
import { SearchBox } from "./search/SearchBox";

import {
  LiveConnectionState,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
  useDeepgram,
} from "../context/DeepgramContextProvider";
import {
  MicrophoneEvents,
  MicrophoneState,
  useMicrophone,
} from "../context/MicrophoneContextProvider";
import Visualizer from "./Visualizer";
import { algoliasearch } from "algoliasearch";
import { InstantSearch } from "react-instantsearch";
import { AgentWidget } from "./agent/agent";
import { useAgent } from "./agent/use-agent";
const App: () => JSX.Element = () => {

  const { messages, sendMessage } = useAgent();
  const [caption, setCaption] = useState<string | undefined>("");
  const [isStreaming, setIsStreaming] = useState(true);
  const { connection, connectToDeepgram, connectionState } = useDeepgram();
  const {
    setupMicrophone,
    microphone,
    startMicrophone,
    stopMicrophone,
    microphoneState,
  } =
    useMicrophone();
  const captionTimeout = useRef<any>();
  const keepAliveInterval = useRef<any>();

  const algoliaSearchClient = algoliasearch(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID ?? "", process.env.NEXT_PUBLIC_ALGOLIA_API_KEY ?? "");

  useEffect(() => {
    setupMicrophone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { 
    if (microphoneState === MicrophoneState.Ready) {
      connectToDeepgram({
        model: "nova-3",
        interim_results: true,
        smart_format: true,
        filler_words: true,
        utterance_end_ms: 3000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneState]);

  useEffect(() => {
    if (!microphone) return;
    if (!connection) return;

    const onData = (e: BlobEvent) => {
      // iOS SAFARI FIX:
      // Prevent packetZero from being sent. If sent at size 0, the connection will close.
      if (e.data.size > 0) {
        connection?.send(e.data);
      }
    };

    const onTranscript = (data: LiveTranscriptionEvent) => {
      const { is_final: isFinal, speech_final: speechFinal } = data;
      let thisCaption = data.channel.alternatives[0].transcript;

      console.log("thisCaption", thisCaption);
      if (thisCaption !== "") {
        console.log('thisCaption !== ""', thisCaption);
        setCaption(thisCaption);
      }

      if (isFinal && speechFinal) {
        clearTimeout(captionTimeout.current);
        captionTimeout.current = setTimeout(() => {
          setCaption(undefined);
          clearTimeout(captionTimeout.current);
        }, 3000);
      }
    };

    let listenersAttached = false;

    if (connectionState === LiveConnectionState.OPEN && isStreaming) {
      connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
      microphone.addEventListener(MicrophoneEvents.DataAvailable, onData);
      startMicrophone();
      listenersAttached = true;
    } else if (!isStreaming) {
      stopMicrophone();
    }

    return () => {
      if (listenersAttached) {
        // prettier-ignore
        connection.removeListener(LiveTranscriptionEvents.Transcript, onTranscript);
        microphone.removeEventListener(MicrophoneEvents.DataAvailable, onData);
        stopMicrophone();
      }
      clearTimeout(captionTimeout.current);
    };
  }, [
    connectionState,
    isStreaming,
    microphone,
    connection,
    startMicrophone,
    stopMicrophone,
  ]);

  useEffect(() => {
    if (!connection) return;

    if (
      microphoneState !== MicrophoneState.Open &&
      connectionState === LiveConnectionState.OPEN
    ) {
      connection.keepAlive();

      keepAliveInterval.current = setInterval(() => {
        connection.keepAlive();
      }, 10000);
    } else {
      clearInterval(keepAliveInterval.current);
    }

    return () => {
      clearInterval(keepAliveInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneState, connectionState]);

  const toggleStreaming = () => {
    setIsStreaming((prev) => !prev);
  };

  console.log("caption", caption);

  return (
    <>
    <InstantSearch indexName="nextjs-live-transcription" searchClient={algoliaSearchClient} >
      <div className="flex h-full antialiased">
        <div className="flex flex-row h-full w-full overflow-x-hidden">
          <div className="flex flex-col flex-auto h-full">
            {/* height 100% minus 8rem */}
            <SearchBox
              sendMessage={sendMessage}
              caption={caption}
              isStreaming={isStreaming}
              toggleStreaming={toggleStreaming}
            />
            
            <AgentWidget messages={messages} sendMessage={sendMessage} />
            <div className="relative w-full h-full">
              {microphone && <Visualizer microphone={microphone} />}
              <div className="absolute bottom-[8rem]  inset-x-0 max-w-4xl mx-auto text-center">
                {caption && <span className="bg-black/70 p-8">{caption}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
      </InstantSearch>
    </>
  );
};

export default App;
