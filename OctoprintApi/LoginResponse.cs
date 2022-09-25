using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OctoprintApi
{
    public class LoginResponse : UserRecord
    {
        public string Session { get; set; }
        public bool _is_external_client { get; set; }
    }
}
