using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OctoprintApi
{
    public class UserRecord
    {
        public string Name { get; set; }
        public bool Active { get; set; }
        public bool User { get; set; }
        public bool Admin { get; set; }
        public string ApiKey { get; set; }
        public List<string> Groups { get; set; }

        //Comming Soon
        //public Needs Needs { get; set; }
        //public object Settings { get; set; }
        //public List<Permission> Permissions { get; set; }
    }
}
