using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace OctoprintApi
{
    //https://docs.octoprint.org/en/master/api/connection.html
    public class Service
    {
        private string _apiKey;
        private HttpClient _httpClient;

        internal string Address { get; }

        public Service(string address, string apiKey)
        {
            address = address.ToLower();
            Uri myUri = new Uri(address);

            var ips = Dns.GetHostEntry(myUri.Host);
            var ip = ips.AddressList.FirstOrDefault(i => i.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork);

            if (ip != null)
            {
                Address = address.Replace(myUri.Host, ip.ToString());
            }
            else
            {
                Address = address;
            }
            _apiKey = apiKey;
        }

        private async Task<T> MakeRequest<T>(string endpoint)
        {
            if (_httpClient == null)
            {
                _httpClient = new HttpClient();
                _httpClient.DefaultRequestHeaders.Add("X-Api-Key", _apiKey);
            }

            try
            {
                var url = $"{Address}/api/{endpoint}";
                var response = await _httpClient.GetAsync(url);

                response.EnsureSuccessStatusCode();

                var jsonResult = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<T>(jsonResult, new JsonSerializerOptions()
                {
                    PropertyNameCaseInsensitive = true,
                    AllowTrailingCommas = true,
                    DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                throw;
            }
        }

        private async Task<T> MakeRequest<T>(string endpoint, object data)
        {
            if (_httpClient == null)
            {
                _httpClient = new HttpClient();
                _httpClient.DefaultRequestHeaders.Add("X-Api-Key", _apiKey);
            }

            try
            {
                var url = $"http://{Address}/api/{endpoint}";

                var json = JsonSerializer.Serialize(data);
                var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(url, content);

                response.EnsureSuccessStatusCode();
                var jsonResult = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<T>(jsonResult, new JsonSerializerOptions()
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                throw;
            }
        }

        private async Task MakeRequest(string endpoint, object data)
        {
            if (_httpClient == null)
            {
                _httpClient = new HttpClient();
                _httpClient.DefaultRequestHeaders.Add("X-Api-Key", _apiKey);
            }

            try
            {
                var url = $"http://{Address}/api/{endpoint}";

                var json = JsonSerializer.Serialize(data);
                var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(url, content);

                response.EnsureSuccessStatusCode();
                var jsonResult = await response.Content.ReadAsStringAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                throw;
            }
        }

        public async Task<VersionInformationResponse> Version()
        {
            return await MakeRequest<VersionInformationResponse>("server");
        }

        public async Task<ServerInformationResponse> Server()
        {
            return await MakeRequest<ServerInformationResponse>("server");
        }

        public async Task<ConnectionSettings> Connection()
        {
            return await MakeRequest<ConnectionSettings>("connection");
        }

        public async Task Connection(ConnectionRequest connectionRequest)
        {
            await MakeRequest("connection", connectionRequest);
        }

        public async Task<JobInformationResponse> Job()
        {
            return await MakeRequest<JobInformationResponse>("job");
        }

        public async Task<UserRecord> CurrentUser()
        {
            return await MakeRequest<UserRecord>("currentuser");
        }

        public async Task<LoginResponse> Login()
        {
            return await MakeRequest<LoginResponse>("login", new { passive = true });
        }

        public async Task<PrinterState> Printer()
        {
            return await MakeRequest<PrinterState>($"printer");
        }

        public async Task<Stream> DownloadCurrentFile(JobFile jobFile)
        {
            var fileResponse = await MakeRequest<FileResponse>($"files?recursive=true");                      
            var file = FindFileRecursive(jobFile, fileResponse.Files);
            var stream = await _httpClient.GetStreamAsync(file.refs.download);
            var memoryStream = new MemoryStream();
            await stream.CopyToAsync(memoryStream);
            memoryStream.Position = 0;
            return memoryStream;
        }

        private Entry FindFileRecursive(JobFile jobFile, IEnumerable<Entry> entries)
        {
            foreach (var file in entries)
            {
                if (file.type != "folder")
                {
                    if (file.name == jobFile.Name &&
                    file.size == jobFile.Size &&
                    file.date == jobFile.Date)
                    {
                        return file;
                    }
                }
                else
                {
                    var foundfile = FindFileRecursive(jobFile, file.children);
                    if(foundfile != null)
                    {
                        return foundfile;
                    }
                }
            }

            return null;
        }
    }
}
