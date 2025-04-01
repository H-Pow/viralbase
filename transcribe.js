const { exec } = require('child_process');
const path = require('path');
const axios = require('axios');
require('dotenv').config();
const fs = require("fs");


// Path to the uploads folder
const uploadsDir = path.join(__dirname, "uploads");

// Function to get the latest uploaded file
function getLatestVideo() {
    const files = fs.readdirSync(uploadsDir);
    
    if (files.length === 0) {
        console.error("No video file found in uploads folder.");
        process.exit(1);
    }

    return path.join(uploadsDir, files[0]); // Only one file should exist
}

// Get the latest video file
const videoPath = getLatestVideo();

let transcript = ""
// Execute the Python script that uses Whisper to transcribe the video
exec(`python transcribe.py "${videoPath}"`, (err, stdout, stderr) => {
    if (err) {
        console.error('Error executing Python script:', err);
        return;
    }

    if (stderr) {
        console.error('stderr:', stderr);  // Print any stderr from the Python script
    }

    if (stdout.trim()) {
        //console.log('Transcription:', stdout);  // Output transcription
        transcript = stdout;
        analyzeTranscription(transcript);
    } else {
        console.log('No transcription output received.');
    }

});

// // Replace with your OpenAI API key
const apiKey = process.env.API_KEY

async function analyzeTranscription(transcriptionText) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const prompt = `Give an optimal title, a list of SEO key words one can easily paste into their description if they wanted to maximize the chances
                    of their content being seen on browsers, and give a summary of current related content trends all in a json format {title: title here, keywords: [list], trends_summary: summary}
                    if their content has the following audio transcription:\n\n${transcriptionText}. Return only the json and only the json`;
    
    try {
        const response = await axios.post(
            url,
            {
                model: 'gpt-3.5-turbo',  // or 'gpt-3.5-turbo' for a cheaper model
                messages: [
                    { role: 'system', content: 'You are an seo expert.' },
                    { role: 'user', content: prompt }
                  ],
                max_tokens: 2000,
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        
        console.log(response.data.choices[0].message.content);
    } catch (error) {
        console.error('Error with GPT analysis:', error);
    }
}
