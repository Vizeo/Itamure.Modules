using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OctoprintApi
{
    public class RetrieveResponse
    {
        public List<RetrieveResponseFile> Files { get; set; }
        public string Free { get; set; }
    }

    public class RetrieveResponseFile
    {
        public string origin { get; set; }
        public Prints prints { get; set; }
        public string name { get; set; }
        public Refs refs { get; set; }
        public Gcodeanalysis gcodeAnalysis { get; set; }
        public int? date { get; set; }
        public int? size { get; set; }
    }

    public class Prints
    {
        public int? failure { get; set; }
        public Last last { get; set; }
        public int? success { get; set; }
    }

    public class Last
    {
        public float? date { get; set; }
        public bool? success { get; set; }
    }

    public class Refs
    {
        public string download { get; set; }
        public string resource { get; set; }
    }

    public class Gcodeanalysis
    {
        public float? estimatedPrintTime { get; set; }
        public RetrieveResponseFilament filament { get; set; }
    }

    public class RetrieveResponseFilament
    {
        public Tool0 tool0 { get; set; }
    }

    public class Tool0
    {
        public float? volume { get; set; }
        public float? length { get; set; }
    }
}
