import type { Artist, PredictionResponse, SearchResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function searchArtists(query: string): Promise<Artist[]> {
  const response = await fetch(`${API_URL}/api/artists/search/${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error('Failed to search artists');
  }

  const data: SearchResponse = await response.json();
  return data.results;
}

export async function predictRelease(artistId: string): Promise<PredictionResponse> {
  const response = await fetch(`${API_URL}/api/artists/${artistId}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to predict release date');
  }

  return response.json();
}

export async function getArtist(artistId: string): Promise<Artist> {
  const response = await fetch(`${API_URL}/api/artists/${artistId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch artist details');
  }

  const data = await response.json();
  return data.artist;
}
