const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();
const PORT = 3000;

app.use(cors());

// Define the upload directory
const uploadDir = path.join(__dirname, "uploads");

// Ensure the uploads folder exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

function clearUploadsFolder() {
    const uploadDir = path.join(__dirname, "uploads");
    
    if (fs.existsSync(uploadDir)) {
        fs.readdir(uploadDir, (err, files) => {
            if (err) throw err;
            for (const file of files) {
                fs.unlink(path.join(uploadDir, file), err => {
                    if (err) throw err;
                });
            }
        });
    }
}

// Call the function to clear the folder at startup
clearUploadsFolder();

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        clearUploadsFolder(); // Delete old files before saving new one
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, "uploaded-video" + path.extname(file.originalname)); // Always use the same filename
    }
});

const upload = multer({ storage });

// Upload API
app.post("/upload-video", upload.single("video"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const videoUrl = `http://localhost:3000/uploads/${req.file.filename}`;

    const filePath = req.file.path;

    // Send response first
    exec("node transcribe.js", (err, stdout, stderr) => {
        if (err) {
            console.error("Error running script:", err);
        }
        if (stderr) {
        }
        console.log(stdout);

        try {
            // Parse the stdout to convert it into a JSON object
            let cleanString = stdout.trim();

            // Try to extract the actual JSON part
            let jsonStart = cleanString.indexOf("{");
            let jsonEnd = cleanString.lastIndexOf("}");

            if (jsonStart !== -1 && jsonEnd !== -1) {
            cleanString = cleanString.substring(jsonStart, jsonEnd + 1);
            } // Only allow valid JSON characters

            const transcriptionData = JSON.parse(cleanString);

            console.log(transcriptionData)
            // Send the formatted JSON in the response
            res.json({
                message: "Upload successful, processing complete!",
                url: videoUrl,
                transcription: transcriptionData // Include the parsed JSON
            });
        } catch (parseError) {
            console.error("Error parsing JSON:", parseError);
            return res.status(500).json({ error: "Failed to parse transcription output" });
        }
    })



    // Delete the file after 10 seconds
    setTimeout(() => {
        fs.unlink(filePath, (err) => {
        });
    }, 10000); // 10 seconds
});


// Serve uploaded files
app.use("/uploads", express.static("uploads"));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
