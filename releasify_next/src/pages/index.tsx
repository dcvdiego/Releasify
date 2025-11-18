import React, { useState } from 'react';
import { NextPage } from 'next';
import tw, { styled } from 'twin.macro';
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
      const result = await predictRelease(artist.id);
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
    if (confidence >= 0.7) return tw`text-green-500`;
    if (confidence >= 0.5) return tw`text-yellow-500`;
    return tw`text-orange-500`;
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
            <SectionTitle>Select an artist:</SectionTitle>
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

            <PredictionCard>
              <PredictionTitle>Predicted Next Release</PredictionTitle>
              <PredictedDate>{formatDate(prediction.prediction.predicted_date)}</PredictedDate>
              <ConfidenceRow>
                <ConfidenceLabel>Confidence:</ConfidenceLabel>
                <ConfidenceValue css={getConfidenceColor(prediction.prediction.confidence)}>
                  {(prediction.prediction.confidence * 100).toFixed(0)}%
                </ConfidenceValue>
              </ConfidenceRow>
              <ModelInfo>Model: {prediction.prediction.model_used}</ModelInfo>
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
  ${tw`min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 py-12 px-4`}
`;

const Header = styled.div`
  ${tw`text-center mb-12`}
`;

const Title = styled.h1`
  ${tw`text-6xl font-bold text-white mb-4`}
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  ${tw`text-xl text-purple-200`}
`;

const SearchSection = styled.form`
  ${tw`max-w-2xl mx-auto mb-12 flex gap-4`}
`;

const SearchInput = styled.input`
  ${tw`flex-1 px-6 py-4 rounded-full text-lg border-2 border-purple-300 focus:border-purple-500 focus:outline-none transition-colors`}
  &:disabled {
    ${tw`opacity-50 cursor-not-allowed`}
  }
`;

const SearchButton = styled.button`
  ${tw`px-8 py-4 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
`;

const ErrorMessage = styled.div`
  ${tw`max-w-2xl mx-auto mb-8 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-200 text-center`}
`;

const ResultsSection = styled.div`
  ${tw`max-w-6xl mx-auto`}
`;

const SectionTitle = styled.h2`
  ${tw`text-2xl font-semibold text-white mb-6`}
`;

const ArtistGrid = styled.div`
  ${tw`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}
`;

const ArtistCard = styled.div`
  ${tw`bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 cursor-pointer hover:bg-opacity-20 transition-all hover:scale-105 border border-white border-opacity-20`}
`;

const ArtistImage = styled.img`
  ${tw`w-full h-48 object-cover rounded-lg mb-4`}
`;

const ArtistInfo = styled.div`
  ${tw`text-white`}
`;

const ArtistName = styled.h3`
  ${tw`text-xl font-bold mb-2`}
`;

const ArtistMeta = styled.p`
  ${tw`text-sm text-purple-200 mb-2`}
`;

const GenreList = styled.div`
  ${tw`flex flex-wrap gap-2 mt-2`}
`;

const GenreTag = styled.span`
  ${tw`text-xs bg-purple-500 bg-opacity-40 px-2 py-1 rounded-full`}
`;

const LoadingSection = styled.div`
  ${tw`text-center py-16`}
`;

const LoadingSpinner = styled.div`
  ${tw`w-16 h-16 border-4 border-purple-300 border-t-white rounded-full animate-spin mx-auto mb-4`}
`;

const LoadingText = styled.p`
  ${tw`text-white text-lg`}
`;

const PredictionSection = styled.div`
  ${tw`max-w-4xl mx-auto`}
`;

const BackButton = styled.button`
  ${tw`text-purple-200 hover:text-white mb-6 transition-colors`}
`;

const ArtistHeader = styled.div`
  ${tw`flex items-center gap-6 mb-8 bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20`}
`;

const ArtistImageLarge = styled.img`
  ${tw`w-24 h-24 rounded-full object-cover`}
`;

const ArtistNameLarge = styled.h2`
  ${tw`text-3xl font-bold text-white mb-2`}
`;

const PredictionCard = styled.div`
  ${tw`bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 mb-8 text-center border-4 border-white border-opacity-30`}
`;

const PredictionTitle = styled.h3`
  ${tw`text-xl text-purple-100 mb-4`}
`;

const PredictedDate = styled.div`
  ${tw`text-5xl font-bold text-white mb-6`}
`;

const ConfidenceRow = styled.div`
  ${tw`flex items-center justify-center gap-4 mb-2`}
`;

const ConfidenceLabel = styled.span`
  ${tw`text-purple-100`}
`;

const ConfidenceValue = styled.span`
  ${tw`text-2xl font-bold`}
`;

const ModelInfo = styled.p`
  ${tw`text-sm text-purple-200`}
`;

const ReleaseHistorySection = styled.div`
  ${tw`bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 border border-white border-opacity-20`}
`;

const ReleaseTimeline = styled.div`
  ${tw`space-y-6`}
`;

const TimelineItem = styled.div`
  ${tw`flex gap-4 items-start`}
`;

const TimelineDate = styled.div`
  ${tw`text-purple-200 font-semibold min-w-[120px]`}
`;

const TimelineDot = styled.div`
  ${tw`w-4 h-4 bg-purple-400 rounded-full mt-1 flex-shrink-0`}
`;

const TimelineContent = styled.div`
  ${tw`flex-1 flex items-center gap-4`}
`;

const AlbumName = styled.div`
  ${tw`text-white font-medium flex-1`}
`;

const AlbumImage = styled.img`
  ${tw`w-12 h-12 rounded object-cover`}
`;

export default IndexPage;
