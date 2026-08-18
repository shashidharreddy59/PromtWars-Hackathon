import os
import json
import re
import random
import uuid
from typing import Literal, List, Optional, Dict, Any, Set
from pydantic import BaseModel, Field
import httpx

# ==========================================
# 1. Strict Schema Definitions
# ==========================================

CategoryType = Literal[
    "AI", "DSA", "Java", "HLD", "Cybersecurity", "Cloud", "Hardware", "Career", "Other"
]
DifficultyType = Literal["Beginner", "Intermediate", "Advanced"]
ConfidenceType = Literal["High", "Medium", "Low"]

class ReelInput(BaseModel):
    reel_id: str = Field(..., description="Unique identifier for the reel (e.g. Reel_01)")
    title: str = Field(..., description="Title or visual description of the reel content")
    tone: Optional[str] = Field(default="", description="Tone or vibe (e.g. humorous, lifestyle, benchmark, news)")
    engagement: Optional[str] = Field(default="Completed", description="User interaction (e.g. Replayed twice, Liked, Saved, Shared)")

class ReelRecommendation(BaseModel):
    current_reel: str = Field(description="Reference to input Reel identifier or title")
    interest_detected: str = Field(description="Specific core technical or engineering topic inferred")
    why: str = Field(description="Concise evidence from the Reel's context, tone, and themes")
    recommended_tech_reel: str = Field(description="Specific, high-signal video title/topic")
    category: CategoryType = Field(description="Engineering category")
    why_this_recommendation: str = Field(
        description="Clear explanation of how this bridges casual interest to real technical depth without hype"
    )
    difficulty: DifficultyType = Field(description="Appropriate technical difficulty")
    confidence: ConfidenceType = Field(description="Confidence rating of inference")

class RecommendationBatch(BaseModel):
    recommendations: List[ReelRecommendation]

class ConceptDeepDive(BaseModel):
    core_concept: str
    target_recommendation: str
    prerequisites: List[str]
    fifteen_minute_challenge: str
    industry_relevance: str
    key_takeaways: List[str]

class GeneratedReel(BaseModel):
    id: str
    type: str = "casual"
    creator: str
    avatar: str
    audio: str
    title: str
    description: str
    tone: str
    likes: int
    comments: int
    shares: int
    tag: str
    category: CategoryType = "Other"
    theme: str = "code"
    animation_data: Dict[str, Any] = Field(default_factory=dict)
    recommendation_metadata: Optional[Dict[str, Any]] = None
    deep_dive_metadata: Optional[Dict[str, Any]] = None

class VeoPromptBundle(BaseModel):
    prompt: str = Field(description="Production-ready Gemini Veo 2 video prompt with 4K raytraced camera directions")
    negative_prompt: str = Field(default="clickbait, blurry, 2D generic cartoon, low resolution, watermark, low quality, artifacting, noisy")
    aspect_ratio: str = Field(default="9:16", description="Vertical short-form aspect ratio for reels")
    resolution: str = Field(default="4K UHD (2160x3840)")
    framerate: str = Field(default="60 FPS")
    camera_motion: str = Field(default="FPV Dolly Push & Orbital 3D Scan")
    lighting_shader: str = Field(default="Volumetric Raytraced Global Illumination")
    color_grading: str = Field(default="Cyberpunk Dark Slate & Laser Cyan")

class VeoKeyframe(BaseModel):
    timestamp_sec: float
    title: str
    visual_description: str
    technical_annotation: str
    voiceover_line: str
    camera_hud: str = "CAM_01 [ORBIT 45°]"
    subtitles: str = ""

class VeoVideoExplanation(BaseModel):
    video_id: str
    concept_title: str
    category: CategoryType
    veo_prompt: str
    veo_prompt_bundle: VeoPromptBundle
    duration_seconds: int = 15
    aspect_ratio: str = "9:16"
    resolution: str = "4K UHD (60fps)"
    render_style: str = "3D Cinematic Raytraced Cyber-Engineering"
    script_narration: List[str]
    keyframes: List[VeoKeyframe]
    interactive_simulation: Dict[str, Any] = Field(default_factory=dict)
    summary: str = ""
    model_used: str = "Google Gemini Veo 2 + 2.5 Flash"

# ==========================================
# 2. Instagram Sync Data Models
# ==========================================

class InstagramLikedReel(BaseModel):
    reel_id: str
    title: str
    category: str
    creator: str
    liked_at: str
    ai_inferred_topic: Optional[str] = None
    ai_bridge_topic: Optional[str] = None

class InstagramUserProfile(BaseModel):
    username: str
    display_name: str
    avatar: str = "📸"
    bio: str = "Tech & Computer Science Explorer"
    connected: bool = True
    connected_at: str
    liked_reels: List[InstagramLikedReel] = Field(default_factory=list)
    sync_enabled: bool = True

# ==========================================
# 3. Built-in High-Signal Deterministic Knowledge Base
# ==========================================

OFFLINE_KNOWLEDGE_PATTERNS = [
    {
        "keywords": ["semicolon", "java", "nullpointer", "syntax", "curly brace", "compilation", "jvm", "garbage"],
        "interest": "Compiler Lexical Analysis, AST Generation & JVM Bytecode Mechanics",
        "why": "Engagement with syntax frustration indicates practical coding friction; bridging syntax quirks to compiler parsing mechanics elevates casual debugging to computer science fundamentals.",
        "rec": "How Compilers Find Syntax Errors: Lexing, Parsing & Abstract Syntax Trees (ASTs)",
        "category": "Java",
        "why_rec": "Bridges the annoyance of syntax errors into an understanding of tokenization, recursive descent parsing, and how static analyzers flag bugs before execution.",
        "difficulty": "Intermediate",
        "confidence": "High"
    },
    {
        "keywords": ["day in the life", "seattle", "standup", "swe", "pr review", "vlog", "office", "coffee", "career", "salary"],
        "interest": "Software Engineering Collaboration, Code Review Protocols & CI/CD Pipelines",
        "why": "Engagement with developer lifestyle and workplace habits signals interest in how engineering teams operate at scale beyond isolated single-file coding.",
        "rec": "From Pull Request to Production: How Automated CI/CD Pipelines Guard Large Codebases",
        "category": "Career",
        "why_rec": "Channels curiosity about daily developer life into concrete knowledge of branch protection, regression test suites, and automated deployment architectures.",
        "difficulty": "Beginner",
        "confidence": "High"
    },
    {
        "keywords": ["m3", "rtx 4080", "battery", "thermal", "laptop", "macbook", "fan noise", "benchmark", "fps", "gpu", "cpu", "arm", "x86"],
        "interest": "Computer Architecture: ARM vs. x86, Unified Memory & Thermal Throttling",
        "why": "Attention to power draw, benchmarks, and cooling reveals interest in hardware performance limits, instructions per cycle, and chip efficiency.",
        "rec": "ARM vs. x86 Microarchitecture: Instruction Sets, Memory Bandwidth & TDP Explained",
        "category": "Hardware",
        "why_rec": "Elevates consumer gadget benchmark comparisons into foundational processor microarchitecture, RISC vs CISC execution pipelines, and unified memory advantages.",
        "difficulty": "Intermediate",
        "confidence": "High"
    },
    {
        "keywords": ["chatgpt", "deepseek", "llm", "ai", "prompt", "hallucination", "token", "leak", "gemini", "transformer", "attention", "rag", "embeddings", "vector"],
        "interest": "Transformer Attention Mechanisms, KV-Caching & Token Generation Dynamics",
        "why": "Consuming AI memes or prompt exploits demonstrates familiarity with generative model behaviors; the natural progression is understanding attention math and context limits.",
        "rec": "Under the Hood of Transformers: Self-Attention Math, Context Windows & KV-Cache Latency",
        "category": "AI",
        "why_rec": "Replaces superficial prompt-engineering hype with rigorous mathematical and architectural intuition behind transformer layers, decoding bottlenecks, and vector embeddings.",
        "difficulty": "Advanced",
        "confidence": "High"
    },
    {
        "keywords": ["hacker", "password", "dark web", "breach", "phishing", "leak", "cyber", "wifi", "vpn", "sniff", "buffer overflow", "mitm"],
        "interest": "Cryptographic Key Exchange, TLS Handshakes & Network Packet Analysis",
        "why": "Curiosity regarding security vulnerabilities or hacking tropes is best directed toward defensive protocols and network packet inspection fundamentals.",
        "rec": "Inside the TLS 1.3 Handshake: How Asymmetric Cryptography Secures Plaintext Traffic",
        "category": "Cybersecurity",
        "why_rec": "Demystifies Hollywood hacking dramatization by providing concrete, packet-level understanding of public-key cryptography, Diffie-Hellman exchanges, and forward secrecy.",
        "difficulty": "Intermediate",
        "confidence": "High"
    },
    {
        "keywords": ["lag", "server down", "crash", "cloud", "aws", "outage", "scale", "million users", "database", "raft", "distributed", "consensus", "kafka", "redis"],
        "interest": "Distributed Systems: CAP Theorem, Partitioning & Load Balancing Strategies",
        "why": "Interest in service outages and server downtime reflects an intuitive curiosity about high availability and infrastructure resiliency under load.",
        "rec": "Designing for High Availability: Consistent Hashing, Health Checks & Circuit Breakers",
        "category": "HLD",
        "why_rec": "Transforms outage amusement into systematic high-level system design principles, fault tolerance, and graceful degradation patterns.",
        "difficulty": "Advanced",
        "confidence": "High"
    },
    {
        "keywords": ["leet", "interview", "invert binary tree", "array", "recursion", "dsa", "two sum", "graph", "dp", "dynamic programming", "btree"],
        "interest": "Algorithmic Complexity, Tree Traversals & Cache Locality in Memory",
        "why": "Engagement with coding interview stress highlights awareness of technical screening algorithms; grounding this in memory layout and traversal optimality deepens retention.",
        "rec": "Beyond LeetCode Patterns: How CPU Cache Lines Impact Array vs. Linked List Traversal",
        "category": "DSA",
        "why_rec": "Connects abstract algorithmic time complexity directly to underlying CPU memory hierarchy, L1/L2 cache hits, and real-world execution speed.",
        "difficulty": "Intermediate",
        "confidence": "High"
    },
    {
        "keywords": ["docker", "kubernetes", "deploy", "server", "port", "localhost", "container", "linux", "cgroup", "namespace", "overlayfs"],
        "interest": "Linux Namespaces, Cgroups & Container Runtime Internals",
        "why": "Interest in containers and port mapping warrants exploring how operating system kernels isolate processes without full hardware virtualization.",
        "rec": "How Containers Actually Work: Linux Namespaces, Cgroups & OverlayFS from Scratch",
        "category": "Cloud",
        "why_rec": "Bridges simple docker CLI usage to core Linux kernel primitives, providing genuine systems engineering depth instead of cloud vendor lock-in trivia.",
        "difficulty": "Intermediate",
        "confidence": "High"
    },
    {
        "keywords": ["database", "postgres", "mysql", "sql", "lsm", "b-tree", "wal", "index", "acid", "shard"],
        "interest": "Storage Engine Internals: B-Trees, LSM-Trees & Write-Ahead Logs",
        "why": "Interest in database queries and write bottlenecks points to storage engine mechanics and disk I/O optimization.",
        "rec": "Why Databases Never Overwrite Data in Place: Write-Ahead Logs & Crash Recovery",
        "category": "HLD",
        "why_rec": "Connects SQL query performance to disk block layout, append-only journals, and transactional ACID atomicity.",
        "difficulty": "Advanced",
        "confidence": "High"
    },
    {
        "keywords": ["webassembly", "wasm", "rust", "c++", "v8", "browser", "jit", "canvas", "engine"],
        "interest": "Browser Engine Virtual Machines, JIT Compilation & Linear Memory",
        "why": "Interest in high-speed web apps and native languages in browsers relates directly to virtual machine bytecode pipelines.",
        "rec": "Inside Browser JIT Compilers: How V8 TurboFan Generates Native Machine Code",
        "category": "Other",
        "why_rec": "Explores how modern browsers compile and optimize WebAssembly and JavaScript into bare-metal CPU instructions.",
        "difficulty": "Intermediate",
        "confidence": "High"
    }
]

