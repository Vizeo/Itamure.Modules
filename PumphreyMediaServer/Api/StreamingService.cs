using IntegratedWebServer.Core;
using IntegratedWebServer.Core.RequestProcessors;
using MediaServer;
using MediaServer.Entities;
using Microsoft.AspNetCore.Mvc.Formatters;
using System;
using System.IO;
using System.IO.Pipes;
using System.Linq.Expressions;
using System.Net.Mime;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using UpnpLib.Devices.Services.Media.Dlna;

namespace MediaServer.Api
{
    [RequestProcessorMap($"/{Module.WEB_ROUTE_BASE}/streamingService")]
    public class StreamingService : IRequestProcessor
    {
        private static UTF8Encoding _encoder = new UTF8Encoding(false);

        public async Task<bool> ProcessRequest(IRequest request, IResponse response, IntegratedWebServer.Core.ISession session)
        {
            if (Module.ObjectStore == null)
            {
                throw new NullReferenceException("ObjectStore is null");
            }
            var headerOnly = request.Method.ToUpper() == "HEAD";

            var uniqueKey = request.QueryStringVariables["UniqueKey"];
            if (uniqueKey != null &&
                Guid.TryParse(uniqueKey, out var userUniqueKey))
            {
                var userMediaReference = Module.ObjectStore.Retrieve<UserMediaReference>()
                    .FirstOrDefault(r => r.UniqueLink == userUniqueKey); //TODO: Cache this?

                MediaItem? mediaItem = null;
                if (userMediaReference != null)
                {
                    mediaItem = Module.ObjectStore.Retrieve<MediaItem>(userMediaReference.MediaItemId);
                }

                if (mediaItem != null &&
                    mediaItem is FileMediaItem &&
                    System.IO.File.Exists(((FileMediaItem)mediaItem).FilePath))
                {
                    var fileMediaItem = (FileMediaItem)mediaItem;
                    var mediaPath = fileMediaItem.FilePath!;

                    //Setup Content Type
                    var extension = Path.GetExtension(mediaPath);
                    string contentType;
                    var mediaFileType = Module.ObjectStore.Retrieve<MediaFileType>()
                        .FirstOrDefault(m => m.FileExtension!.ToUpper() == extension!.ToUpper());
                    if (mediaFileType != null)
                    {
                        contentType = mediaFileType.ContentType!;
                    }
                    else
                    {
                        contentType = $"{mediaItem.MediaType}/{extension}".ToLower();
                    }
                    response.Headers.Add("Content-Type", contentType);

                    //DLNA Headers
                    response.Headers.Add("USER-AGENT", "DLNADOC");
                    response.Headers.Add("transferMode.dlna.org", "Streaming");
                    response.Headers.Add("contentFeatures.dlna.org", $"DLNA.ORG_OP=01;DLNA.ORG_CI=0;DLNA.ORG_FLAGS={DefaultDlnaFlags.DefaultStreaming}");

                    //Load stream
                    var filestream = new FileStream(mediaPath, FileMode.Open, FileAccess.Read, FileShare.Read);
                    var rangeHeader = request.HeaderValues["Range"];
                    if (rangeHeader != null)
                    {
                        var indexOfEq = rangeHeader.IndexOf('=');
                        var arrayType = rangeHeader.Substring(0, indexOfEq);

                        if (arrayType == "bytes")
                        {
                            long start = 0;
                            long end = filestream.Length;

                            var ranges = new List<Range>();
                            var arrays = rangeHeader.Substring(indexOfEq + 1).Split(',');

                            if (arrays.Length > 1)
                            {
                                //Don't support multiple ranges
                                SendRangeNotSatisfiable(response);
                            }

                            foreach (var array in arrays)
                            {
                                var arrSplit = array.Trim().Split('-');

                                if (arrSplit[0].Length == 0)
                                {
                                    //Suffix-length
                                    end = long.Parse(arrSplit[1]);
                                    start = filestream.Length - end;
                                }
                                else if (arrSplit.Length == 1 ||
                                    arrSplit[1].Length == 0)
                                {
                                    start = long.Parse(arrSplit[0]);
                                    end = filestream.Length;
                                }
                                else
                                {
                                    start = long.Parse(arrSplit[0]);
                                    end = long.Parse(arrSplit[1]);
                                }
                            }

                            response.SetResponseHeader("HTTP/1.1 206 Partial Content");
                            response.Headers.Add("Content-Range", $"bytes {start}-{end - 1}/{filestream.Length}");
                            if (!headerOnly)
                            {
                                response.AddContent(new MediaStream(filestream, start, end), end - start);
                            }
                            else
                            {
                                //Create an empty stream
                                response.AddContent(new System.IO.MemoryStream(new byte[0]), end - start);
                            }
                        }
                        else
                        {
                            SendRangeNotSatisfiable(response);
                        }
                    }
                    else
                    {
                        response.SetResponseHeader("HTTP/1.1 200 OK");
                        if (!headerOnly)
                        {
                            response.AddContent(new MediaStream(filestream, 0, filestream.Length), filestream.Length);
                        }
                        else
                        {
                            //Create an empty stream
                            response.AddContent(new System.IO.MemoryStream(new byte[0]), filestream.Length);
                        }
                    }
                }
                else
                {
                    response.SetResponseHeader("HTTP/1.1 404 Not Found");
                    var stream = new MemoryStream(_encoder.GetBytes(string.Empty));
                    response.AddContent(stream, stream.Length);
                }
            }

            return await Task.FromResult(true);
        }

        private void SendRangeNotSatisfiable(IResponse response)
        {
            response.SetResponseHeader("HTTP/1.1 404 Not Found");
            var stream = new MemoryStream(_encoder.GetBytes(string.Empty));
            response.AddContent(stream, stream.Length);
        }
    }

    internal class MediaStream : Stream
    {
        private FileStream _fileStream;
        private long _end;

        public MediaStream(FileStream fileStream, long start, long end)
        {
            _fileStream = fileStream;
            _end = end;
            fileStream.Position = start;
        }

        public override bool CanRead => _fileStream.CanRead;

        public override bool CanSeek => false;

        public override bool CanWrite => false;

        public override long Length => _fileStream.Length;

        public override long Position { get => _fileStream.Position; set => throw new NotImplementedException(); }

        public override void Flush()
        {
        }

        public override int Read(byte[] buffer, int offset, int count)
        {
            if (Position + count > _end)
            {
                count = Convert.ToInt32(_end - Position);
            }

            return _fileStream.Read(buffer, offset, count);
        }

        public override long Seek(long offset, SeekOrigin origin)
        {
            throw new NotImplementedException();
        }

        public override void SetLength(long value)
        {
            throw new NotImplementedException();
        }

        public override void Write(byte[] buffer, int offset, int count)
        {
            throw new NotImplementedException();
        }

        public override void Close()
        {
            _fileStream.Close();
        }
    }
}
