using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OctoprintApi
{
    public class ConnectionSettings
    {
        public ConnectionState Current { get; set; }
        public ConnectionOptions Options { get; set; }
    }

    public class ConnectionState 
    {
        public string State { get; set; }
        public string Port { get; set; }
        public int? Baudrate { get; set; }
        public string PrinterProfile { get; set; }
    }

    public class ConnectionOptions 
    {
        public List<string> Ports { get; set; }
        public List<int> Baudrates { get; set; }
        public List<PrinterProfile> PrinterProfiles { get; set; }
        public string PortPreference { get; set; }
        public int? BaudratePreference { get; set; }
        public string PrinterProfilePreference { get; set; }
        public bool Autoconnect { get; set; }
    }

    public class PrinterProfile
    {
        public string Name { get; set; }
        public string Id { get; set; }
    }
}
