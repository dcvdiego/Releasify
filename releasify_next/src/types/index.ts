export interface Artist {
  id: string;
  name: string;
  image_url?: string;
  genres: string[];
  popularity: number;
  followers: number;
  spotify_url: string;
}

export interface AlbumRelease {
  release_date: string;
  album_name: string;
  album_id: string;
  album_type: string;
  image_url?: string;
}

export interface Prediction {
  predicted_date: string;
  confidence: number;
  model_used: string;
  release_history: AlbumRelease[];
}

export interface PredictionResponse {
  success: boolean;
  artist_id: string;
  artist_name: string;
  prediction: Prediction;
}

export interface SearchResponse {
  success: boolean;
  query: string;
  results: Artist[];
  count: number;
}
