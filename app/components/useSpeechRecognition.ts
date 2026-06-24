"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionErrorCode =
  | "no-speech"
  | "aborted"
  | "audio-capture"
  | "network"
  | "not-allowed"
  | "service-not-available"
  | "bad-grammar"
  | "language-not-supported";

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: {
    isFinal: boolean;
    [index: number]: { transcript: string };
  };
};

type SpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type BrowserSpeechRecognition = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: SpeechRecognitionErrorCode }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const scope = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export type SpeechRecognitionStatus = "idle" | "listening" | "error";

function speechErrorMessage(code: SpeechRecognitionErrorCode): string {
  switch (code) {
    case "not-allowed":
    case "service-not-available":
      return "Microphone access was blocked. Enable it in your browser settings and try again.";
    case "no-speech":
      return "Didn't catch that. Tap the mic and try again.";
    case "audio-capture":
      return "No microphone was found.";
    case "network":
      return "Voice input needs a network connection.";
    case "aborted":
      return "";
    default:
      return "Voice input failed. Try again or type your ask.";
  }
}

export function useSpeechRecognition(onTranscript: (transcript: string) => void) {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<SpeechRecognitionStatus>("idle");
  const [message, setMessage] = useState("");
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const queryBaseRef = useRef("");
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionCtor) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setStatus("listening");
      setMessage("");
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript ?? "";
      }
      const base = queryBaseRef.current.trim();
      const spoken = transcript.trim();
      const next = base && spoken ? `${base} ${spoken}` : base || spoken;
      onTranscriptRef.current(next);
    };

    recognition.onerror = (event) => {
      const text = speechErrorMessage(event.error);
      if (text) {
        setStatus("error");
        setMessage(text);
      } else {
        setStatus("idle");
      }
    };

    recognition.onend = () => {
      setStatus((current) => (current === "error" ? "error" : "idle"));
    };

    recognitionRef.current = recognition;
    setSupported(true);

    return () => {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setStatus("idle");
  }, []);

  const startListening = useCallback(
    async (queryBase: string) => {
      const recognition = recognitionRef.current;
      if (!recognition || status === "listening") return;

      setMessage("");
      queryBaseRef.current = queryBase;

      try {
        if (navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "NotAllowedError") {
          setStatus("error");
          setMessage("Microphone access was blocked. Enable it in your browser settings and try again.");
          return;
        }
        if (error instanceof DOMException && error.name === "NotFoundError") {
          setStatus("error");
          setMessage("No microphone was found.");
          return;
        }
      }

      try {
        recognition.start();
      } catch {
        recognition.stop();
        window.setTimeout(() => {
          try {
            recognition.start();
          } catch {
            setStatus("error");
            setMessage("Voice input is busy. Try again in a moment.");
          }
        }, 120);
      }
    },
    [status]
  );

  const toggleListening = useCallback(
    (queryBase: string) => {
      if (status === "listening") {
        stopListening();
        return;
      }
      void startListening(queryBase);
    },
    [startListening, status, stopListening]
  );

  const clearMessage = useCallback(() => {
    setMessage("");
    setStatus((current) => (current === "error" ? "idle" : current));
  }, []);

  return {
    supported,
    listening: status === "listening",
    status,
    message,
    startListening,
    stopListening,
    toggleListening,
    clearMessage
  };
}
