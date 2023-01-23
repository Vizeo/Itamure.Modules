using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection;

namespace CalendarTools
{
    internal static class CalendarManager
    {
        private static bool _processing = false;
        private static HttpClient _httpClient = new HttpClient(GetMessageHanlder(), false);

        public static async Task<string> GetCalendarData(string address)
        {
            while(_processing)
            {
                await Task.Delay(500);
            }

            try
            {
                _processing = true;
                _httpClient.DefaultRequestHeaders.ConnectionClose = true;
                var header = new ProductHeaderValue("Itamure-Calendar-Tools");
                var userAgent = new ProductInfoHeaderValue(header);
                _httpClient.DefaultRequestHeaders.UserAgent.Add(userAgent);

                return await _httpClient.GetStringAsync(address);
            }
            finally
            {
                _processing = false;
            }
        }

        private static HttpMessageHandler GetMessageHanlder()
        {
            SocketsHttpHandler handler = new SocketsHttpHandler();
            handler.PooledConnectionLifetime = TimeSpan.FromMinutes(2);

            return handler;
        }
    }
}