# ==========================================
# 4. Comprehensive Procedural Reel Generator Pool
# ==========================================

PROCEDURAL_REEL_TEMPLATES = [
    # AI / ML
    {
        "category": "AI",
        "tag": "AI & LLM Architecture",
        "creator": "@neural_nexus",
        "avatar": "🧠",
        "audio": "Synthwave Cyber Pulse - Attention Is All You Need",
        "theme": "ai",
        "titles": [
            "Why your LLM context window eats 32GB of VRAM: KV-Cache explained",
            "How FlashAttention 2 doubled LLM training speed with SRAM tiling",
            "Why vector embeddings with cosine similarity fail without Dot-Product scaling",
            "Inside LoRA: Fine-tuning a 70B parameter model with only 0.1% trainable weights",
            "Why RLHF makes AI models sycophantic: Reward hacking in policy gradients",
            "How Mixture-of-Experts (MoE) activates only 39B out of 236B parameters per token"
        ],
        "tones": [
            "Deep visual breakdown of memory bottlenecks during autoregressive token generation",
            "Hardware-aware GPU memory hierarchy optimization for deep learning models",
            "Mathematical intuition behind high-dimensional vector search and metric geometry",
            "Parameter-efficient low-rank adaptation matrix decomposition masterclass",
            "Reinforcement learning alignment mechanics and loss function dynamics"
        ],
        "animation_data": {
            "prompt_text": "Transformer Decoder Stage:\nLayer 32: Q @ K.T -> Softmax Scaled Attention -> KV Cache VRAM: 18.4 GB",
            "tokens": 8192
        }
    },
    # DSA / Algorithms
    {
        "category": "DSA",
        "tag": "Algorithmic Engineering",
        "creator": "@algo_mastery",
        "avatar": "⚡",
        "audio": "Fast 8-Bit Chiptune - Binary Heap Sort",
        "theme": "dsa",
        "titles": [
            "Why QuickSort beats MergeSort in practice despite O(N^2) worst case",
            "How B-Trees minimize disk page faults with wide branching factors",
            "Dijkstra vs A* Search: How heuristics prune 90% of graph search spaces",
            "Why Hash Tables degrade to O(N) during Robin Hood collision clustering",
            "Red-Black Tree balance invariants: 2-3 Tree isomorphism in 60 seconds",
            "How Bit Manipulation (Popcount & Bitsets) speeds up Graph Cliques by 64x"
        ],
        "tones": [
            "Algorithmic complexity tied to CPU L1/L2 cache locality and memory locality",
            "Storage-aware tree structures designed for block storage and SSD pages",
            "Pathfinding optimization, graph search pruning, and admissible heuristics",
            "Memory layout and amortized hash table resizing mechanics"
        ],
        "animation_data": {
            "complexity": "Array Locality: 64B Cache Line Hit (99.2%) vs Pointer Chasing (42.1%)",
            "tree_state": "Traversing L1 Cache: [0x7ffe00] -> [0x7ffe40] Sequential Burst"
        }
    },
    # Java / JVM / Backend
    {
        "category": "Java",
        "tag": "JVM & Backend Systems",
        "creator": "@jvm_internals",
        "avatar": "☕",
        "audio": "Lo-Fi Beats for JIT Compilation",
        "theme": "code",
        "titles": [
            "How Java Virtual Threads (Project Loom) handle 1 Million concurrent sockets",
            "Inside C2 JIT Compiler: Escape Analysis and Scalar Replacement of Objects",
            "Why ZGC achieves sub-millisecond Stop-The-World garbage collection pauses",
            "How JVM Bytecode verification prevents memory corruption without C++ segfaults",
            "Understanding Memory Barriers and Happens-Before ordering in Java Concurrency",
            "Why Netty epoll event loops outperform standard Java blocking IO by 10x"
        ],
        "tones": [
            "Low-level JVM runtime execution, continuation stacks, and kernel thread mapping",
            "JIT compiler assembly optimizations, inlining, and loop unrolling",
            "Concurrent garbage collector compaction, colored pointers, and load barriers"
        ],
        "animation_data": {
            "snippet": "public void runVirtualThread() {\n    Thread.startVirtualThread(() -> {\n        // Unmounts carrier thread on IO blocking!\n        socket.read(buffer);\n    });\n}",
            "error_msg": "JIT C2: Inlined scalar replacement -> 0 heap allocations on HotSpot VM"
        }
    },
    # HLD / Distributed Systems
    {
        "category": "HLD",
        "tag": "High Level System Design",
        "creator": "@scale_architect",
        "avatar": "🏗️",
        "audio": "Epic Orchestral Drop - Distributed Consensus",
        "theme": "outage",
        "titles": [
            "How Kafka achieves 2 Million writes/sec using OS Page Cache & Zero-Copy DMA",
            "Preventing Cascading Failures with Circuit Breakers and Exponential Backoff Jitter",
            "Why Distributed Transactions use 2-Phase Commit (and why everyone avoids it)",
            "How Consistent Hashing with Virtual Nodes balances DynamoDB partitions",
            "Inside Twitter's Snowflake ID Generator: 64-bit unique timestamp ordering",
            "How CDN Anycast Routing directs 100M requests to the nearest edge PoP"
        ],
        "tones": [
            "High-throughput distributed streaming architecture and Linux sendfile zero-copy",
            "Resilience engineering, fault domains, bulkhead patterns, and graceful degradation",
            "Distributed consensus, partition tolerance, and eventual consistency trade-offs"
        ],
        "animation_data": {
            "status": "DISTRIBUTED CLUSTER: 12 Shards across 3 Availability Zones",
            "uptime": "99.999% SLA Maintained | P99 Latency: 4.2ms",
            "affected": ["Partition 04: Rebalanced", "Virtual Nodes: 256 per ring"]
        }
    },
    # Cybersecurity
    {
        "category": "Cybersecurity",
        "tag": "Security & Cryptography",
        "creator": "@cyber_sentinel",
        "avatar": "🛡️",
        "audio": "Dark Web Ambient Pulse - Zero Trust",
        "theme": "cyber",
        "titles": [
            "How Elliptic Curve Cryptography (ECDSA) replaces 4096-bit RSA keys with 256 bits",
            "How Timing Attacks leak Secret Keys via CPU branch execution variances",
            "Understanding Return-Oriented Programming (ROP) gadgets to bypass W^X memory",
            "Why SQL Injection still exists in 2026: Prepared Statement tokenization flaws",
            "Inside OAuth 2.0 PKCE: How Proof Key for Code Exchange secures mobile apps",
            "How Zero-Knowledge Proofs (zk-SNARKs) verify data without revealing contents"
        ],
        "tones": [
            "Mathematical cryptographic primitives, discrete logarithms on elliptic curves",
            "Low-level memory exploitation mitigation, ASLR, stack canaries, and ROP chains",
            "Authentication security protocols, token exchange, and cryptographic handshakes"
        ],
        "animation_data": {
            "sniffed_packet": "TLS 1.3 ECDHE Exchange: Curve25519 Ephemeral Key Agreement Verified"
        }
    },
    # Cloud & DevOps
    {
        "category": "Cloud",
        "tag": "Cloud & Linux Primitives",
        "creator": "@kernel_cloud",
        "avatar": "☁️",
        "audio": "Techno Beat - Linux Namespace Loop",
        "theme": "container",
        "titles": [
            "Building a Container from Scratch in 50 lines of C with clone() and pivot_root",
            "Why Kubernetes Pod Networking uses CNI plugins, veth pairs, and iptables NAT",
            "How Linux eBPF runs sandboxed bytecode directly inside the OS Kernel",
            "Understanding Linux OOM Killer: How cgroup memory limits trigger SIGKILL",
            "How gRPC over HTTP/2 multiplexes 10,000 microservice RPC calls on one TCP socket",
            "Why Serverless Cold Starts happen: V8 Isolate initialization vs MicroVM Boot"
        ],
        "tones": [
            "Deep dive into Linux kernel process isolation, virtual ethernet, and routing tables",
            "Kernel observability and packet filtering with extended Berkeley Packet Filters",
            "Microservice transport protocols, binary protobuf serialization, and framing"
        ],
        "animation_data": {
            "network_err": "eBPF Hook attached to XDP layer -> Filtered 1.2M malicious SYN packets",
            "bridge": "cgroup v2: memory.max=512MB | cpu.weight=100 | namespaces: [pid, net, ipc]"
        }
    },
    # Hardware & Microarchitecture
    {
        "category": "Hardware",
        "tag": "Hardware & Microarchitecture",
        "creator": "@silicon_architect",
        "avatar": "💻",
        "audio": "Heavy Industrial Synth - Matrix Core",
        "theme": "benchmark",
        "titles": [
            "How CPU Branch Predictors use Two-Level Adaptive Tables to hit 99% accuracy",
            "Why Modern GPUs have Tensor Cores with FP16/INT8 Mixed-Precision Matrix Units",
            "Understanding Cache Coherency: The MESI Protocol across 64 CPU cores",
            "Why PCIe 5.0 needs Re-timers: High-frequency signal attenuation over copper PCB",
            "How Out-of-Order Execution Engines use Reorder Buffers to prevent CPU pipeline stalls",
            "Why Unified Memory on Apple Silicon achieves 800 GB/s bandwidth for LLMs"
        ],
        "tones": [
            "Microarchitecture pipeline stages, instruction decoding, branch prediction, and ALU execution",
            "Massively parallel SIMT architectures, memory bandwidth bottlenecks, and tensor units",
            "Hardware bus topologies, interconnects, and silicon packaging technologies"
        ],
        "animation_data": {
            "m3_watts": "SoC Memory Bus: 819.2 GB/s Bandwidth (Unified LPDDR5X)",
            "rtx_watts": "PCIe Gen 5 x16 Bus: 64 GB/s Interconnect Latency",
            "m3_temp": "41°C Peak",
            "rtx_temp": "78°C Peak",
            "m3_fps": "Zero Inter-Chip Latency",
            "rtx_fps": "Discrete VRAM Swapping"
        }
    },
    # Career & Engineering Practices
    {
        "category": "Career",
        "tag": "Engineering Practice & Scale",
        "creator": "@staff_eng_notes",
        "avatar": "🚀",
        "audio": "Inspiring Ambient Beat - Production Architecture",
        "theme": "vlog",
        "titles": [
            "How Staff Engineers write Architecture Decision Records (ADRs) that save millions",
            "The True Cost of Technical Debt: How Monolith-to-Microservice rewrites fail",
            "How Google conducts Blameless Post-Mortems to prevent systemic outages",
            "Writing High-Leverage Unit Tests with Property-Based Testing (Hypothesis/QuickCheck)",
            "Semantic Versioning and Zero-Downtime Database Schema Migrations (Expand/Contract)"
        ],
        "tones": [
            "Production engineering leadership, architectural decision-making, and organizational scale",
            "Reliability engineering culture, blameless RCAs, and incident mitigation",
            "Software quality engineering, backward compatibility, and continuous evolution"
        ],
        "animation_data": {
            "schedule": [
                "10:00 AM - Architecture Review Board 📐",
                "11:30 AM - Zero-Downtime Migration (Expand Stage) 🔄",
                "02:00 PM - Blameless Post-Mortem RCA 🛡️",
                "04:00 PM - Production Canary Deployment (5% Traffic) 🚀"
            ]
        }
    }
]


