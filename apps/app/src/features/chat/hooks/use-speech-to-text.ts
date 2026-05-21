"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { authedClient, toApiError } from "@/lib/http/client";

type RecordingState = "idle" | "recording" | "transcribing";

interface UseSpeechToTextResult {
  state: RecordingState;
  error: string | null;
  toggle: () => void;
}

export function useSpeechToText(onTranscript: (text: string) => void): UseSpeechToTextResult {
  const [state, setState] = useState<RecordingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const start = useCallback(async () => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Microphone not supported");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      });

      recorder.addEventListener("stop", () => {
        for (const track of stream.getTracks()) track.stop();
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        setState("transcribing");
        void (async () => {
          try {
            const text = await transcribe(blob);
            if (text) onTranscriptRef.current(text);
          } catch (err) {
            const apiErr = await toApiError(err, "Transcription failed");
            setError(apiErr.message);
          } finally {
            setState("idle");
          }
        })();
      });

      recorder.start();
      recorderRef.current = recorder;
      setState("recording");
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Microphone access denied");
      } else {
        setError("Could not start recording");
      }
    }
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    recorderRef.current = null;
  }, []);

  const toggle = useCallback(() => {
    if (state === "recording") stop();
    else if (state === "idle") void start();
  }, [state, start, stop]);

  return { state, error, toggle };
}

async function transcribe(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", blob, "recording.webm");
  const result = await authedClient
    .post("api/speech/transcribe", { body: form, timeout: 60_000 })
    .json<{ text: string }>();
  return result.text;
}
