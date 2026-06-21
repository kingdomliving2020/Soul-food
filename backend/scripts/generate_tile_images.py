"""
One-shot script to generate the 3 coordinated lifestyle tile images for the
Soul Food landing page using Gemini Nano Banana.

Output:
  /app/frontend/public/covers/tile-games.png
  /app/frontend/public/covers/tile-smallgroup.png
  /app/frontend/public/covers/tile-foundation.png

Run:
  cd /app/backend && python3 scripts/generate_tile_images.py
"""
import asyncio
import base64
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv("/app/backend/.env")

OUT_DIR = Path("/app/frontend/public/covers")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Shared cinematic style to keep the campaign coordinated.
STYLE_DIRECTIVE = (
    "Cinematic photorealistic photograph, warm golden-hour light pouring through windows, "
    "rich teal and amber color palette with soft purple accents, shallow depth of field, "
    "documentary ministry photojournalism feel, no text or logos overlaid, no captions, "
    "no watermark, no signage, candid expressions, square 1:1 composition, subject fills "
    "85% of the frame, modern Christian community aesthetic, diverse multi-ethnic group, "
    "high-end DSLR look, 35mm lens, natural skin tones."
)

TILES = {
    "tile-games.png": (
        "A church game-night fellowship moment inside a warm, modern multipurpose room. "
        "A confident facilitator in casual ministry attire stands at the front with arms "
        "gesturing toward the group, smiling. In the foreground, a multi-generational audience "
        "(teens, young adults, parents, seniors) sits and stands at round tables raising their "
        "hands enthusiastically to answer a question. Faces are joyful and engaged. String "
        "lights and golden lamps glow softly in the background. No game boards, no specific "
        "game branding, no screens. Communicates engagement, participation, fellowship, fun. "
        + STYLE_DIRECTIVE
    ),
    "tile-smallgroup.png": (
        "A warm, intimate small-group Bible study scene. Six to eight diverse adults gather "
        "around a wooden table in a sunlit living room or church classroom. Open Bibles, "
        "notebooks, and pens are visible on the table. Coffee mugs, a plate of pastries, and "
        "fresh fruit suggest fellowship over a meal. Two people are mid-conversation while "
        "others listen and smile, leaning in. Bookshelves and a plant in the soft-focus "
        "background. Communicates community, discussion, group learning, hospitality. "
        + STYLE_DIRECTIVE
    ),
    "tile-foundation.png": (
        "A solo morning devotional scene. One person (mid-30s) sits at a bright kitchen or "
        "cafe table by a sunlit window during breakfast. An open tablet rests in front of them "
        "displaying a Bible study layout (text only, no app UI logos). To the side, a plate "
        "with toast, fresh fruit, and a coffee cup. The person reads thoughtfully with a soft, "
        "reflective expression, one hand near the tablet. Tight crop framing the learner, "
        "tablet, and breakfast plate together. Communicates daily discipleship, personal "
        "study, morning rhythm, spiritual growth. "
        + STYLE_DIRECTIVE
    ),
}


async def generate_one(filename: str, prompt: str) -> bool:
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        print(f"[ERROR] EMERGENT_LLM_KEY missing for {filename}")
        return False

    chat = LlmChat(
        api_key=api_key,
        session_id=f"tile-gen-{filename}",
        system_message="You are a high-end Christian ministry photographer creating coordinated lifestyle campaign images.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])

    msg = UserMessage(text=prompt)
    try:
        text, images = await chat.send_message_multimodal_response(msg)
    except Exception as e:
        print(f"[ERROR] {filename}: {e}")
        return False

    if not images:
        print(f"[WARN] {filename}: no images returned. Text response: {text[:120]}")
        return False

    img = images[0]
    image_bytes = base64.b64decode(img["data"])
    out_path = OUT_DIR / filename
    with open(out_path, "wb") as f:
        f.write(image_bytes)
    print(f"[OK] wrote {out_path} ({len(image_bytes)} bytes, mime={img['mime_type']})")
    return True


async def main() -> int:
    results = []
    for filename, prompt in TILES.items():
        ok = await generate_one(filename, prompt)
        results.append((filename, ok))
    print("\n=== Summary ===")
    for filename, ok in results:
        print(f"  {filename}: {'OK' if ok else 'FAIL'}")
    return 0 if all(ok for _, ok in results) else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
