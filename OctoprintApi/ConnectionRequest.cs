using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OctoprintApi
{
    public class ConnectionRequest
    {
        public string Command { get; set; }
        public string Port { get; set; }
        //public int Baudrate { get; set; }
        //public string PrinterProfile { get; set; }
        //public bool Save { get; set; }
        //public bool AutoConnect { get; set; }
    }
}
