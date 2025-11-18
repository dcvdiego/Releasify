export interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  genres: string[];
  popularity: number;
  followers: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  album_type: string;
  total_tracks: number;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  external_urls: {
    spotify: string;
  };
}

export interface AlbumRelease {
  release_date: string;
  album_name: string;
  album_id: string;
  album_type: string;
  image_url?: string;
}

export interface PredictionInput {
  dates: string[];
}

export interface PredictionResult {
  predicted_date: string;
  confidence: number;
  model_used: string;
  release_history: AlbumRelease[];
}

export interface ArtistSearchResult {
  id: string;
  name: string;
  image_url?: string;
  genres: string[];
  popularity: number;
  followers: number;
  spotify_url: string;
}