# ==========================================
# 5. Core AntigravityReelAgent
# ==========================================

SYSTEM_PROMPT = """You are an expert AI Content Recommendation Agent designed to optimize short-form video consumption for students.
Your task is to analyze user engagement with short-form Reels (entertainment, memes, lifestyle, gaming, tech news) and convert passive entertainment habits into high-signal, educational tech learning pathways.

Core Operational Guidelines:
1. Deep Context Inference (Avoid Shallow Matching):
   - Do NOT map basic keywords directly (e.g., watching a Java syntax meme must NOT simply return another generic Java syntax video).
   - Infer the root technical discipline (e.g., compiler mechanics, systems architecture, algorithmic complexity, networking, distributed systems, Linux kernel primitives).

2. Anti-Hype & Anti-Clickbait Filter:
   - Strictly prohibit recommending superficial hype content (e.g., "Top 10 AI Tools to Get Rich," "Learn Coding in 5 Minutes," "ChatGPT Hacks").
   - All recommendations must focus on core computer science, systems design, software engineering best practices, or practical technical workflows.

3. Scaffolding & Bridging:
   - The recommendation must act as a natural bridge from the watched reel's topic to an educational concept.
   - Assign appropriate difficulty levels based on the conceptual depth inferred from the reel.

You must output a valid JSON object matching the requested schema with a list of 'recommendations'."""

