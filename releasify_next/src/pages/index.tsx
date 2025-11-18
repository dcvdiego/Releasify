/** @jsxImportSource @emotion/react */
import React, { useState } from 'react';
import { NextPage } from 'next';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import Layout from '@/components/Layout';
import { searchArtists, predictRelease } from '@/utils/api';
import type { Artist, PredictionResponse } from '@/types';

const IndexPage: NextPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeSingles, setIncludeSingles] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setArtists([]);
    setSelectedArtist(null);
    setPrediction(null);

    try {
      const results = await searchArtists(searchQuery);
      setArtists(results);
      if (results.length === 0) {
        setError('No artists found. Try a different search term.');
      }
    } catch (err) {
      setError('Failed to search artists. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePredictRelease = async (artist: Artist) => {
    setSelectedArtist(artist);
    setPredicting(true);
    setError(null);
    setPrediction(null);

    try {
      const result = await predictRelease(artist.id, includeSingles);
      setPrediction(result);
    } catch (err: any) {
      setError(err.message || 'Failed to predict release date. This artist may not have enough release history.');
      console.error(err);
    } finally {
      setPredicting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return '#10b981'; // green
    if (confidence >= 0.5) return '#eab308'; // yellow
    return '#f97316'; // orange
  };

  return (
    <Layout title="Releasify - Predict Artist Release Dates">
      <Container>
        <Header>
          <Title>Releasify</Title>
          <Subtitle>Predict when your favorite artist will release new music</Subtitle>
        </Header>

        <SearchSection onSubmit={handleSearch}>
          <SearchInput
            type="text"
            placeholder="Search for an artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
          />
          <SearchButton type="submit" disabled={loading || !searchQuery.trim()}>
            {loading ? 'Searching...' : 'Search'}
          </SearchButton>
        </SearchSection>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {artists.length > 0 && !selectedArtist && (
          <ResultsSection>
            <OptionsRow>
              <SectionTitle>Select an artist:</SectionTitle>
              <CheckboxContainer>
                <Checkbox
                  type="checkbox"
                  id="includeSingles"
                  checked={includeSingles}
                  onChange={(e) => setIncludeSingles(e.target.checked)}
                />
                <CheckboxLabel htmlFor="includeSingles">
                  Include singles in prediction
                </CheckboxLabel>
              </CheckboxContainer>
            </OptionsRow>
            <ArtistGrid>
              {artists.map((artist) => (
                <ArtistCard
                  key={artist.id}
                  onClick={() => handlePredictRelease(artist)}
                >
                  {artist.image_url && (
                    <ArtistImage src={artist.image_url} alt={artist.name} />
                  )}
                  <ArtistInfo>
                    <ArtistName>{artist.name}</ArtistName>
                    <ArtistMeta>
                      {artist.followers.toLocaleString()} followers
                    </ArtistMeta>
                    {artist.genres.length > 0 && (
                      <GenreList>
                        {artist.genres.slice(0, 3).map((genre, idx) => (
                          <GenreTag key={idx}>{genre}</GenreTag>
                        ))}
                      </GenreList>
                    )}
                  </ArtistInfo>
                </ArtistCard>
              ))}
            </ArtistGrid>
          </ResultsSection>
        )}

        {predicting && (
          <LoadingSection>
            <LoadingSpinner />
            <LoadingText>Analyzing release history and predicting...</LoadingText>
          </LoadingSection>
        )}

        {prediction && selectedArtist && (
          <PredictionSection>
            <BackButton onClick={() => {
              setSelectedArtist(null);
              setPrediction(null);
            }}>
              ← Back to results
            </BackButton>

            <ArtistHeader>
              {selectedArtist.image_url && (
                <ArtistImageLarge src={selectedArtist.image_url} alt={selectedArtist.name} />
              )}
              <div>
                <ArtistNameLarge>{selectedArtist.name}</ArtistNameLarge>
                <ArtistMeta>{selectedArtist.followers.toLocaleString()} followers</ArtistMeta>
              </div>
            </ArtistHeader>

            {prediction.warnings && prediction.warnings.length > 0 && (
              <WarningCard>
                <WarningIcon>⚠️</WarningIcon>
                <WarningText>
                  {prediction.warnings[0].message}
                </WarningText>
              </WarningCard>
            )}

            <PredictionCard>
              <PredictionTitle>Predicted Next Release</PredictionTitle>
              <PredictedDate>{formatDate(prediction.prediction.predicted_date)}</PredictedDate>
              <ConfidenceRow>
                <ConfidenceLabel>Confidence:</ConfidenceLabel>
                <ConfidenceValue style={{ color: getConfidenceColor(prediction.prediction.confidence) }}>
                  {(prediction.prediction.confidence * 100).toFixed(0)}%
                </ConfidenceValue>
              </ConfidenceRow>
              <ModelInfo>Model: {prediction.prediction.model_used}</ModelInfo>
              {includeSingles && (
                <ModelInfo>Includes singles in analysis</ModelInfo>
              )}
            </PredictionCard>

            <ReleaseHistorySection>
              <SectionTitle>Release History</SectionTitle>
              <ReleaseTimeline>
                {prediction.prediction.release_history.slice().reverse().map((release, idx) => (
                  <TimelineItem key={idx}>
                    <TimelineDate>{formatDate(release.release_date)}</TimelineDate>
                    <TimelineDot />
                    <TimelineContent>
                      <AlbumName>{release.album_name}</AlbumName>
                      {release.image_url && (
                        <AlbumImage src={release.image_url} alt={release.album_name} />
                      )}
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </ReleaseTimeline>
            </ReleaseHistorySection>
          </PredictionSection>
        )}
      </Container>
    </Layout>
  );
};

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(to bottom right, #581c87, #4338ca, #1e40af);
  padding: 3rem 1rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 3.75rem;
  font-weight: bold;
  color: white;
  margin-bottom: 1rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #e9d5ff;
`;

const SearchSection = styled.form`
  max-width: 42rem;
  margin: 0 auto 3rem;
  display: flex;
  gap: 1rem;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 1rem 1.5rem;
  border-radius: 9999px;
  font-size: 1.125rem;
  border: 2px solid #d8b4fe;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #a855f7;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SearchButton = styled.button`
  padding: 1rem 2rem;
  background: #9333ea;
  color: white;
  border-radius: 9999px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background: #7e22ce;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  max-width: 42rem;
  margin: 0 auto 2rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid #ef4444;
  border-radius: 0.5rem;
  color: #fecaca;
  text-align: center;
`;

const ResultsSection = styled.div`
  max-width: 72rem;
  margin: 0 auto;
`;

const OptionsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin: 0;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Checkbox = styled.input`
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  accent-color: #9333ea;
`;

const CheckboxLabel = styled.label`
  color: #e9d5ff;
  font-size: 1rem;
  cursor: pointer;
  user-select: none;
`;

const ArtistGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const ArtistCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }
`;

const ArtistImage = styled.img`
  width: 100%;
  height: 12rem;
  object-fit: cover;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
`;

const ArtistInfo = styled.div`
  color: white;
`;

const ArtistName = styled.h3`
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const ArtistMeta = styled.p`
  font-size: 0.875rem;
  color: #e9d5ff;
  margin-bottom: 0.5rem;
`;

const GenreList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const GenreTag = styled.span`
  font-size: 0.75rem;
  background: rgba(147, 51, 234, 0.4);
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
`;

const LoadingSection = styled.div`
  text-align: center;
  padding: 4rem 0;
`;

const LoadingSpinner = styled.div`
  width: 4rem;
  height: 4rem;
  border: 4px solid #d8b4fe;
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  color: white;
  font-size: 1.125rem;
`;

const PredictionSection = styled.div`
  max-width: 56rem;
  margin: 0 auto;
`;

const BackButton = styled.button`
  color: #e9d5ff;
  background: none;
  border: none;
  cursor: pointer;
  margin-bottom: 1.5rem;
  transition: color 0.2s;
  font-size: 1rem;

  &:hover {
    color: white;
  }
`;

const ArtistHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ArtistImageLarge = styled.img`
  width: 6rem;
  height: 6rem;
  border-radius: 50%;
  object-fit: cover;
`;

const ArtistNameLarge = styled.h2`
  font-size: 1.875rem;
  font-weight: bold;
  color: white;
  margin-bottom: 0.5rem;
`;

const WarningCard = styled.div`
  background: rgba(245, 158, 11, 0.2);
  border: 2px solid #f59e0b;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const WarningIcon = styled.div`
  font-size: 2rem;
  flex-shrink: 0;
`;

const WarningText = styled.p`
  color: #fef3c7;
  font-size: 1rem;
  line-height: 1.5;
`;

const PredictionCard = styled.div`
  background: linear-gradient(to right, #9333ea, #ec4899);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
  border: 4px solid rgba(255, 255, 255, 0.3);
`;

const PredictionTitle = styled.h3`
  font-size: 1.25rem;
  color: #f3e8ff;
  margin-bottom: 1rem;
`;

const PredictedDate = styled.div`
  font-size: 3rem;
  font-weight: bold;
  color: white;
  margin-bottom: 1.5rem;
`;

const ConfidenceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
`;

const ConfidenceLabel = styled.span`
  color: #f3e8ff;
`;

const ConfidenceValue = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
`;

const ModelInfo = styled.p`
  font-size: 0.875rem;
  color: #e9d5ff;
`;

const ReleaseHistorySection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ReleaseTimeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const TimelineItem = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
`;

const TimelineDate = styled.div`
  color: #e9d5ff;
  font-weight: 600;
  min-width: 7.5rem;
`;

const TimelineDot = styled.div`
  width: 1rem;
  height: 1rem;
  background: #c084fc;
  border-radius: 50%;
  margin-top: 0.25rem;
  flex-shrink: 0;
`;

const TimelineContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const AlbumName = styled.div`
  color: white;
  font-weight: 500;
  flex: 1;
`;

const AlbumImage = styled.img`
  width: 3rem;
  height: 3rem;
  border-radius: 0.25rem;
  object-fit: cover;
`;

export default IndexPage;
