using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OctoprintApi
{
    public class FileResponse
    {
        public List<Entry> Files { get; set; }
        public double free { get; set; }
        public double total { get; set; }
    }

    public class Entry
    {
        public string name { get; set; }
        public string path { get; set; }
        public string type { get; set; }
        public List<string> typePath { get; set; }
        public string hash { get; set; }
        public int size { get; set; }
        public int date { get; set; }
        public string origin { get; set; }
        public Refs refs { get; set; }
        public List<Entry> children { get; set; }
    }
}