class AntigravityReelAgent:
    def __init__(
        self,
        provider: Literal["auto", "gemini", "openai", "offline"] = "auto",
        api_key: Optional[str] = None,
        model: Optional[str] = None
    ):
        self.gemini_key = os.getenv("GEMINI_API_KEY") or (api_key if provider == "gemini" else None)
        self.openai_key = os.getenv("OPENAI_API_KEY") or (api_key if provider in ("openai", "auto") else None)
        
        # Override with explicit api_key if supplied
        if api_key:
            if provider == "gemini" or (api_key.startswith("AIza") or "gemini" in (model or "").lower()):
                self.gemini_key = api_key
            else:
                self.openai_key = api_key

        self.provider = provider
        if self.provider == "auto":
            if self.gemini_key:
                self.provider = "gemini"
            elif self.openai_key:
                self.provider = "openai"
            else:
                self.provider = "offline"

        self.model = model or ("gemini-2.5-flash" if self.provider == "gemini" else "gpt-4o")

    def _call_openai(self, reels_data: List[Dict[str, Any]]) -> RecommendationBatch:
        from openai import OpenAI
        client = OpenAI(api_key=self.openai_key)
        user_content = json.dumps(reels_data, indent=2)

        response = client.beta.chat.completions.parse(
            model=self.model if "gpt" in self.model else "gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Analyze these student reel interactions and generate recommendations:\n{user_content}"
                }
            ],
            response_format=RecommendationBatch,
            temperature=0.2
        )
        return response.choices[0].message.parsed

    def _call_gemini(self, reels_data: List[Dict[str, Any]]) -> RecommendationBatch:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.gemini_key}"
        user_content = json.dumps(reels_data, indent=2)

        prompt = f"{SYSTEM_PROMPT}\n\nUser Reel History to Analyze:\n{user_content}\n\nRespond ONLY with valid JSON conforming to the RecommendationBatch schema: {{\"recommendations\": [...]}}"
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }
        
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            cleaned_text = re.sub(r"^```(?:json)?\s*", "", raw_text.strip())
            cleaned_text = re.sub(r"\s*```$", "", cleaned_text.strip())
            parsed_json = json.loads(cleaned_text)
            return RecommendationBatch.model_validate(parsed_json)

    def _offline_heuristic_engine(self, reels_data: List[Dict[str, Any]]) -> RecommendationBatch:
        """High-signal, deterministic rule & pattern engine for offline use and zero-latency demos."""
        recs: List[ReelRecommendation] = []

        for reel in reels_data:
            reel_id = reel.get("reel_id") or "Reel_Unknown"
            title = reel.get("title", "")
            tone = reel.get("tone", "")
            engagement = reel.get("engagement", "Viewed")
            combined_text = f"{title} {tone}".lower()

            matched_pattern = None
            for pat in OFFLINE_KNOWLEDGE_PATTERNS:
                if any(kw in combined_text for kw in pat["keywords"]):
                    matched_pattern = pat
                    break

            if not matched_pattern:
                matched_pattern = {
                    "interest": "Software System Architecture & Engineering Principles",
                    "why": f"Engagement ({engagement}) with '{title}' reflects curious technical exploration; scaffolding towards core software systems design provides high educational leverage.",
                    "rec": "Core Engineering Patterns: Separation of Concerns, Modularity & Maintainability",
                    "category": "HLD",
                    "why_rec": "Provides high-signal software design principles to structure practical programming projects.",
                    "difficulty": "Beginner",
                    "confidence": "Medium"
                }

            conf: ConfidenceType = matched_pattern.get("confidence", "High")
            if "replay" in engagement.lower() or "save" in engagement.lower() or "twice" in engagement.lower():
                conf = "High"
            elif "skip" in engagement.lower():
                conf = "Low"

            rec_obj = ReelRecommendation(
                current_reel=f"{reel_id} ({title})",
                interest_detected=matched_pattern["interest"],
                why=matched_pattern["why"],
                recommended_tech_reel=matched_pattern["rec"],
                category=matched_pattern["category"],
                why_this_recommendation=matched_pattern["why_rec"],
                difficulty=matched_pattern["difficulty"],
                confidence=conf
            )
            recs.append(rec_obj)

        return RecommendationBatch(recommendations=recs)

    def analyze_and_recommend(self, user_feed_history: List[Dict[str, Any]]) -> RecommendationBatch:
        """Main inference method with automatic fallback to offline heuristic engine on error or missing keys."""
        if not user_feed_history:
            return RecommendationBatch(recommendations=[])

        clean_data = []
        for item in user_feed_history:
            if isinstance(item, BaseModel):
                clean_data.append(item.model_dump())
            elif isinstance(item, dict):
                clean_data.append(item)
            else:
                clean_data.append({"reel_id": "Reel", "title": str(item)})

        if self.provider == "openai" and self.openai_key:
            try:
                return self._call_openai(clean_data)
            except Exception as e:
                print(f"[Agent Warning] OpenAI call failed: {e}. Falling back to offline heuristic engine.")
                return self._offline_heuristic_engine(clean_data)

        elif self.provider == "gemini" and self.gemini_key:
            try:
                return self._call_gemini(clean_data)
            except Exception as e:
                print(f"[Agent Warning] Gemini call failed: {e}. Falling back to offline heuristic engine.")
                return self._offline_heuristic_engine(clean_data)

        return self._offline_heuristic_engine(clean_data)

    def generate_deep_dive(self, rec: ReelRecommendation) -> ConceptDeepDive:
        """Generate a scaffolded deep dive for a recommended topic with prerequisites and a 15-minute challenge."""
        category_map = {
            "Java": {
                "prereqs": ["Basic Imperative Programming", "Compiled vs. Interpreted Language Models", "Stack & Heap Basics"],
                "challenge": "Write a 20-line recursive tokenizer in Python or Java that splits an arithmetic string (e.g. '3 + 4 * 2') into numeric and operator tokens.",
                "relevance": "Used in every compiler, IDE syntax highlighter, linter (ESLint/SpotBugs), and domain-specific query engine."
            },
            "Career": {
                "prereqs": ["Git Branching & Merges", "Basic Automated Unit Tests", "HTTP/REST Basics"],
                "challenge": "Configure a GitHub Actions workflow YAML file that triggers unit tests and a linter on every Pull Request to the main branch.",
                "relevance": "Standard engineering practice at Google, Microsoft, and high-growth startups to prevent broken code from hitting production."
            },
            "Hardware": {
                "prereqs": ["Binary & Logic Gates", "CPU Registers and ALUs", "Memory Latency Hierarchy (L1 vs RAM)"],
                "challenge": "Measure memory sequential vs random array access speed in C/Python to see cache hit latency differences firsthand.",
                "relevance": "Essential for high-performance computing, game engines, AI model inference optimization, and systems programming."
            },
            "AI": {
                "prereqs": ["Matrix Multiplication", "Softmax Function", "Vector Embeddings & Cosine Similarity"],
                "challenge": "Implement single-head self-attention math in NumPy using dot-product attention formula: softmax(Q @ K.T / sqrt(d_k)) @ V.",
                "relevance": "The fundamental engine powering every Modern LLM, Claude, GPT-4, and Vision Transformer."
            },
            "Cybersecurity": {
                "prereqs": ["TCP/IP 3-Way Handshake", "Symmetric vs Asymmetric Ciphers", "Public Key Infrastructure (PKI)"],
                "challenge": "Use Wireshark or `curl -v` on an HTTPS URL to observe TLS ClientHello, ServerHello, and Certificate negotiation packets.",
                "relevance": "Critical for zero-trust infrastructure, payment processing security, and penetration testing."
            },
            "HLD": {
                "prereqs": ["Stateless vs Stateful Services", "Database Indexing & Sharding", "DNS and Reverse Proxies"],
                "challenge": "Sketch a whiteboard diagram for a URL shortener handling 10k writes/sec with Redis caching and Consistent Hashing.",
                "relevance": "The backbone of distributed scale at Netflix, Uber, and large cloud systems."
            },
            "DSA": {
                "prereqs": ["Big-O Time & Space Notation", "Pointers and Memory References", "Recursion Trees"],
                "challenge": "Implement a binary search tree insertion and preorder traversal, then benchmark against an array binary search.",
                "relevance": "Powers database B-Trees, file systems, rendering trees, and interview evaluations."
            },
            "Cloud": {
                "prereqs": ["Linux Process Model", "File Descriptors & Standard Streams", "Virtual Memory Isolation"],
                "challenge": "Use `unshare --mount --pid --fork bash` on a Linux VM/WSL to create an isolated process namespace manually.",
                "relevance": "The foundational building block of Docker, Kubernetes, and modern cloud microservices."
            }
        }

        info = category_map.get(rec.category, {
            "prereqs": ["Foundations of Computing", "Data Flow Modeling", "Modular Code Organization"],
            "challenge": "Refactor a monolithic script into 3 decoupled modules with unit tests and clear interfaces.",
            "relevance": "Fundamental software engineering best practice across all domains."
        })

        return ConceptDeepDive(
            core_concept=rec.interest_detected,
            target_recommendation=rec.recommended_tech_reel,
            prerequisites=info["prereqs"],
            fifteen_minute_challenge=info["challenge"],
            industry_relevance=info["relevance"],
            key_takeaways=[
                f"Moves past casual entertainment into {rec.interest_detected}.",
                f"Replaces hype listicles with practical engineering principles in {rec.category}.",
                f"Prepares the student for {rec.difficulty} level technical depth."
            ]
        )

    def _call_gemini_veo_storyboard(
        self,
        topic: str,
        category: CategoryType,
        recommendation: Optional[ReelRecommendation] = None
    ) -> Optional[VeoVideoExplanation]:
        """Calls Google Gemini API to generate a bespoke, ultra-detailed Veo 2 video explanation storyboard."""
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.gemini_key}"
            prompt_text = f"""You are Google Gemini Veo's Lead Technical Director and Computer Science Educator.
Create a hyper-realistic, 15-second, 9:16 vertical 3D cinematic video explanation reel storyboard for the technical concept:
Concept: "{topic}"
Category: "{category}"
Context: "{recommendation.why_this_recommendation if recommendation else 'Bridging casual developer curiosity into foundational CS architecture without clickbait'}"

Return ONLY a valid JSON object matching this structure:
{{
  "concept_title": "{topic}",
  "category": "{category}",
  "render_style": "3D Cinematic Raytraced Cyber-Engineering",
  "summary": "Brief 1-sentence synopsis of the visual journey",
  "veo_prompt_bundle": {{
    "prompt": "Hyper-detailed 4K 60fps 9:16 vertical raytraced camera prompt for Google Gemini Veo 2. Include camera movements, volumetric lighting, optical shaders, and physics animations.",
    "negative_prompt": "clickbait, blurry, 2D generic cartoon, low resolution, watermark, low quality, artifacting, noisy, text spam",
    "aspect_ratio": "9:16",
    "resolution": "4K UHD (2160x3840)",
    "framerate": "60 FPS",
    "camera_motion": "FPV Dolly Push & Orbital 3D Scan",
    "lighting_shader": "Volumetric Raytraced Global Illumination",
    "color_grading": "Cyberpunk Dark Slate & Laser Cyan"
  }},
  "keyframes": [
    {{
      "timestamp_sec": 0.0,
      "title": "Scene 1: Hook & Core CS Primitive",
      "visual_description": "Precise visual description of the first 4 seconds",
      "technical_annotation": "Core technical primitive label",
      "voiceover_line": "Opening 1-2 punchy narration sentences (engaging, educational, 0 hype)",
      "camera_hud": "CAM_01 [WIDE DOLLY IN 24MM]",
      "subtitles": "Short punchy subtitle text for screen"
    }},
    {{
      "timestamp_sec": 4.5,
      "title": "Scene 2: Internal Architecture & Data Flow",
      "visual_description": "Macro camera tracking through the data flow or execution pipeline",
      "technical_annotation": "Throughput & Memory Optimization Layer",
      "voiceover_line": "Middle technical breakdown explaining the mechanism concisely",
      "camera_hud": "CAM_02 [MACRO TRACKING 50MM]",
      "subtitles": "Subtitles for the middle segment"
    }},
    {{
      "timestamp_sec": 9.5,
      "title": "Scene 3: Production Scale Resolution",
      "visual_description": "Resolution shot illustrating production reliability and systems impact",
      "technical_annotation": "Production Scale & Zero-Hype Verification",
      "voiceover_line": "Closing take-away empowering the student with engineering depth",
      "camera_hud": "CAM_03 [ORBITAL 3D CRANE 85MM]",
      "subtitles": "Subtitles for the finale"
    }}
  ]
}}"""
            payload = {
                "contents": [{"parts": [{"text": prompt_text}]}],
                "generationConfig": {
                    "temperature": 0.3,
                    "responseMimeType": "application/json"
                }
            }
            with httpx.Client(timeout=25.0) as client:
                resp = client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                cleaned_text = re.sub(r"^```(?:json)?\s*", "", raw_text.strip())
                cleaned_text = re.sub(r"\s*```$", "", cleaned_text.strip())
                parsed_json = json.loads(cleaned_text)
                
                keyframes_data = [VeoKeyframe.model_validate(k) for k in parsed_json.get("keyframes", [])]
                bundle_data = VeoPromptBundle.model_validate(parsed_json.get("veo_prompt_bundle", {}))
                
                return VeoVideoExplanation(
                    video_id=f"veo_gemini_{category.lower()}_{uuid.uuid4().hex[:8]}",
                    concept_title=parsed_json.get("concept_title", topic),
                    category=category,
                    veo_prompt=bundle_data.prompt,
                    veo_prompt_bundle=bundle_data,
                    duration_seconds=15,
                    aspect_ratio="9:16",
                    resolution="4K UHD (60fps)",
                    render_style=parsed_json.get("render_style", "3D Cinematic Raytraced Cyber-Engineering"),
                    script_narration=[k.voiceover_line for k in keyframes_data],
                    keyframes=keyframes_data,
                    interactive_simulation={
                        "domain": category,
                        "particle_color": "#8b5cf6" if category == "AI" else "#06b6d4",
                        "fps": 60,
                        "simulation_type": "veo_cinematic_mesh"
                    },
                    summary=parsed_json.get("summary", f"AI Generated Gemini Veo 4K explanation for {topic}"),
                    model_used=f"Google Gemini {self.model} + Veo 2 Engine"
                )
        except Exception as e:
            print(f"[Agent Warning] Gemini Veo Storyboard call failed: {e}. Falling back to deterministic high-signal Veo engine.")
            return None

    def generate_veo_video_explanation(
        self,
        topic: str,
        category: Optional[str] = "AI",
        recommendation: Optional[ReelRecommendation] = None
    ) -> VeoVideoExplanation:
        """
        Generates an AI Video Explanation structured for Google Gemini Veo.
        Synthesizes a hyper-detailed cinematographic Veo prompt, narration script,
        keyframes, and visual telemetry data. Uses live Gemini API when configured.
        """
        cat_clean: CategoryType = category if category in ["AI", "DSA", "Java", "HLD", "Cybersecurity", "Cloud", "Hardware", "Career"] else "AI"
        
        # Try Live Gemini LLM if Gemini provider or key is present
        if self.provider == "gemini" and self.gemini_key:
            gemini_result = self._call_gemini_veo_storyboard(topic, cat_clean, recommendation)
            if gemini_result:
                return gemini_result

        # Comprehensive domain-tailored cinematographic prompts & storyboards
        veo_prompts_map = {
            "AI": {
                "prompt": (
                    f"Cinematic 4K 60fps 9:16 vertical camera pan through a glowing holographic transformer neural network architecture. "
                    f"Volumetric cyan and violet laser beams representing Query, Key, and Value vectors intersecting in 3D space. "
                    f"Smooth camera dolly push-in toward a radiant matrix multiplication core demonstrating FlashAttention, SRAM tiling, and KV-Cache token generation. "
                    f"Photorealistic raytraced reflections, dark cyberpunk glass aesthetic, ultra-clean educational motion graphics, concept: {topic}."
                ),
                "camera_motion": "FPV Dolly In -> Orbit Matrix Core -> Pull Back Wide",
                "lighting": "Volumetric Dual-Tone (Neon Cyan #06B6D4 and Violet #8B5CF6)",
                "color_grading": "Cyberpunk Slate Dark Mode & Quantum Neon",
                "sim_type": "transformer_attention_mesh",
                "keyframes": [
                    {
                        "sec": 0.0,
                        "title": "1. Token Ingestion & High-D Embeddings",
                        "vis": "Camera plunges through a high-dimensional vector space where tokens light up as glowing nodes.",
                        "tech": "Context Window Tokenizer & Vector Embedding Matrix",
                        "vo": f"When executing {topic}, modern large models represent incoming words as 4096-dimensional geometric vectors.",
                        "hud": "CAM_01 [VECTOR EMBEDDING MATRIX D=4096]",
                        "sub": f"Token Ingestion: Mapping words to geometric vectors in high-dimensional space."
                    },
                    {
                        "sec": 4.5,
                        "title": "2. Multi-Head Self-Attention Matrix Core",
                        "vis": "Volumetric laser lines calculate Dot-Product Softmax Q @ K.T, illuminating key attention heads in violet.",
                        "tech": "FlashAttention SRAM Tiling & KV-Cache Decoupling",
                        "vo": f"Self-attention calculates token relevance in parallel, caching key-value pairs in VRAM to prevent redundant O(N^2) compute.",
                        "hud": "CAM_02 [ATTENTION ENGINE Q@K.T / SQRT(d_k)]",
                        "sub": "Self-Attention: Calculating token relevance without quadratic memory overhead."
                    },
                    {
                        "sec": 9.5,
                        "title": "3. Autoregressive Token Synthesis",
                        "vis": "Golden token beams fire sequentially through feed-forward layers, outputting high-probability logits.",
                        "tech": "Autoregressive Decoding & Temperature Sampling",
                        "vo": f"This mathematical pipeline produces next-token predictions at hundreds of tokens per second with predictable latency.",
                        "hud": "CAM_03 [DECODER STACK: 32 LAYERS COMPLETE]",
                        "sub": "Production AI: Predictable low-latency generation at scale."
                    }
                ]
            },
            "HLD": {
                "prompt": (
                    f"Cinematic 4K 60fps vertical 3D aerial view over a futuristic distributed cloud datacenter topology. "
                    f"Glowing optic fiber data streams routing between microservice clusters. A sudden node failure occurs, and glowing golden circuit breaker "
                    f"rings activate, gracefully shedding load with consistent hashing virtual nodes. Octane Render 3D style, volumetric blue lighting, concept: {topic}."
                ),
                "camera_motion": "Aerial Crane Descent -> Microservice Cluster Zoom -> Shard Ring Orbit",
                "lighting": "Volumetric Sapphire Blue & Golden Circuit Breaker Glow",
                "color_grading": "Hyper-Clean Datacenter Dark Mode",
                "sim_type": "distributed_cluster_mesh",
                "keyframes": [
                    {
                        "sec": 0.0,
                        "title": "1. Distributed Traffic & Ingress Gateway",
                        "vis": "Million requests/sec streaming into Anycast DNS and Layer-7 reverse proxies.",
                        "tech": "Layer 7 Load Balancing & Rate Limiting",
                        "vo": f"Handling scale in {topic} begins at the edge, distributing millions of concurrent requests across healthy regions.",
                        "hud": "CAM_01 [EDGE ANYCAST INGRESS 10M REQ/S]",
                        "sub": "Distributed Ingress: Edge routing and load shedding across availability zones."
                    },
                    {
                        "sec": 4.5,
                        "title": "2. Partitioning & Consistent Hashing Ring",
                        "vis": "Data keys mapped onto a 360-degree hash ring with virtual nodes automatically rebalancing without downtime.",
                        "tech": "Consistent Hashing Ring & Virtual Node Partitioning",
                        "vo": f"Consistent hashing spreads data evenly across storage shards, guaranteeing that adding or losing a node moves minimal keys.",
                        "hud": "CAM_02 [HASH RING 256 VIRTUAL NODES PER SHARD]",
                        "sub": "Consistent Hashing: Zero-downtime shard rebalancing during traffic spikes."
                    },
                    {
                        "sec": 9.5,
                        "title": "3. Fault Isolation & Circuit Breaking",
                        "vis": "Failed node glows red, circuit breaker isolates it, and fallback cache returns degraded responses seamlessly.",
                        "tech": "Chaos Resiliency & Exponential Backoff Jitter",
                        "vo": f"Circuit breakers and bulkhead patterns contain cascading failures, maintaining 99.999% uptime for global users.",
                        "hud": "CAM_03 [CIRCUIT BREAKER: HALF-OPEN AUTO RECOVERY]",
                        "sub": "High Availability: Fault isolation preventing catastrophic cascading outages."
                    }
                ]
            },
            "DSA": {
                "prompt": (
                    f"Cinematic macro 3D camera tracking shot descending through an ethereal glowing binary search tree and CPU cache hierarchy. "
                    f"L1 and L2 cache lines light up in emerald green showing sequential memory locality hits vs red pointer latency delays. "
                    f"Sleek minimalist dark interface, hyper-detailed data particle streams, concept: {topic}."
                ),
                "camera_motion": "Macro Camera Tracking -> Cache Line Slice -> Tree Invariant Orbit",
                "lighting": "Emerald Green (#10B981) Cache Hits & Crimson Pointer Traversal",
                "color_grading": "Minimalist High-Contrast Silicon Dark Mode",
                "sim_type": "dsa_tree_cache_mesh",
                "keyframes": [
                    {
                        "sec": 0.0,
                        "title": "1. Algorithmic Problem & Memory Hierarchy",
                        "vis": "Abstract data structure visualized in glowing geometric nodes in memory space.",
                        "tech": "Algorithmic Time & Space Complexity Big-O",
                        "vo": f"To master {topic}, we must look past syntax to how algorithms interact with underlying memory hardware.",
                        "hud": "CAM_01 [ALGO COMPLEXITY O(log N) VS O(N)]",
                        "sub": "Algorithmic Foundations: Connecting code structure to hardware execution."
                    },
                    {
                        "sec": 4.5,
                        "title": "2. Cache Line Locality & Pointer Chasing",
                        "vis": "64-byte CPU cache lines light up sequentially in green; fragmented nodes cause red cache misses.",
                        "tech": "L1/L2 Cache Prefetcher & Spatial Locality",
                        "vo": f"Sequential arrays allow the CPU hardware prefetcher to load contiguous 64-byte blocks, outperforming pointer chasing by 50x.",
                        "hud": "CAM_02 [L1 CACHE HIT RATE: 99.4%]",
                        "sub": "Memory Locality: Contiguous data structures maximize CPU cache throughput."
                    },
                    {
                        "sec": 9.5,
                        "title": "3. Optimal Invariant Resolution",
                        "vis": "Balanced tree rotations or hash partitions settle into optimal steady state.",
                        "tech": "Amortized Efficiency & Boundary Correctness",
                        "vo": f"Maintaining strict balance invariants guarantees logarithmic lookup performance even under adversarial workloads.",
                        "hud": "CAM_03 [STEADY STATE INVARIANT VERIFIED]",
                        "sub": "Optimal DSA: Logarithmic performance under peak production load."
                    }
                ]
            },
            "Java": {
                "prompt": (
                    f"Cinematic vertical 3D visualization inside a virtual machine runtime. Abstract Syntax Tree (AST) token blocks dynamically assembling in mid-air. "
                    f"A golden laser scanner tokenizes incoming syntax, instantly inlining bytecode instructions with zero Stop-The-World latency. "
                    f"Unreal Engine 5 architectural visualization, warm amber and cobalt lighting, concept: {topic}."
                ),
                "camera_motion": "Vertical Crane Up -> AST Block Assembly -> JIT Machine Code Scan",
                "lighting": "Amber (#F59E0B) Bytecode Glow & Cobalt (#3B82F6) Runtime Engine",
                "color_grading": "Warm Engine Dark Slate",
                "sim_type": "compiler_ast_mesh",
                "keyframes": [
                    {
                        "sec": 0.0,
                        "title": "1. Lexical Tokenization & Parsing",
                        "vis": "Source text characters stream into a laser scanner that categorizes them into typed tokens.",
                        "tech": "Lexer Token Stream & Recursive Descent Parsing",
                        "vo": f"When compiling {topic}, the lexer breaks raw character streams into discrete semantic tokens instantly.",
                        "hud": "CAM_01 [LEXICAL SCANNER: TOKEN_STREAM]",
                        "sub": "Lexical Analysis: Converting text into structured compiler tokens."
                    },
                    {
                        "sec": 4.5,
                        "title": "2. Abstract Syntax Tree (AST) Construction",
                        "vis": "Hierarchical node branches assemble in 3D space, verifying grammar rules and static type safety.",
                        "tech": "Grammar Verification & Type Checking Pass",
                        "vo": f"The parser builds an Abstract Syntax Tree, checking type invariants and catching structural errors before execution.",
                        "hud": "CAM_02 [AST PARSE TREE DEPTH=8 VALIDATED]",
                        "sub": "AST Verification: Enforcing grammar rules and catching bugs before runtime."
                    },
                    {
                        "sec": 9.5,
                        "title": "3. Bytecode JIT Compilation & Execution",
                        "vis": "AST collapses into compact bytecode; C2 JIT compiler emits native assembly instructions with zero overhead.",
                        "tech": "C2 JIT Compiler Inlining & Scalar Replacement",
                        "vo": f"The JIT compiler profiles hot loops, compiling bytecode directly to native machine instructions for peak execution speed.",
                        "hud": "CAM_03 [HOTSPOT JIT: NATIVE X86_64 EMITTED]",
                        "sub": "JIT Optimization: Native machine code execution with zero overhead."
                    }
                ]
            },
            "Cybersecurity": {
                "prompt": (
                    f"Cinematic 3D dark-mode visualization of a TLS 1.3 cryptographic handshake. Glowing asymmetric key pairs exchange over an encrypted packet tunnel. "
                    f"Diffie-Hellman ephemeral curves rotate in 3D space, shielding plaintext data streams from packet sniffers. "
                    f"Neon red and laser cyan aesthetic, high-tech security HUD, concept: {topic}."
                ),
                "camera_motion": "Tunnel Fly-Through -> Elliptic Curve Rotation -> Encrypted Shield Lock",
                "lighting": "Laser Cyan (#06B6D4) and Neon Crimson (#EF4444)",
                "color_grading": "Zero-Trust Cyber Stealth Dark Mode",
                "sim_type": "tls_crypto_tunnel_mesh",
                "keyframes": [
                    {
                        "sec": 0.0,
                        "title": "1. Plaintext Risk & Packet Interception",
                        "vis": "Unencrypted data packets traveling across an open network while sniffers attempt MitM inspection.",
                        "tech": "Network Packet Sniffing & ARP Spoofing Surface",
                        "vo": f"In {topic}, transmitting sensitive credentials across unverified networks exposes plaintext to eavesdroppers.",
                        "hud": "CAM_01 [NETWORK PROBE: PLAINTEXT DETECTED]",
                        "sub": "Security Threat: Open network traffic vulnerable to packet inspection."
                    },
                    {
                        "sec": 4.5,
                        "title": "2. Ephemeral Elliptic Curve Diffie-Hellman",
                        "vis": "Rotating 3D elliptic curve where client and server exchange public keys to derive a shared secret.",
                        "tech": "Curve25519 Ephemeral Key Exchange & Forward Secrecy",
                        "vo": f"Using Elliptic Curve Cryptography, both parties compute an identical symmetric session key without transmitting it.",
                        "hud": "CAM_02 [ECDHE CURVE25519 KEY AGREEMENT]",
                        "sub": "Diffie-Hellman Exchange: Deriving shared secret keys over insecure channels."
                    },
                    {
                        "sec": 9.5,
                        "title": "3. Authenticated AES-GCM Encrypted Tunnel",
                        "vis": "Holographic cryptographic shield seals the tunnel; sniffers are completely locked out.",
                        "tech": "AES-256-GCM AEAD Encryption & Forward Secrecy",
                        "vo": f"Authenticated encryption guarantees that even compromised root keys cannot decrypt past session traffic.",
                        "hud": "CAM_03 [AES-GCM SHIELD: INTEGRITY SECURED]",
                        "sub": "Zero-Trust Encryption: Complete forward secrecy and packet integrity."
                    }
                ]
            },
            "Cloud": {
                "prompt": (
                    f"Cinematic 3D cross-section of a Linux kernel space. Visualizing isolated process namespaces, cgroups memory limit barriers, and virtual ethernet bridges. "
                    f"eBPF sandboxed bytecode filters malicious packets at line speed. Crisp technical animation, deep sapphire blue glow, concept: {topic}."
                ),
                "camera_motion": "Kernel Space Dive -> Namespace Isolation Box -> eBPF Filter Ring",
                "lighting": "Deep Sapphire Blue (#3B82F6) & Emerald Linux Terminal Glow",
                "color_grading": "Systems Kernel Glassmorphism",
                "sim_type": "linux_kernel_mesh",
                "keyframes": [
                    {
                        "sec": 0.0,
                        "title": "1. User Space vs Kernel Space Boundary",
                        "vis": "A high-speed syscall crossing the ring-0 boundary into Linux kernel memory.",
                        "tech": "Linux Syscall Boundary & Process Tree",
                        "vo": f"Understanding {topic} starts inside the Linux kernel, separating untrusted user processes from hardware resources.",
                        "hud": "CAM_01 [KERNEL BOUNDARY: RING 0 ISOLATION]",
                        "sub": "Kernel Isolation: Guarding operating system primitives from user space."
                    },
                    {
                        "sec": 4.5,
                        "title": "2. Namespaces & Cgroups Resource Walls",
                        "vis": "Transparent glass bounding boxes isolate PID, Network, and Mount namespaces with memory caps.",
                        "tech": "Linux Namespaces (pid, net, ipc) & Cgroups v2",
                        "vo": f"Containers use Linux namespaces to create process isolation and cgroups to enforce strict CPU and memory limits.",
                        "hud": "CAM_02 [CGROUPS V2: MEMORY.MAX=512MB]",
                        "sub": "Container Primitives: Lightweight process sandboxing without VM overhead."
                    },
                    {
                        "sec": 9.5,
                        "title": "3. eBPF Line-Speed Observability",
                        "vis": "Sandboxed eBPF bytecode hooks directly into socket buffers, filtering packets in microseconds.",
                        "tech": "eBPF Sandboxed Kernel Engine & XDP Hook",
                        "vo": f"Running verified bytecode directly inside the kernel provides line-speed networking and zero-overhead observability.",
                        "hud": "CAM_03 [eBPF XDP HOOK: 1.2M PACKETS/S]",
                        "sub": "Kernel Observability: eBPF line-speed packet filtering and metrics."
                    }
                ]
            },
            "Hardware": {
                "prompt": (
                    f"Cinematic photorealistic macro camera zoom into a silicon wafer microarchitecture die. Silicon interconnects pulsing with 800 GB/s unified memory bandwidth. "
                    f"ARM RISC decoder pipelines executing fixed-length instructions with extreme thermal efficiency. 3D Raytraced metallic shader, concept: {topic}."
                ),
                "camera_motion": "Macro Silicon Die Zoom -> ALU Execution Pipeline -> Unified Bus Flow",
                "lighting": "Emerald Silicon Glow & Metallic Copper Raytracing",
                "color_grading": "High-Tech Semiconductor Cleanroom Dark Mode",
                "sim_type": "silicon_microarchitecture_mesh",
                "keyframes": [
                    {
                        "sec": 0.0,
                        "title": "1. Silicon Die Architecture & Nanometer Gates",
                        "vis": "Camera plunges through copper interconnect layers down to billions of nanometer FinFET transistors.",
                        "tech": "Semiconductor Lithography & Gate Transistors",
                        "vo": f"Under the hood of {topic}, silicon microarchitectures balance instruction throughput against thermal power limits.",
                        "hud": "CAM_01 [SILICON DIE: 3NM FINFET ARRAYS]",
                        "sub": "Silicon Architecture: Billions of nanometer transistors balancing performance and heat."
                    },
                    {
                        "sec": 4.5,
                        "title": "2. RISC Pipeline & Branch Predictor",
                        "vis": "Fixed-length instructions gliding through decode, execute, and writeback stages without pipeline stalls.",
                        "tech": "RISC Out-of-Order Engine & Branch Prediction",
                        "vo": f"Superscalar execution engines decode multiple instructions per clock cycle while branch predictors prevent CPU stalls.",
                        "hud": "CAM_02 [BRANCH PREDICTOR: 99.2% ACCURACY]",
                        "sub": "Instruction Pipeline: Superscalar decoding with predictive execution."
                    },
                    {
                        "sec": 9.5,
                        "title": "3. Unified Memory & Massive Memory Bandwidth",
                        "vis": "Massive 800 GB/s unified memory bus streaming tensors directly between CPU and GPU with zero PCIe copying.",
                        "tech": "Unified Memory Architecture (UMA) 800 GB/s",
                        "vo": f"Unified memory architectures eliminate PCIe interconnect bottlenecks, enabling instantaneous model inference on local silicon.",
                        "hud": "CAM_03 [UNIFIED BUS: ZERO-COPY DMA ACTIVE]",
                        "sub": "Unified Memory: Eliminating bandwidth bottlenecks for high-throughput computing."
                    }
                ]
            }
        }

        fallback_meta = veo_prompts_map.get(cat_clean, veo_prompts_map["AI"])
        
        prompt_bundle = VeoPromptBundle(
            prompt=fallback_meta["prompt"],
            negative_prompt="clickbait, blurry, 2D generic cartoon, low resolution, watermark, low quality, artifacting, noisy, spam",
            aspect_ratio="9:16",
            resolution="4K UHD (2160x3840)",
            framerate="60 FPS",
            camera_motion=fallback_meta["camera_motion"],
            lighting_shader=fallback_meta["lighting"],
            color_grading=fallback_meta["color_grading"]
        )

        keyframes = [
            VeoKeyframe(
                timestamp_sec=kf["sec"],
                title=kf["title"],
                visual_description=kf["vis"],
                technical_annotation=kf["tech"],
                voiceover_line=kf["vo"],
                camera_hud=kf["hud"],
                subtitles=kf["sub"]
            )
            for kf in fallback_meta["keyframes"]
        ]

        script_narration = [kf.voiceover_line for kf in keyframes]

        return VeoVideoExplanation(
            video_id=f"veo_{cat_clean.lower()}_{uuid.uuid4().hex[:8]}",
            concept_title=topic,
            category=cat_clean,
            veo_prompt=prompt_bundle.prompt,
            veo_prompt_bundle=prompt_bundle,
            duration_seconds=15,
            aspect_ratio="9:16",
            resolution="4K UHD (60fps)",
            render_style="3D Cinematic Raytraced Cyber-Engineering",
            script_narration=script_narration,
            keyframes=keyframes,
            interactive_simulation={
                "domain": cat_clean,
                "particle_color": "#8b5cf6" if cat_clean == "AI" else "#06b6d4",
                "fps": 60,
                "simulation_type": fallback_meta.get("sim_type", "veo_cinematic_mesh")
            },
            summary=f"Google Gemini Veo 4K Video Masterclass: {topic}",
            model_used="Google Gemini Veo 2 Engine (Offline Deterministic Mode)"
        )

    def generate_reels_by_interest(
        self,
        interests: List[str],
        count: int = 3,
        exclude_ids: Optional[List[str]] = None,
        exclude_titles: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Dynamically generates N unique, non-repeating reels matching requested interests/topics.
        Guarantees strict deduplication by comparing against exclude_ids and exclude_titles.
        """
        exclude_id_set: Set[str] = set(exclude_ids or [])
        exclude_title_set: Set[str] = {t.lower().strip() for t in (exclude_titles or []) if t}

        interest_tokens = [i.strip().lower() for i in interests if i.strip()]
        if not interest_tokens:
            interest_tokens = ["ai", "dsa", "cloud", "hld", "cybersecurity", "hardware", "java"]

        matched_templates = []
        for tmpl in PROCEDURAL_REEL_TEMPLATES:
            tmpl_cat = tmpl["category"].lower()
            tmpl_tag = tmpl["tag"].lower()
            if any(tok in tmpl_cat or tok in tmpl_tag or tmpl_cat in tok for tok in interest_tokens):
                matched_templates.append(tmpl)

        if not matched_templates:
            matched_templates = PROCEDURAL_REEL_TEMPLATES

        generated: List[Dict[str, Any]] = []
        attempts = 0
        max_attempts = max(count * 10, 60)

        while len(generated) < count and attempts < max_attempts:
            attempts += 1
            tmpl = random.choice(matched_templates)
            title = random.choice(tmpl["titles"])
            
            if title.lower().strip() in exclude_title_set:
                continue

            unique_suffix = f"{len(exclude_id_set) + len(generated) + 1:03d}_{random.randint(100, 999)}"
            reel_id = f"gen_{tmpl['category'].lower()}_{unique_suffix}"

            if reel_id in exclude_id_set:
                continue

            tone = random.choice(tmpl["tones"])
            likes = random.randint(35000, 240000)
            comments = random.randint(800, 7500)
            shares = random.randint(2500, 48000)

            rec_obj = ReelRecommendation(
                current_reel=title,
                interest_detected=f"{tmpl['tag']}: {tmpl['category']} Deep Foundations",
                why=f"Curiosity towards '{title}' directly connects to {tmpl['tag']}.",
                recommended_tech_reel=f"Mastering {tmpl['tag']}: Core Computer Science Architecture",
                category=tmpl["category"],
                why_this_recommendation=f"Provides practical systems scaffolding into {tmpl['tag']} without superficial clickbait.",
                difficulty="Intermediate" if random.random() > 0.4 else "Advanced",
                confidence="High"
            )
            deep_dive = self.generate_deep_dive(rec_obj)
            veo_video = self.generate_veo_video_explanation(title, tmpl["category"], rec_obj)

            reel_item = {
                "id": reel_id,
                "type": "interest_custom",
                "creator": tmpl["creator"],
                "avatar": tmpl["avatar"],
                "audio": tmpl["audio"],
                "title": title,
                "description": f"⚡ {title}\n\nBridging real engineering into bite-sized systems intuition. #{tmpl['category'].lower()} #{tmpl['theme']} #computerscience",
                "tone": tone,
                "likes": likes,
                "comments": comments,
                "shares": shares,
                "tag": f"{tmpl['avatar']} {tmpl['tag']}",
                "category": tmpl["category"],
                "theme": tmpl["theme"],
                "badge": f"🎯 Inferred Interest: {tmpl['category']}",
                "animation_data": tmpl["animation_data"],
                "recommendation_metadata": rec_obj.model_dump(),
                "deep_dive_metadata": deep_dive.model_dump(),
                "veo_video_metadata": veo_video.model_dump()
            }

            exclude_id_set.add(reel_id)
            exclude_title_set.add(title.lower().strip())
            generated.append(reel_item)

        return generated

    def suggest_next_stream_reel(
        self,
        watched_reel_ids: List[str],
        watched_titles: List[str],
        liked_categories: List[str],
        inferred_interests: List[str],
        completed_last_reel: bool = True,
        current_reel_id: Optional[str] = "",
        current_reel_title: Optional[str] = ""
    ) -> Dict[str, Any]:
        target_interests = []
        if liked_categories:
            target_interests.extend(liked_categories)
        if inferred_interests:
            target_interests.extend(inferred_interests)
        if not target_interests and current_reel_title:
            target_interests.append(current_reel_title)

        generated = self.generate_reels_by_interest(
            interests=target_interests,
            count=1,
            exclude_ids=watched_reel_ids,
            exclude_titles=watched_titles
        )

        if not generated:
            generated = self.generate_reels_by_interest(
                interests=["AI", "HLD", "DSA", "Cybersecurity", "Cloud"],
                count=1,
                exclude_ids=watched_reel_ids,
                exclude_titles=watched_titles
            )

        return generated[0] if generated else {}

    def get_curated_veo_gallery(self) -> List[VeoVideoExplanation]:
        """Returns a curated showcase gallery of Gemini Veo 4K Video Explanations across computer science domains."""
        gallery_topics = [
            ("Transformer Attention, KV-Cache & FlashAttention 2", "AI"),
            ("Distributed Systems: CAP Theorem, Consistent Hashing & Circuit Breakers", "HLD"),
            ("Memory Locality, Cache Lines & High-Performance Binary Trees", "DSA"),
            ("How Compilers Parse Code: Lexical Analysis & Abstract Syntax Trees (ASTs)", "Java"),
            ("TLS 1.3 Cryptographic Handshake & Ephemeral Diffie-Hellman Key Agreement", "Cybersecurity"),
            ("How Linux Containers Work: Namespaces, Cgroups & eBPF Sandboxes", "Cloud"),
            ("ARM vs x86 Microarchitecture: Instruction Decoding & Unified Memory Bandwidth", "Hardware")
        ]
        gallery = []
        for topic, cat in gallery_topics:
            rec_dummy = ReelRecommendation(
                current_reel=topic,
                interest_detected=f"{cat} Systems Engineering",
                why="Curated deep dive into foundational engineering concepts",
                recommended_tech_reel=f"Masterclass: {topic}",
                category=cat, # type: ignore
                why_this_recommendation="Elevates casual understanding into core systems architecture.",
                difficulty="Intermediate",
                confidence="High"
            )
            veo_item = self.generate_veo_video_explanation(topic, cat, rec_dummy)
            gallery.append(veo_item)
        return gallery

    def format_as_schema_text(self, rec: ReelRecommendation) -> str:
        return (
            f"CURRENT REEL: {rec.current_reel}\n"
            f"INTEREST DETECTED: {rec.interest_detected}\n"
            f"WHY: {rec.why}\n"
            f"RECOMMENDED TECH REEL: {rec.recommended_tech_reel}\n"
            f"CATEGORY: {rec.category}\n"
            f"WHY THIS RECOMMENDATION: {rec.why_this_recommendation}\n"
            f"DIFFICULTY: {rec.difficulty}\n"
            f"CONFIDENCE: {rec.confidence}"
        )

    # ==========================================
    # Instagram Account Connection & Sync Engine
    # ==========================================

    _instagram_profile: Optional[InstagramUserProfile] = None

    def connect_instagram(self, username: str, display_name: Optional[str] = None) -> InstagramUserProfile:
        clean_user = username.strip().lstrip('@')
        if not clean_user:
            clean_user = "developer_alex"
        display = display_name.strip() if display_name else f"@{clean_user}"
        import datetime
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Prepopulate with 2 realistic likes if empty so user immediately sees activity
        initial_likes = [
            InstagramLikedReel(
                reel_id="Reel_01",
                title="POV: You forgot a semicolon in Java and spend 3 hours debugging",
                category="Java",
                creator="@dev_humor",
                liked_at="Just now",
                ai_inferred_topic="Compiler Lexical Analysis & Abstract Syntax Trees",
                ai_bridge_topic="Deep Dive: How javac parses token streams without semicolons"
            ),
            InstagramLikedReel(
                reel_id="Reel_03",
                title="M3 MacBook Pro vs. RTX 4080 Laptop: Real Thermal & Battery Test",
                category="Hardware",
                creator="@hardware_unboxed",
                liked_at="10m ago",
                ai_inferred_topic="ARM vs x86 Unified Memory & TDP Architecture",
                ai_bridge_topic="Deep Dive: Apple Silicon 800GB/s Unified Memory Bus"
            )
        ]

        self._instagram_profile = InstagramUserProfile(
            username=clean_user,
            display_name=display,
            avatar="📸",
            bio="Real-Time Reel Learner & Tech Enthusiast",
            connected=True,
            connected_at=now_str,
            liked_reels=initial_likes,
            sync_enabled=True
        )
        return self._instagram_profile

    def get_instagram_profile(self) -> InstagramUserProfile:
        if not self._instagram_profile:
            import datetime
            now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            self._instagram_profile = InstagramUserProfile(
                username="guest_dev",
                display_name="Guest User",
                avatar="👤",
                bio="Connect your Instagram account to sync liked reels",
                connected=False,
                connected_at=now_str,
                liked_reels=[],
                sync_enabled=False
            )
        return self._instagram_profile

    def sync_instagram_like(
        self,
        reel_id: str,
        title: str,
        category: str,
        creator: str,
        ai_topic: Optional[str] = None,
        ai_bridge: Optional[str] = None
    ) -> InstagramLikedReel:
        import datetime
        now_str = datetime.datetime.now().strftime("%I:%M %p")
        if not self._instagram_profile or not self._instagram_profile.connected:
            self.connect_instagram("developer_alex")

        liked_item = InstagramLikedReel(
            reel_id=reel_id,
            title=title,
            category=category,
            creator=creator,
            liked_at=now_str,
            ai_inferred_topic=ai_topic or f"{category} Systems Foundations",
            ai_bridge_topic=ai_bridge or f"Deep Architectural Dive into {title}"
        )
        # Deduplicate
        if self._instagram_profile:
            self._instagram_profile.liked_reels = [
                r for r in self._instagram_profile.liked_reels if r.reel_id != reel_id
            ]
            self._instagram_profile.liked_reels.insert(0, liked_item)
        return liked_item

    def disconnect_instagram(self) -> Dict[str, Any]:
        self._instagram_profile = None
        return {"status": "disconnected", "message": "Instagram account unlinked successfully."}

    def suggest_instagram_reel(
        self,
        liked_reel_ids: List[str],
        liked_categories: List[str],
        current_reel_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """AI Recommendation Agent: Suggest the optimal next Instagram reel based on user affinity."""
        all_insta_reels = [
            {
                "id": "ig_01",
                "title": "POV: You forgot a semicolon in Java",
                "creator": "@dev_humor",
                "avatar": "☕",
                "category": "Java",
                "likes": 42100,
                "comments": 1240,
                "audio": "Original Sound • Java Developer Suffering",
                "description": "Why does missing one semicolon break 400 lines of code?! 😭 In Java it won't even compile! #javameme #codinglife #programming",
                "ai_inferred_topic": "Compiler Lexical Analysis, AST Trees & Bytecode Verification",
                "ai_bridge_topic": "How Compilers Parse Code: Lexing, AST Trees & Error Recovery",
                "difficulty": "Beginner"
            },
            {
                "id": "ig_02",
                "title": "M3 Max MacBook Pro vs RTX 4080 Laptop",
                "creator": "@hardware_unboxed",
                "avatar": "💻",
                "category": "Hardware",
                "likes": 89400,
                "comments": 3120,
                "audio": "M3 Max vs NVIDIA RTX 4080 • Benchmark Score",
                "description": "Apple's 800 GB/s Unified Memory bus runs 70B LLMs at 30W while the 4080 laptop draws 175W! #m3max #nvidia #hardware #gpu",
                "ai_inferred_topic": "Unified Memory Bus Architecture & PCIe Latency Bottlenecks",
                "ai_bridge_topic": "Silicon Architecture: Unified RAM (UMA) vs Discrete PCIe Buses",
                "difficulty": "Advanced"
            },
            {
                "id": "ig_03",
                "title": "Mixture-of-Experts (MoE) in 30 Seconds",
                "creator": "@ai_breakthroughs",
                "avatar": "🧠",
                "category": "AI",
                "likes": 125000,
                "comments": 4890,
                "audio": "Trending AI Audio • Neural Network Beats",
                "description": "How Mixtral 8x7B gets GPT-4 performance with only 12B active parameters per token! #ai #machinelearning #transformers #deeplearning",
                "ai_inferred_topic": "Sparse Gating Routers, Top-k Activation & FLOP Reduction",
                "ai_bridge_topic": "Under the Hood of MoE: Sparse Gating, Load Balancing & VRAM Sharding",
                "difficulty": "Advanced"
            },
            {
                "id": "ig_04",
                "title": "Raft Consensus & Leader Election Explained",
                "creator": "@systems_guru",
                "avatar": "🏗️",
                "category": "HLD",
                "likes": 63200,
                "comments": 1840,
                "audio": "Distributed Beats • Heartbeat Timeout",
                "description": "What happens when your Kafka or Kubernetes etcd cluster leader dies? Split-brain prevented! #systemdesign #distributed #cloud #backend",
                "ai_inferred_topic": "Distributed Consensus, Heartbeat Timers & Split-Brain Prevention",
                "ai_bridge_topic": "Distributed Systems: Raft State Machine Replication & Quorums",
                "difficulty": "Advanced"
            },
            {
                "id": "ig_05",
                "title": "Invert Binary Tree Speedrun in C++",
                "creator": "@algo_master",
                "avatar": "⚡",
                "category": "DSA",
                "likes": 71500,
                "comments": 2430,
                "audio": "Synthwave Coding • Fast Algorithms",
                "description": "Max Howell got rejected by Google for this, but here is how recursion and pointer swapping work in L1 cache! #algorithms #datastructures #leetcode #coding",
                "ai_inferred_topic": "Pointer Swapping, Call Stack Memory & Cache Locality",
                "ai_bridge_topic": "Tree Inversion: Recursive Call Stacks & L1 Cache Performance",
                "difficulty": "Intermediate"
            },
            {
                "id": "ig_06",
                "title": "Docker Containers vs Virtual Machines in 15s",
                "creator": "@cloud_architect",
                "avatar": "🐳",
                "category": "HLD",
                "likes": 94200,
                "comments": 3100,
                "audio": "Tech Lo-Fi • Container Beats",
                "description": "Containers aren't mini VMs! They are just Linux cgroups, namespaces, and chroot! 🐧 #docker #devops #kubernetes #linux",
                "ai_inferred_topic": "Linux Kernel cgroups, Namespaces & iptables NAT Bridging",
                "ai_bridge_topic": "How Containers Actually Work: Linux Kernel cgroups & Namespaces",
                "difficulty": "Intermediate"
            },
            {
                "id": "ig_07",
                "title": "TLS 1.3 Handshake Zero-RTT Cryptography",
                "creator": "@infosec_daily",
                "avatar": "🛡️",
                "category": "Cybersecurity",
                "likes": 58900,
                "comments": 1420,
                "audio": "Cyberpunk Hacker • Encryption Pulse",
                "description": "How HTTPS connects in 1 round trip with Diffie-Hellman ephemeral keys! #cybersecurity #crypto #https #networking",
                "ai_inferred_topic": "Ephemeral Diffie-Hellman Key Exchange & AES-256-GCM Tunneling",
                "ai_bridge_topic": "Zero-RTT Handshakes: TLS 1.3 Cryptography & Elliptic Curves",
                "difficulty": "Advanced"
            },
            {
                "id": "ig_08",
                "title": "Database Indexing: B-Trees vs LSM Trees",
                "creator": "@db_internals",
                "avatar": "🗄️",
                "category": "HLD",
                "likes": 67800,
                "comments": 1980,
                "audio": "Database Beats • RocksDB IOPS",
                "description": "Postgres uses B+ Trees for fast reads, but Cassandra & RocksDB use LSM Trees for fast writes! #database #sql #systemdesign",
                "ai_inferred_topic": "B+ Tree Fanout vs Sequential Write Amplification in LSM Trees",
                "ai_bridge_topic": "Database Storage Engines: B+ Trees vs Log-Structured Merge Trees",
                "difficulty": "Advanced"
            }
        ]

        # Prioritize matching categories or unliked fresh reels
        candidates = [r for r in all_insta_reels if r["id"] != current_reel_id and r["id"] not in liked_reel_ids]
        if not candidates:
            candidates = [r for r in all_insta_reels if r["id"] != current_reel_id]
        if not candidates:
            candidates = all_insta_reels

        # Match category preference
        preferred = [r for r in candidates if r["category"] in liked_categories]
        selected = preferred[0] if preferred else candidates[0]

        reasoning = (
            f"Based on your recent engagement with {liked_categories[0] if liked_categories else selected['category']}, "
            f"the AI Agent recommends '{selected['title']}' ({selected['creator']}) to bridge into '{selected['ai_inferred_topic']}'."
        )

        return {
            "status": "success",
            "suggested_reel": selected,
            "ai_reasoning": reasoning,
            "confidence_score": 0.95,
            "target_bridge": selected["ai_bridge_topic"]
        }


