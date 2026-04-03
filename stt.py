from openai import OpenAI
import json
from datetime import datetime
client = OpenAI()

# audio_file = open("/Volumes/Verbatim Vi560 Media/Downloads/Tommy-02-Sunday at 22:08/Sunday at 22-08.m4a", "rb")

audio_file = open("data/tommy-01-Sunday/Sunday-at-21-32.m4a", "rb")

transcription = client.audio.transcriptions.create(
  model="whisper-1", 
  file=audio_file, 
  response_format="verbose_json",
  timestamp_granularities=["segment"]
  # prompt="ZyntriQix, Digique Plus, CynapseFive, VortiQore V8, EchoNix Array, OrbitalLink Seven, DigiFractal Matrix, PULSE, RAPT, B.R.I.C.K., Q.U.A.R.T.Z., F.L.I.N.T."
)
print(transcription)
# Save transcription content into a text file
# Get the current date
current_date = datetime.now().strftime("%Y-%m-%d")

# Save transcription content into a text file with the current date in the filename
with open(f"/Users/kristiangarza/aves/purpurit/transcript_json_{current_date}.json", "w") as file:
  json_array = [segment.__dict__["text"] for segment in transcription.segments]
  file.write('\n'.join(json_array))
