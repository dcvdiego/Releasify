const express = require('express');

const router = new express.Router();

const pythonCall = require('../utils/pythonCall');

const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

router.get('/call/:artist_id', async (req, res) => {
  try {
    spotifyApi.clientCredentialsGrant().then(
      (data) => {
        console.log('The access token expires in ' + data.body['expires_in']);
        console.log('The access token is ' + data.body['access_token']);

        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi
          .getArtistAlbums(req.params.artist_id, {
            offset: 0,
            limit: 50,
            include_groups: 'album',
          })
          .then(
            (data) => {
              const json = data.body.items.map((album) => album.release_date);
              const filter = [...new Set(json)];
              console.log(filter);
              const json_labeled = data.body.items.map((album) => {
                return {
                  release_date: album.release_date,
                  album_name: album.name,
                };
              });
              const filter_labeled = Array.from(
                new Set(json.map((a) => a.album_name))
              ).map((album_name) => {
                return json.find((a) => a.album_name === album_name);
              });
              //currently just sending the data out for debug, but this should be sent to python!
              res.send(filter_labeled);
            },
            (err) => {
              console.error(err);
              res.status(400).send(err);
            }
          );
      },
      (err) => {
        console.log(
          'Something went wrong when retrieving an access token',
          err
        );
      }
    );
    // avril lavigne id: 0p4nmQO2msCgU4IF37Wi3j
    // eminem id: 7dGJo4pcD2V6oG8kP0tJRR

    // const json = {
    //   array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    // };
    // pythonCall(json, 'example')
    //   .then(function (fromRunpy) {
    //     console.log(fromRunpy.toString());
    //     res.end(fromRunpy);
    //   })
    //   .catch((e) => res.status(400).send(e));
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get('/search/:query', async (req, res) => {
  try {
    spotifyApi.clientCredentialsGrant().then(
      (data) => {
        console.log('The access token expires in ' + data.body['expires_in']);
        console.log('The access token is ' + data.body['access_token']);

        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi
          .searchArtists(req.params.query, {
            offset: 0,
            limit: 5,
            fields: 'items',
          })
          .then(
            (data) => {
              console.log(
                `Search artists by: ${req.params.query}`,
                data.body.artists.items
              );
            },
            (err) => {
              console.error(err);
            }
          );
      },
      (err) => {
        console.log(
          'Something went wrong when retrieving an access token',
          err
        );
      }
    );
    // avril lavigne id: 0p4nmQO2msCgU4IF37Wi3j
    // eminem id: 7dGJo4pcD2V6oG8kP0tJRR
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;
