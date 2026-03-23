# Twilio Call API (Node.js)

Trigger Twilio calls via a simple API or using the included web interface.

## Quick Start

### 1. Install Dependencies
Make sure you have Node.js installed, then run:
```bash
npm install
```

### 2. Start the Server
```bash
node server.js
```
The server will run on `http://localhost:8000`.

### 3. Expose via ngrok (Optional)
To test from anywhere:
```bash
ngrok http 8000
```

## How to Test

### Option A: Use the Web Interface (Recommended)
1. Open `index.html` in your browser.
2. Enter your Twilio SID, Auth Token, and phone numbers.
3. Click **Trigger Call**.

### Option B: Send a POST Request
**Endpoint:** `POST /make_call`
**JSON Body:**
```json
{
  "account_sid": "YOUR_SID",
  "auth_token": "YOUR_TOKEN",
  "from_number": "+1234567890",
  "to_number": "+918302829465"
}
```

## Deployment to Koyeb

1. **GitHub Upload**: Apne is code ko GitHub par upload kren.
2. **Connect Koyeb**: Koyeb dashboard me jayein aur "Create Service" par click kren.
3. **GitHub Repository**: Apni repo select kren.
4. **Environment Variables**:
   - `PORT`: 8000 (Koyeb automatically handles this if you use the Dockerfile).
5. **Deploy**: "Deploy" button pr click kren.

Aapko ek permanent URL milega (e.g., `https://my-twilio-app.koyeb.app`). Us URL ko aap apne permanent projects me use kr sakte hain.
