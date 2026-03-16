"""Generate Serbian TTS audio files for each letter and digit."""
import asyncio
import edge_tts

VOICE = "sr-RS-SophieNeural"
OUTPUT_DIR = "audio"

LETTERS = {
    "A": "а", "B": "бе", "C": "це", "D": "де", "E": "е",
    "F": "еф", "G": "ге", "H": "ха", "I": "и", "J": "је",
    "K": "ка", "L": "ел", "M": "ем", "N": "ен", "O": "о",
    "P": "пе", "Q": "ку", "R": "ер", "S": "ес", "T": "те",
    "U": "у", "V": "ве", "W": "дупло ве", "X": "икс",
    "Y": "ипсилон", "Z": "зе",
}

DIGITS = {
    "0": "нула", "1": "један", "2": "два", "3": "три",
    "4": "четири", "5": "пет", "6": "шест", "7": "седам",
    "8": "осам", "9": "девет",
}

SERBIAN_SPECIAL = {
    "SH": "ша", "DJ": "ђе", "CH": "че", "CC": "ће", "ZH": "же",
    "DZH": "џе", "LJ": "ље", "NJ": "ње",
}


async def generate(key: str, text: str) -> None:
    filename = f"{OUTPUT_DIR}/{key}.mp3"
    communicate = edge_tts.Communicate(text, VOICE, rate="-10%")
    await communicate.save(filename)
    print(f"  {key} -> {filename}")


async def main() -> None:
    all_items = {**LETTERS, **DIGITS, **SERBIAN_SPECIAL}
    print(f"Generating {len(all_items)} audio files with voice {VOICE}...")
    tasks = [generate(k, v) for k, v in all_items.items()]
    await asyncio.gather(*tasks)
    print("Done!")


if __name__ == "__main__":
    asyncio.run(main())
