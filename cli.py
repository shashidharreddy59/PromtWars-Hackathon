import os
import sys
import json
import argparse
from reel_agent import AntigravityReelAgent, ReelInput

def main():
    parser = argparse.ArgumentParser(
        description="Antigravity AI Reel Recommendation Agent CLI - Convert passive reels to foundational tech learning pathways."
    )
    parser.add_argument("--provider", choices=["auto", "gemini", "openai", "offline"], default="auto", help="LLM Provider")
    parser.add_argument("--api-key", help="API Key for Gemini or OpenAI (optional if env var set)")
    parser.add_argument("--model", help="Model name override (e.g. gemini-2.5-flash or gpt-4o)")
    parser.add_argument("--file", help="Path to JSON file containing list of reel objects")
    parser.add_argument("--output", choices=["schema", "json"], default="schema", help="Output format")

    args = parser.parse_args()

    agent = AntigravityReelAgent(
        provider=args.provider,
        api_key=args.api_key,
        model=args.model
    )

    if args.file:
        if not os.path.exists(args.file):
            print(f"Error: File '{args.file}' not found.")
            sys.exit(1)
        with open(args.file, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
            if isinstance(raw_data, list):
                reels_data = raw_data
            elif isinstance(raw_data, dict):
                if "reels" in raw_data and isinstance(raw_data["reels"], list):
                    reels_data = raw_data["reels"]
                elif "presets" in raw_data and isinstance(raw_data["presets"], list):
                    reels_data = raw_data["presets"]
                else:
                    reels_data = [raw_data]
            else:
                reels_data = [raw_data]
    else:
        # Default sample reels
        reels_data = [
            {
                "reel_id": "Reel_01",
                "title": "POV: You forgot a semicolon in Java and spend 3 hours debugging",
                "tone": "Humorous developer frustration with syntax errors",
                "engagement": "Completed, replayed twice"
            },
            {
                "reel_id": "Reel_02",
                "title": "A Day in the Life of a Seattle Software Engineer",
                "tone": "Lifestyle vlog featuring standups, PR reviews, dual monitors",
                "engagement": "Completed, liked"
            },
            {
                "reel_id": "Reel_03",
                "title": "M3 MacBook Pro vs. RTX 4080 Laptop: Real Thermal & Battery Test",
                "tone": "Hardware benchmarks, power draw, and fan noise comparison",
                "engagement": "Saved to bookmarks"
            }
        ]

    print(f"\n=======================================================")
    print(f"🚀 ANTIGRAVITY AI REEL RECOMMENDATION AGENT")
    print(f"Provider: {agent.provider.upper()} | Model: {agent.model}")
    print(f"Analyzing {len(reels_data)} Reel Interactions...")
    print(f"=======================================================\n")

    result = agent.analyze_and_recommend(reels_data)

    if args.output == "json":
        print(json.dumps(result.model_dump(), indent=2))
    else:
        for rec in result.recommendations:
            print(agent.format_as_schema_text(rec))
            print("-" * 55)

if __name__ == "__main__":
    main()
