import express, { Request, Response } from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import { getPythonPrediction } from '../utils/pythonCall';
import type { AlbumRelease, ArtistSearchResult, PredictionResult } from '../types/spotify';

const router = express.Router();

// Validate environment variables
if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
  throw new Error('Missing Spotify API credentials. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env file');
}

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Token management
let tokenExpirationTime = 0;

async function ensureValidToken(): Promise<void> {
  const now = Date.now();
  if (now >= tokenExpirationTime) {
    try {
      const data = await spotifyApi.clientCredentialsGrant();
      spotifyApi.setAccessToken(data.body.access_token);
      tokenExpirationTime = now + (data.body.expires_in * 1000) - 60000; // Refresh 1 minute early
      console.log(`✅ Spotify token refreshed, expires in ${data.body.expires_in}s`);
    } catch (error) {
      console.error('Failed to get Spotify access token:', error);
      throw new Error('Failed to authenticate with Spotify API');
    }
  }
}

/**
 * GET /api/artists/search/:query
 * Search for artists by name
 */
router.get('/search/:query', async (req: Request, res: Response): Promise<any> => {
  try {
    const { query } = req.params;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Search query cannot be empty'
      });
    }

    await ensureValidToken();

    const data = await spotifyApi.searchArtists(query, {
      limit: 10
    });

    const artists: ArtistSearchResult[] = data.body.artists?.items.map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      image_url: artist.images[0]?.url,
      genres: artist.genres,
      popularity: artist.popularity,
      followers: artist.followers.total,
      spotify_url: artist.external_urls.spotify
    })) || [];

    res.json({
      success: true,
      query,
      results: artists,
      count: artists.length
    });
  } catch (error) {
    console.error('Error searching artists:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search for artists'
    });
  }
});

/**
 * GET /api/artists/:artistId/albums
 * Get all albums for an artist
 */
router.get('/:artistId/albums', async (req: Request, res: Response): Promise<any> => {
  try {
    const { artistId } = req.params;

    await ensureValidToken();

    const data = await spotifyApi.getArtistAlbums(artistId, {
      limit: 50,
      include_groups: 'album'
    });

    const releases: AlbumRelease[] = data.body.items.map((album: any) => ({
      release_date: album.release_date,
      album_name: album.name,
      album_id: album.id,
      album_type: album.album_type,
      image_url: album.images[0]?.url
    }));

    // Remove duplicates by release date (keep first occurrence)
    const uniqueReleases = releases.filter((release, index, self) =>
      index === self.findIndex(r => r.release_date === release.release_date)
    );

    // Sort by release date (newest first)
    uniqueReleases.sort((a, b) =>
      new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
    );

    res.json({
      success: true,
      artist_id: artistId,
      releases: uniqueReleases,
      count: uniqueReleases.length
    });
  } catch (error) {
    console.error('Error fetching artist albums:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch artist albums'
    });
  }
});

/**
 * POST /api/artists/:artistId/predict
 * Predict next release date for an artist
 */
router.post('/:artistId/predict', async (req: Request, res: Response): Promise<any> => {
  try {
    const { artistId } = req.params;

    await ensureValidToken();

    // Get artist info
    const artistData = await spotifyApi.getArtist(artistId);
    const artistName = artistData.body.name;

    // Get artist albums
    const albumsData = await spotifyApi.getArtistAlbums(artistId, {
      limit: 50,
      include_groups: 'album'
    });

    const releases: AlbumRelease[] = albumsData.body.items.map((album: any) => ({
      release_date: album.release_date,
      album_name: album.name,
      album_id: album.id,
      album_type: album.album_type,
      image_url: album.images[0]?.url
    }));

    // Remove duplicates and sort
    const uniqueReleases = releases.filter((release, index, self) =>
      index === self.findIndex(r => r.release_date === release.release_date)
    );
    uniqueReleases.sort((a, b) =>
      new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
    );

    // Need at least 3 releases for prediction
    if (uniqueReleases.length < 3) {
      return res.status(400).json({
        error: 'Insufficient Data',
        message: `Artist has only ${uniqueReleases.length} album(s). At least 3 releases are required for prediction.`,
        artist_name: artistName,
        releases: uniqueReleases
      });
    }

    // Call Python ML model for prediction
    const dates = uniqueReleases.map(r => r.release_date);
    const prediction = await getPythonPrediction({ dates });

    const result: PredictionResult = {
      predicted_date: prediction.predicted_date,
      confidence: prediction.confidence,
      model_used: prediction.model_used,
      release_history: uniqueReleases
    };

    res.json({
      success: true,
      artist_id: artistId,
      artist_name: artistName,
      prediction: result
    });
  } catch (error: any) {
    console.error('Error predicting release:', error);

    if (error.message && error.message.includes('Insufficient data')) {
      return res.status(400).json({
        error: 'Insufficient Data',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to predict next release date'
    });
  }
});

/**
 * GET /api/artists/:artistId
 * Get artist details
 */
router.get('/:artistId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { artistId } = req.params;

    await ensureValidToken();

    const data = await spotifyApi.getArtist(artistId);
    const artist = data.body;

    const result: ArtistSearchResult = {
      id: artist.id,
      name: artist.name,
      image_url: artist.images[0]?.url,
      genres: artist.genres,
      popularity: artist.popularity,
      followers: artist.followers.total,
      spotify_url: artist.external_urls.spotify
    };

    res.json({
      success: true,
      artist: result
    });
  } catch (error) {
    console.error('Error fetching artist:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch artist details'
    });
  }
});

export default router;
