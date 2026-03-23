const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();

// Security: Disable 'X-Powered-By' header to hide technology stack
app.disable('x-powered-by');

// Fully permissive CORS for API usage from any client
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Log static file requests for debugging
app.use('/uploads', (req, res, next) => {
    // Skip ngrok/proxy browser warning if any
    res.setHeader('ngrok-skip-browser-warning', 'true');
    console.log(`[Audio Fetch] Serving file: ${req.url}`);
    next();
}, express.static(path.join(__dirname, 'uploads')));

// Debug log for incoming requests
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'Direct API Call'}`);
    next();
});

// Multer storage with extension preservation
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Production Port (Koyeb handles this)
const PORT = process.env.PORT || 8000;

// Security: No frontend served from here. ONLY API.
app.get('/', (req, res) => {
    res.status(403).send('Forbidden: API Only');
});

// TwiML for Hindi Greeting (Fallback)
app.all('/twiml-hindi', (req, res) => {
    res.set('Content-Type', 'text/xml; charset=utf-8');
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="hi-IN">नमस्ते! आपको कोई दुखसुनो एप्लीकेशन में कॉल कर रहा है।</Say>
    <Hangup/>
</Response>`;
    res.send(twiml);
});

// TwiML for Audio Playback
app.all('/play-audio', (req, res) => {
    const filename = req.query.filename;
    res.set('Content-Type', 'text/xml; charset=utf-8');
    
    // Determine the public URL for the audio file
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const audioUrl = `${protocol}://${host}/uploads/${filename}`;

    console.log(`[TwiML Status] Serving audio playback: ${audioUrl}`);

    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>${audioUrl}</Play>
    <Hangup/>
</Response>`);
});

// Main Endpoint to trigger call
app.post('/make_call', upload.single('audio'), async (req, res) => {
    const { account_sid, auth_token, from_number, to_number } = req.body;
    const audioFile = req.file;

    if (!account_sid || !auth_token || !from_number || !to_number) {
        return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    try {
        const client = twilio(account_sid, auth_token);

        const host = req.headers['x-forwarded-host'] || req.get('host');
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        
        let twimlUrl;
        if (audioFile) {
            twimlUrl = `${protocol}://${host}/play-audio?filename=${audioFile.filename}`;
        } else {
            twimlUrl = `${protocol}://${host}/twiml-hindi`;
        }

        console.log(`[Twilio Request] Using TwiML: ${twimlUrl}`);

        const call = await client.calls.create({
            url: twimlUrl,
            to: to_number,
            from: from_number,
        });

        res.json({
            status: 'success',
            call_sid: call.sid,
            message: audioFile ? `Call triggered with audio upload.` : `Call triggered with Hindi greeting.`,
        });
    } catch (error) {
        console.error('Twilio Error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Security Catch-all for unauthenticated browsing
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found or Access Denied' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`API Server is running on port ${PORT}`);
    console.log(`--- PRODUCTION MODE ---`);
});
