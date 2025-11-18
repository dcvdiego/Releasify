# Releasify

A full-stack web application that predicts when your favorite artist will release new music using machine learning and the Spotify API.

## Features

- **Artist Search**: Search for any artist on Spotify with real-time results
- **Release Prediction**: ML-powered predictions for next album release dates
- **Release History**: View complete album release timeline for any artist
- **Confidence Scores**: Get transparency with confidence levels for predictions
- **Beautiful UI**: Modern, responsive design with gradient backgrounds and smooth animations

## Tech Stack

### Backend
- **Node.js** with **Express.js** - REST API server
- **TypeScript** - Type-safe backend code
- **Spotify Web API** - Artist and album data
- **Python** - Machine learning prediction models
- **scikit-learn** - Random Forest regression for predictions

### Frontend
- **Next.js 14** - React framework with SSR
- **TypeScript** - Type-safe frontend code
- **Tailwind CSS** - Utility-first styling
- **Twin.macro** - CSS-in-JS with Tailwind
- **Styled Components** - Component styling

### Machine Learning
- **Random Forest Regressor** - Predicts release dates based on historical patterns
- **Feature Engineering** - Temporal features (month, day, weekday, season)
- **Confidence Scoring** - Model evaluation metrics for transparency

## Prerequisites

- **Node.js** v18+ and npm/yarn
- **Python 3.8+** with pip
- **Spotify Developer Account** - Get API credentials at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Releasify
```

### 2. Backend Setup

```bash
cd releasify_backend

# Install Node dependencies
npm install
# or
yarn install

# Install Python dependencies
pip3 install -r requirements.txt

# Create .env file from example
cp .env.example .env
```

Edit `.env` and add your Spotify API credentials:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
PORT=5000
NODE_ENV=development
```

### 3. Frontend Setup

```bash
cd ../releasify_next

# Install dependencies
npm install
# or
yarn install

# Create .env.local file
cp .env.example .env.local
```

The default API URL is `http://localhost:5000`. Update if needed:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Getting Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in the app name and description
5. Copy your **Client ID** and **Client Secret**
6. Add them to your `releasify_backend/.env` file

## Running the Application

### Development Mode

You'll need two terminal windows:

**Terminal 1 - Backend:**
```bash
cd releasify_backend
npm run dev
```

The API will start on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd releasify_next
npm run dev
```

The web app will start on `http://localhost:3000`

### Production Build

**Backend:**
```bash
cd releasify_backend
npm run build
npm start
```

**Frontend:**
```bash
cd releasify_next
npm run build
npm start
```

## API Endpoints

### Artist Search
```
GET /api/artists/search/:query
```
Search for artists by name. Returns up to 10 results.

**Example:**
```bash
curl http://localhost:5000/api/artists/search/eminem
```

### Get Artist Details
```
GET /api/artists/:artistId
```
Get detailed information about a specific artist.

### Get Artist Albums
```
GET /api/artists/:artistId/albums
```
Get all albums for an artist with release dates.

### Predict Next Release
```
POST /api/artists/:artistId/predict
```
Predict the next release date using ML models.

**Response:**
```json
{
  "success": true,
  "artist_id": "7dGJo4pcD2V6oG8kP0tJRR",
  "artist_name": "Eminem",
  "prediction": {
    "predicted_date": "2025-05-15",
    "confidence": 0.78,
    "model_used": "random_forest",
    "release_history": [...]
  }
}
```

### Health Check
```
GET /health
```
Check if the API is running.

## How It Works

### Machine Learning Model

The prediction system uses a Random Forest Regressor that:

1. **Analyzes Release Patterns**: Studies historical album release dates
2. **Extracts Features**: Month, day, weekday, week of month, season
3. **Trains Model**: Uses previous releases to learn patterns
4. **Predicts**: Estimates days until next release
5. **Validates**: Ensures prediction is reasonable (90 days - 5 years)

**Requirements:**
- Minimum 3 album releases required for prediction
- More releases = higher confidence scores
- Considers release timing, seasonality, and patterns

## Project Structure

```
Releasify/
├── releasify_backend/          # Express.js API server
│   ├── components/
│   │   └── ai/
│   │       └── predict_release.py   # ML prediction script
│   ├── routers/
│   │   └── artists.ts          # Artist API routes
│   ├── types/
│   │   └── spotify.ts          # TypeScript types
│   ├── utils/
│   │   └── pythonCall.ts       # Python integration
│   ├── app.ts                  # Express app entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── requirements.txt        # Python dependencies
│
├── releasify_next/             # Next.js frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   └── GlobalStyles.tsx
│   │   ├── pages/
│   │   │   └── index.tsx       # Main app page
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript types
│   │   └── utils/
│   │       └── api.ts          # API client functions
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

## Troubleshooting

### Backend won't start
- Verify Spotify credentials in `.env`
- Check that port 5000 is not in use
- Ensure all npm packages are installed

### Python errors
- Verify Python 3.8+ is installed: `python3 --version`
- Install requirements: `pip3 install -r requirements.txt`
- Check that `predict_release.py` is executable

### Frontend API errors
- Ensure backend is running on port 5000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS is enabled in backend

### Prediction errors
- Artist needs at least 3 album releases
- Some artists may have limited data on Spotify
- Try different artists with more release history

## Example Artists to Try

These artists have extensive release histories for good predictions:
- Eminem (ID: 7dGJo4pcD2V6oG8kP0tJRR)
- Taylor Swift (ID: 06HL4z0CvFAxyc27GXpf02)
- Drake (ID: 3TVXtAsR1Inumwj472S9r4)
- The Beatles (ID: 3WrFJ7ztbogyGnTHbHJFl2)

## Future Enhancements

- [ ] User authentication and saved predictions
- [ ] Email notifications when predictions approach
- [ ] Support for EPs and singles (not just albums)
- [ ] Multiple ML models with voting
- [ ] Social features (share predictions, discussions)
- [ ] Mobile app (React Native)
- [ ] Historical prediction accuracy tracking

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Credits

Built with modern web technologies and the Spotify Web API. Machine learning powered by scikit-learn.

---

Made with ♥ by the Releasify team
