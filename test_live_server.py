import httpx
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_live_server():
    print(f"Testing live server at {BASE_URL}...\n")
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        # 1. Test Static UI index
        r_index = client.get("/")
        assert r_index.status_code == 200
        assert "Gemini Veo" in r_index.text
        print("✅ Live Root UI '/' serves HTML with Gemini Veo Studio elements.")

        # 2. Test Presets & Library
        r_lib = client.get("/api/reels/library")
        assert r_lib.status_code == 200
        reels = r_lib.json().get("reels", [])
        assert len(reels) >= 8
        assert "veo_video_metadata" in reels[0]
        print(f"✅ Live '/api/reels/library' returns {len(reels)} enriched reels with Veo metadata.")

        # 3. Test Veo Gallery
        r_gal = client.get("/api/veo/gallery")
        assert r_gal.status_code == 200
        gallery = r_gal.json().get("gallery", [])
        assert len(gallery) >= 7
        print(f"✅ Live '/api/veo/gallery' returns {len(gallery)} curated 4K Veo masterclasses.")

        # 4. Test Veo Generation Endpoint
        r_gen = client.post("/api/veo/generate", json={
            "topic": "Raft Consensus and Leader Election in Distributed Systems",
            "category": "HLD",
            "provider": "offline"
        })
        assert r_gen.status_code == 200
        veo_data = r_gen.json()
        assert veo_data["aspect_ratio"] == "9:16"
        assert "4K" in veo_data["resolution"]
        assert len(veo_data["keyframes"]) >= 3
        print(f"✅ Live '/api/veo/generate' synthesized Veo 4K reel with {len(veo_data['keyframes'])} keyframes.")

        # 5. Test Veo Prompt Export Endpoint
        r_exp = client.post("/api/veo/prompt-export", json={
            "topic": "Transformer KV-Cache Decoupling",
            "category": "AI"
        })
        assert r_exp.status_code == 200
        exp_data = r_exp.json()
        assert "formatted_studio_prompt" in exp_data
        print("✅ Live '/api/veo/prompt-export' formatted ready-to-use Veo 2 Studio prompt.")

        # 6. Test Feed Next Endpoint
        r_feed = client.post("/api/feed/next", json={
            "current_reel_id": "Reel_01",
            "current_reel_title": "Java Semicolon Meme",
            "current_reel_tone": "Humorous frustration",
            "watch_time_ms": 10000,
            "replay_count": 2,
            "liked": True,
            "saved": True,
            "shared": False,
            "provider": "offline"
        })
        assert r_feed.status_code == 200
        feed_data = r_feed.json()
        assert "veo_video" in feed_data
        assert "veo_video_metadata" in feed_data["next_reel"]
        print("✅ Live '/api/feed/next' synthesized educational bridge with Gemini Veo metadata attached.")

        # 7. Test Instagram Connect & Sync Live Endpoints
        r_ig_c = client.post("/api/instagram/connect", json={"username": "live_tester", "display_name": "Live Tester"})
        assert r_ig_c.status_code == 200
        assert r_ig_c.json()["status"] == "connected"
        print("✅ Live '/api/instagram/connect' linked user @live_tester.")

        r_ig_l = client.post("/api/instagram/like", json={
            "reel_id": "Reel_01",
            "title": "POV: You forgot a semicolon in Java",
            "category": "Java",
            "creator": "@dev_humor",
            "ai_inferred_topic": "Compilers & AST Trees"
        })
        assert r_ig_l.status_code == 200
        assert r_ig_l.json()["status"] == "synced"
        print("✅ Live '/api/instagram/like' recorded liked reel and synced with Instagram profile.")

        r_ig_p = client.get("/api/instagram/profile")
        assert r_ig_p.status_code == 200
        assert r_ig_p.json()["connected"] is True
        print(f"✅ Live '/api/instagram/profile' returned connected profile with {len(r_ig_p.json()['liked_reels'])} liked reels.")

        # 8. Test Instagram AI Agent Suggestion Live Endpoint
        r_ig_s = client.post("/api/instagram/suggest-next", json={
            "liked_reel_ids": ["ig_01"],
            "liked_categories": ["AI", "Hardware"],
            "current_reel_id": "ig_01"
        })
        assert r_ig_s.status_code == 200
        assert r_ig_s.json()["status"] == "success"
        print(f"✅ Live '/api/instagram/suggest-next' AI recommendation: {r_ig_s.json()['suggested_reel']['title']}.")

    print("\n🎉 ALL LIVE SERVER INTEGRATION TESTS PASSED PERFECTLY!\n")

if __name__ == "__main__":
    test_live_server()
