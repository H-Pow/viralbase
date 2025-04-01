
import sys
import whisper

# Load the Whisper model (you can use other models like 'base', 'small', 'large')
model = whisper.load_model("base")

# Path to the video
video_path = sys.argv[1]
#video_path = "C:\\Users\\pogim\\OneDrive\\Documents\\Github\\testvideo\\chicken.mp4"


# Transcribe the video
result = model.transcribe(video_path)

# Output the transcription
print(result['text'])
