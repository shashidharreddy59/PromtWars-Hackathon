import json
from fastapi.testclient import TestClient
from server import app
from reel_agent import (
    AntigravityReelAgent,
    ReelRecommendation,
    RecommendationBatch,
    ReelInput,
    ConceptDeepDive,
    VeoVideoExplanation,
    VeoPromptBundle,
    VeoKeyframe
)

def test_pydantic_schema_validation():
    sample = {
        "current_reel": "Reel_01 (Java Semicolon)",
        "interest_detected": "Compiler Lexical Analysis & Abstract Syntax Trees",
        "why": "Frustration with syntax debugging indicates coding friction ready for compiler internals.",
        "recommended_tech_reel": "How Compilers Catch Syntax Errors: Lexing & ASTs",
        "category": "Java",
        "why_this_recommendation": "Elevates syntax debugging to tokenization and AST parsing fundamentals.",
        "difficulty": "Intermediate",
        "confidence": "High"
    }
    rec = ReelRecommendation.model_validate(sample)
    assert rec.category == "Java"
    assert rec.difficulty == "Intermediate"
    assert rec.confidence == "High"
    print("✅ test_pydantic_schema_validation passed")

def test_offline_heuristic_engine():
    agent = AntigravityReelAgent(provider="offline")
    test_reels = [
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

    result = agent.analyze_and_recommend(test_reels)
    assert isinstance(result, RecommendationBatch)
    assert len(result.recommendations) == 3

    # Check categories
    cats = [r.category for r in result.recommendations]
    assert "Java" in cats
    assert "Career" in cats
    assert "Hardware" in cats

    # Check text formatting
    formatted = agent.format_as_schema_text(result.recommendations[0])
    assert "CURRENT REEL:" in formatted
    assert "INTEREST DETECTED:" in formatted
    assert "WHY:" in formatted
    assert "RECOMMENDED TECH REEL:" in formatted
    assert "CATEGORY:" in formatted
    assert "WHY THIS RECOMMENDATION:" in formatted
    assert "DIFFICULTY:" in formatted
    assert "CONFIDENCE:" in formatted

    print("✅ test_offline_heuristic_engine passed")

def test_deep_dive_generator():
    agent = AntigravityReelAgent(provider="offline")
    rec = ReelRecommendation(
        current_reel="Reel_03 (M3 vs RTX 4080)",
        interest_detected="Computer Architecture: ARM vs x86 & Unified Memory",
        why="Benchmark engagement demonstrates interest in computational hardware efficiency.",
        recommended_tech_reel="ARM vs x86 Architecture Explained",
        category="Hardware",
        why_this_recommendation="Connects benchmarks to microarchitecture and instruction sets.",
        difficulty="Intermediate",
        confidence="High"
    )

    deep_dive = agent.generate_deep_dive(rec)
    assert isinstance(deep_dive, ConceptDeepDive)
    assert len(deep_dive.prerequisites) > 0
    assert len(deep_dive.fifteen_minute_challenge) > 10
    print("✅ test_deep_dive_generator passed")

def test_interest_reel_generator_and_deduplication():
    agent = AntigravityReelAgent(provider="offline")
    
    # Generate 4 reels for AI and Cloud
    reels = agent.generate_reels_by_interest(
        interests=["AI", "Cloud"],
        count=4,
        exclude_ids=["exclude_1"],
        exclude_titles=["some excluded title"]
    )
    assert len(reels) == 4
    
    # Verify no duplicate IDs or titles within the batch
    ids = [r["id"] for r in reels]
    titles = [r["title"] for r in reels]
    assert len(set(ids)) == 4
    assert len(set(titles)) == 4

    # Verify strict deduplication when passing existing titles as exclude list
    reels_2 = agent.generate_reels_by_interest(
        interests=["AI"],
        count=2,
        exclude_ids=ids,
        exclude_titles=titles
    )
    for r in reels_2:
        assert r["id"] not in ids
        assert r["title"] not in titles

    print("✅ test_interest_reel_generator_and_deduplication passed")

def test_api_server_endpoints():
    client = TestClient(app)

    # Test static index
    r_index = client.get("/")
    assert r_index.status_code == 200

    # Test presets
    r_presets = client.get("/api/presets")
    assert r_presets.status_code == 200
    presets = r_presets.json().get("presets", [])
    assert len(presets) >= 8

    # Test categories
    r_categories = client.get("/api/categories")
    assert r_categories.status_code == 200
    categories = r_categories.json().get("categories", {})
    assert "AI" in categories and "DSA" in categories

    # Test recommend endpoint
    sample_reel = {
        "reel_id": "Test_01",
        "title": "When AWS us-east-1 goes down",
        "tone": "DevOps outage meme",
        "engagement": "Completed, replayed twice"
    }
    r_rec = client.post("/api/recommend", json={"reels": [sample_reel], "provider": "offline"})
    assert r_rec.status_code == 200
    recs = r_rec.json().get("recommendations", [])
    assert len(recs) == 1
    assert recs[0]["category"] == "HLD"

    # Test deep-dive endpoint
    r_dive = client.post("/api/deep-dive", json={"recommendation": recs[0]})
    assert r_dive.status_code == 200
    dive_data = r_dive.json()
    assert "fifteen_minute_challenge" in dive_data

    # Test next feed reel endpoint
    r_feed = client.post("/api/feed/next", json={
        "current_reel_id": "Reel_04",
        "current_reel_title": "System prompt leak with emojis",
        "current_reel_tone": "Satirical AI prompt leak",
        "watch_time_ms": 12000,
        "replay_count": 3,
        "liked": True,
        "saved": True,
        "shared": True,
        "provider": "offline"
    })
    assert r_feed.status_code == 200
    feed_data = r_feed.json()
    assert "next_reel" in feed_data
    assert "evaluation" in feed_data

    # Test Generate N Reels by Interest Endpoint
    r_gen = client.post("/api/reels/generate-by-interest", json={
        "interests": ["AI", "Cybersecurity"],
        "count": 3,
        "exclude_ids": ["Reel_01", "Reel_02"],
        "exclude_titles": ["POV: You forgot a semicolon in Java and spend 3 hours debugging"],
        "provider": "offline"
    })
    assert r_gen.status_code == 200
    gen_data = r_gen.json()
    assert gen_data["generated_count"] == 3
    assert len(gen_data["reels"]) == 3
    for r in gen_data["reels"]:
        assert r["id"] not in ["Reel_01", "Reel_02"]

    # Test Stream Next Smart Suggestion (Zero Repetition) Endpoint
    r_stream = client.post("/api/reels/stream-next", json={
        "watched_reel_ids": ["reel_01", "reel_02", "reel_03"],
        "watched_titles": ["POV: You forgot a semicolon in Java", "A Day in the Life of a Seattle SWE"],
        "liked_categories": ["AI", "HLD"],
        "inferred_interests": ["Transformer Attention KV-Cache"],
        "completed_last_reel": True,
        "current_reel_id": "reel_03",
        "current_reel_title": "M3 MacBook Pro vs RTX 4080 Laptop",
        "provider": "offline"
    })
    assert r_stream.status_code == 200
    stream_data = r_stream.json()
    assert stream_data["status"] == "success"
    assert stream_data["zero_repeat_guaranteed"] is True
    # Test Gemini Veo AI Video Reel Generation Endpoint
    r_veo_gen = client.post("/api/veo/generate", json={
        "topic": "Distributed Consensus & Raft Leader Election",
        "category": "HLD",
        "provider": "offline"
    })
    assert r_veo_gen.status_code == 200
    veo_gen_data = r_veo_gen.json()
    assert "keyframes" in veo_gen_data
    assert len(veo_gen_data["keyframes"]) >= 3
    assert veo_gen_data["aspect_ratio"] == "9:16"
    assert "veo_prompt_bundle" in veo_gen_data

    # Test Gemini Veo Gallery Endpoint
    r_veo_gal = client.get("/api/veo/gallery")
    assert r_veo_gal.status_code == 200
    gallery_data = r_veo_gal.json()
    assert "gallery" in gallery_data
    assert len(gallery_data["gallery"]) >= 7

    # Test Gemini Veo Prompt Export Endpoint
    r_veo_exp = client.post("/api/veo/prompt-export", json={
        "topic": "FlashAttention 2 & SRAM Tiling",
        "category": "AI"
    })
    assert r_veo_exp.status_code == 200
    exp_data = r_veo_exp.json()
    assert "formatted_studio_prompt" in exp_data
    assert "PROMPT:" in exp_data["formatted_studio_prompt"]
    assert "NEGATIVE PROMPT:" in exp_data["formatted_studio_prompt"]

    # Test Instagram Connection & Like Sync Endpoints
    r_ig_connect = client.post("/api/instagram/connect", json={"username": "shashi_dev", "display_name": "Shashi Developer"})
    assert r_ig_connect.status_code == 200
    ig_connect_data = r_ig_connect.json()
    assert ig_connect_data["status"] == "connected"
    assert ig_connect_data["profile"]["username"] == "shashi_dev"

    r_ig_like = client.post("/api/instagram/like", json={
        "reel_id": "Reel_01",
        "title": "POV: You forgot a semicolon in Java",
        "category": "Java",
        "creator": "@dev_humor",
        "ai_inferred_topic": "Compiler Lexical Analysis & AST Trees"
    })
    assert r_ig_like.status_code == 200
    ig_like_data = r_ig_like.json()
    assert ig_like_data["status"] == "synced"
    assert ig_like_data["liked_reel"]["reel_id"] == "Reel_01"
    assert ig_like_data["total_liked"] >= 1

    r_ig_profile = client.get("/api/instagram/profile")
    assert r_ig_profile.status_code == 200
    ig_profile_data = r_ig_profile.json()
    assert ig_profile_data["connected"] is True
    assert ig_profile_data["username"] == "shashi_dev"
    assert len(ig_profile_data["liked_reels"]) >= 1

    # Test Instagram Suggest Next Endpoint
    r_ig_sug = client.post("/api/instagram/suggest-next", json={
        "liked_reel_ids": ["ig_01"],
        "liked_categories": ["AI", "Hardware"],
        "current_reel_id": "ig_01"
    })
    assert r_ig_sug.status_code == 200
    sug_data = r_ig_sug.json()
    assert sug_data["status"] == "success"
    assert "suggested_reel" in sug_data
    assert "ai_reasoning" in sug_data

    r_ig_disc = client.post("/api/instagram/disconnect")
    assert r_ig_disc.status_code == 200
    assert r_ig_disc.json()["status"] == "disconnected"

    print("✅ test_api_server_endpoints passed")

def test_gemini_veo_engine_and_models():
    agent = AntigravityReelAgent(provider="offline")

    # 1. Test Veo Explanation Generation
    veo = agent.generate_veo_video_explanation(
        topic="Transformer KV-Cache Decoupling & VRAM Footprint",
        category="AI"
    )
    assert isinstance(veo, VeoVideoExplanation)
    assert veo.category == "AI"
    assert veo.aspect_ratio == "9:16"
    assert "4K" in veo.resolution
    assert len(veo.keyframes) >= 3
    assert len(veo.script_narration) >= 3
    assert veo.veo_prompt_bundle is not None
    assert "Cinematic" in veo.veo_prompt_bundle.prompt
    assert "60 FPS" in veo.veo_prompt_bundle.framerate

    # 2. Test Curated Gallery Generation
    gallery = agent.get_curated_veo_gallery()
    assert len(gallery) >= 7
    categories_found = {item.category for item in gallery}
    assert "AI" in categories_found
    assert "HLD" in categories_found
    assert "DSA" in categories_found
    assert "Cybersecurity" in categories_found
    assert "Hardware" in categories_found

    print("✅ test_gemini_veo_engine_and_models passed")

def test_instagram_sync_engine():
    agent = AntigravityReelAgent(provider="offline")
    profile = agent.connect_instagram("alex_coder", "Alex Coder")
    assert profile.username == "alex_coder"
    assert profile.connected is True

    liked = agent.sync_instagram_like(
        reel_id="Reel_03",
        title="M3 MacBook Pro vs RTX 4080",
        category="Hardware",
        creator="@hardware_unboxed"
    )
    assert liked.reel_id == "Reel_03"
    assert len(agent.get_instagram_profile().liked_reels) >= 1

    # Test AI Reel Suggestion
    sug = agent.suggest_instagram_reel(
        liked_reel_ids=["ig_01"],
        liked_categories=["Hardware", "AI"],
        current_reel_id="ig_01"
    )
    assert sug["status"] == "success"
    assert "suggested_reel" in sug
    assert sug["suggested_reel"]["id"] != "ig_01"

    disc = agent.disconnect_instagram()
    assert disc["status"] == "disconnected"
    assert agent.get_instagram_profile().connected is False

    print("✅ test_instagram_sync_engine passed")

if __name__ == "__main__":
    print("\nRunning Antigravity AI Reel Agent Comprehensive Test Suite...\n")
    test_pydantic_schema_validation()
    test_offline_heuristic_engine()
    test_deep_dive_generator()
    test_interest_reel_generator_and_deduplication()
    test_gemini_veo_engine_and_models()
    test_instagram_sync_engine()
    test_api_server_endpoints()
    print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!\n")
