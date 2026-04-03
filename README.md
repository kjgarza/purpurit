# Tommy's Life Documentation

This repository contains code to transcribe and synthesize speech to document the life of Tommy, my grandma. The project uses OpenAI's Whisper model for speech-to-text (STT) and a text-to-speech (TTS) service to generate audio from text.

## Project Structure


- **README.md**: This file.
- **stt.py**: Python script to transcribe audio files using OpenAI's Whisper model.
- **transcript_json.json**: JSON file containing the transcribed text.
- **transcript.txt**: Plain text file containing the transcribed text.

## Requirements

- Python 3.x
- OpenAI Python client

## Setup

1. Clone the repository:
    ```sh
    git clone https://github.com/kjgarza/purpuit.git
    cd purpuit
    ```

2. Install the required Python packages:
    ```sh
    pip install openai
    ```

3. Set up your OpenAI API key:
    ```sh
    export OPENAI_API_KEY='your-api-key'
    ```

## Usage

### Speech-to-Text (STT)

To transcribe an audio file, run the `stt.py` script:

```sh
python [stt.py](http://_vscodecontentref_/5)