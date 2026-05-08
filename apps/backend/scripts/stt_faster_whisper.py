#!/usr/bin/env python3
import argparse
import json
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description="Local STT worker using faster-whisper")
    parser.add_argument("--audio", required=True, help="Path to audio file")
    parser.add_argument("--model", default="small", help="Whisper model size (tiny/base/small/medium/large)")
    parser.add_argument("--language", default="tr", help="Language code")
    parser.add_argument("--device", default="cpu", help="Inference device (cpu/cuda/auto)")
    parser.add_argument("--compute-type", default="int8", help="Compute type (int8/float16/float32)")
    parser.add_argument("--beam-size", type=int, default=5, help="Beam size for decoding")
    parser.add_argument("--vad-filter", action="store_true", help="Enable VAD filter")
    parser.add_argument(
        "--vad-min-silence-ms", type=int, default=400, help="VAD minimum silence duration in ms"
    )
    parser.add_argument("--temperature", type=float, default=0.0, help="Decoding temperature")
    args = parser.parse_args()

    try:
        from faster_whisper import WhisperModel
    except Exception as exc:
        print(f"faster-whisper import failed: {exc}", file=sys.stderr)
        return 2

    try:
        model = WhisperModel(args.model, device=args.device, compute_type=args.compute_type)
        segments, _ = model.transcribe(
            args.audio,
            language=args.language,
            beam_size=args.beam_size,
            vad_filter=args.vad_filter,
            vad_parameters={"min_silence_duration_ms": args.vad_min_silence_ms},
            temperature=args.temperature,
        )
        text_parts = [seg.text.strip() for seg in segments if seg.text and seg.text.strip()]
        transcript = " ".join(text_parts).strip()
        print(json.dumps({"transcript": transcript}, ensure_ascii=False))
        return 0
    except Exception as exc:
        print(f"transcription failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
