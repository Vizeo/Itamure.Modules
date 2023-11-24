using MediaServer;
using MediaServer.Entities;
using MediaServer.Omdb;
using System.ComponentModel.DataAnnotations;

namespace PumphreyMediaServer.Tasks
{
    public class VideoFileSync : ISync
    {
        private List<Series> _series;
        private List<Rating> _seriesRating;
        private List<Rating> _movieRating;
        private OmdbManager? _omdbManager;

        public VideoFileSync() 
        {
            _series = Module.ObjectStore!.Retrieve<Series>()
                .ToList();

            _seriesRating = Module.ObjectStore!.Retrieve<Rating>()
                .Where(r => r.MediaSubType == MediaSubType.Series)
                .ToList();

            _movieRating = Module.ObjectStore!.Retrieve<Rating>()
                .Where(r => r.MediaSubType == MediaSubType.Movies)
                .ToList();

            _omdbManager = OmdbManager.Current;
        }

        public bool TryImportMetadata(MediaItem mediaItem, TagLib.File metaData)
        {
            var videoFileMediaItem = mediaItem as VideoFileMediaItem;

            videoFileMediaItem!.Description = metaData.Tag.Description;

            if (!string.IsNullOrWhiteSpace(metaData.Tag.AmazonId))
            {
                videoFileMediaItem.ImdbID = metaData.Tag.AmazonId;
            }

            videoFileMediaItem.Year = metaData.Tag.Year;
            videoFileMediaItem.Duration = Convert.ToDecimal(metaData.Properties.Duration.TotalSeconds);
            videoFileMediaItem.Height = Convert.ToInt16(metaData.Properties.VideoHeight);
            videoFileMediaItem.Width = Convert.ToInt16(metaData.Properties.VideoWidth);

            var metadataTags = new List<MetadataTag>();
            foreach(var actor in metaData.Tag.Performers)
            {
                metadataTags.Add(new MetadataTag()
                {
                    MetadataTagType = MetadataTagType.Actor,
                    Value = actor
                });
            }

            if (metaData.Tag.Conductor != null)
            {
                foreach (var director in metaData.Tag.Conductor.Split(","))
                {
                    metadataTags.Add(new MetadataTag()
                    {
                        MetadataTagType = MetadataTagType.Director,
                        Value = director
                    });
                }
            }

            foreach (var writers in metaData.Tag.Composers)
            {
                metadataTags.Add(new MetadataTag()
                {
                    MetadataTagType = MetadataTagType.Writer,
                    Value = writers
                });
            }

            foreach (var genre in metaData.Tag.Genres)
            {
                metadataTags.Add(new MetadataTag()
                {
                    MetadataTagType = MetadataTagType.Genre,
                    Value = genre
                });
            }

            videoFileMediaItem.MetadataTags = metadataTags;

            switch (metaData.Tag.Grouping)
            {
                case "Episode":
                    var series = _series.FirstOrDefault(s => s.Name!.ToUpper() == metaData.Tag.Album.ToUpper());
                    if (series == null)
                    {
                        series = new Series()
                        {
                            Name = metaData.Tag.Album,
                            Seasons = new List<Season>()
                        };
                        _series.Add(series);
                    }

                    var season = series!.Seasons!.FirstOrDefault(s => s.Order == metaData.Tag.Disc);
                    var maxSeasonId = series!.Seasons!.Count > 0 ? series!.Seasons!.Max(s => s.Id) + 1 : 1;
                    if (season == null)
                    {
                        season = new Season()
                        {
                            Id = maxSeasonId,
                            Name = $"Season {metaData.Tag.Disc.ToString().PadLeft(2, '0')}",
                            Order = Convert.ToInt32(metaData.Tag.Disc)
                        };

                        series!.Seasons!.Add(season);
                        series!.Seasons!.Sort((a, b) =>
                        {
                            if (a.Order < b.Order) return -1;
                            if (a.Order > b.Order) return 1;
                            return 0;
                        });

                        Module.ObjectStore!.Store(series);
                    }

                    videoFileMediaItem.MediaItemType = MediaItemType.SeriesFile;
                    videoFileMediaItem.SeriesId = Convert.ToInt16(series.Id);
                    videoFileMediaItem.SeasonId = Convert.ToInt16(season.Id);
                    videoFileMediaItem.Order = Convert.ToInt32(metaData.Tag.Track);

                    //Try to get the series ImdbId if it does not exist
                    if (_omdbManager != null)
                    {
                        Task.Run(async () =>
                        {
                            if (!string.IsNullOrWhiteSpace(metaData.Tag.AmazonId) &&
                                string.IsNullOrWhiteSpace(series.ImdbID))
                            {
                                try
                                {
                                    var metadataResult = await _omdbManager.GetEpisodeMetadataAsync(metaData.Tag.AmazonId);
                                    if (metadataResult != null &&
                                        !string.IsNullOrWhiteSpace(metadataResult.SeriesID))
                                    {
                                        series.ImdbID = metadataResult.SeriesID;
                                    }

                                    var imdbId = series.ImdbID!;
                                    var seriesResult = await _omdbManager.GetSeriesMetadataAsync(imdbId);
                                    if (seriesResult != null)
                                    {
                                        series.Description = seriesResult.Plot;
                                        if (!string.IsNullOrWhiteSpace(seriesResult.Title))
                                        {
                                            series.Name = seriesResult.Title;
                                        }

                                        if (!string.IsNullOrWhiteSpace(seriesResult.Rated))
                                        {
                                            series.RatingId = _seriesRating.FirstOrDefault(r => r.Name!.ToUpper() == seriesResult.Rated.ToUpper())?.Id;
                                        }
                                    }

                                    Module.ObjectStore!.Update<Series>(series.Id, new
                                    {
                                        series.ImdbID,
                                        series.RatingId,
                                        series.Name,
                                        series.Description
                                    });
                                }
                                catch
                                {
                                    //Do nothing
                                }
                            }

                            //Try to get the series image if it does not exist
                            var seriesImage = Module.ObjectStore!.Retrieve<SeriesImage>()
                                .FirstOrDefault(s => s.SeriesId == series.Id);

                            if (seriesImage == null &&
                                !string.IsNullOrWhiteSpace(series.ImdbID))
                            {
                                try
                                {
                                    var imageResult = await _omdbManager.GetPosterAsync(series.ImdbID!);
                                    if (imageResult != null &&
                                        imageResult.Stream != null &&
                                        imageResult.Stream.Length > 0)
                                    {
                                        var buffer = new byte[imageResult.Stream.Length];
                                        imageResult.Stream.Read(buffer, 0, buffer.Length);

                                        seriesImage = new SeriesImage()
                                        {
                                            SeriesId = series.Id,
                                            MimeType = imageResult.ContentType,
                                            Data = buffer
                                        };

                                        Module.ObjectStore!.Store(seriesImage);
                                    }
                                }
                                catch
                                {
                                    //Do nothing
                                }
                            }

                            //if (string.IsNullOrWhiteSpace(metaData.Tag.AmazonId) &&
                            //    !string.IsNullOrWhiteSpace(series.ImdbID) &&
                            //    videoFileMediaItem.SeasonId.HasValue)
                            //{
                            //    try
                            //    {
                            //        //Try to get the imdb tag for the episode
                            //        var season = series.Seasons.FirstOrDefault(s => s.Id == videoFileMediaItem.SeasonId.Value);
                            //        if (season != null)
                            //        {
                            //            var metadataResult = await _omdbManager.EpisodeSearchAsync(series.Name!, season.Order, videoFileMediaItem.Order);
                            //            if (metadataResult != null &&
                            //                !string.IsNullOrWhiteSpace(metadataResult.ImdbID))
                            //            {
                            //                metaData.Tag.AmazonId = metadataResult.ImdbID;
                            //                metaData.Save();
                            //            }
                            //        }
                            //    }
                            //    catch
                            //    {
                            //        //Do nothing
                            //    }
                            //}
                        }).Wait();
                    }

                    break;
                case "Movie":
                    videoFileMediaItem.MediaItemType = MediaItemType.MovieFile;
                    videoFileMediaItem.FolderId = -1;
                    break;
            }

            if (!string.IsNullOrWhiteSpace(metaData.Tag.AmazonId) &&
                (metaData.Tag.Performers == null || metaData.Tag.Performers.Count() == 0))
            {
                try
                {
                    var metadataResult = _omdbManager.GetMovieMetadataAsync(metaData.Tag.AmazonId).Result;
                    if (metadataResult != null &&
                        !string.IsNullOrWhiteSpace(metadataResult.ImdbID))
                    {
                        metaData.Tag.Genres = GetMetadataFromTags(metadataResult.Genre!);
                        metaData.Tag.Performers = GetMetadataFromTags(metadataResult.Actors!);
                        metaData.Tag.Composers = GetMetadataFromTags(metadataResult.Writer!);
                        metaData.Tag.Conductor = metadataResult.Director!;
                        metaData.Save();
                    }
                    else
                    {
                        throw new Exception("That's it");
                    }
                }
                catch
                {
                    //Do nothing
                }
            }

            return true;
        }

        private string[] GetMetadataFromTags(string data)
        {
            var result = new List<string>();

            var splits = data.Split(",");
            foreach ( var split in splits)
            {
                result.Add(split.Trim());
            }

            return result.ToArray();
        }

        public bool TryImportImage(MediaItem mediaItem, TagLib.File metaData)
        {
            if(metaData.Tag.Pictures.Length > 0)
            {
                var image = metaData.Tag.Pictures[0];
                var data = image.Data.Data;
                var mimeType = image.MimeType;

                //If a image already exists we will update it else replace it
                var metaDataImage = Module.ObjectStore!.Retrieve<MetadataImage>()
                    .FirstOrDefault(m => m.MediaItemId == mediaItem.Id);

                if (metaDataImage == null)
                {
                    metaDataImage = new MetadataImage()
                    {
                        MediaItemId = mediaItem.Id,
                    };
                    metaDataImage.Data = data;
                    metaDataImage.MimeType = mimeType;
                    Module.ObjectStore!.Store(metaDataImage);
                }
                else
                {
                    Module.ObjectStore!.Update<MetadataImage>(metaDataImage.Id, new
                    {
                        Data = data,
                        MimeType = mimeType
                    });
                }
            }

            return true;
        }
    }
}
