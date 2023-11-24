using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OctoprintApi
{
    public class JobInformationResponse
    {
        public Job Job { get; set; }

        public Progress Progress { get; set; }

        public string State { get; set; }
    }

    public class JobFile
    {
        public string Name { get; set; }

        public string Origin { get; set; }

        public int? Size { get; set; }

        public int? Date { get; set; }
    }
    
    public class Tool
    {
        public double? Length { get; set; }

        public double? Volume { get; set; }
    }

    public class Filament
    {
        public Tool Tool0 { get; set; }
    }

    public class Job
    {
        public JobFile File { get; set; }

        public double? EstimatedPrintTime { get; set; }

        public Filament Filament { get; set; }
    }

    public class Progress
    {
        public double? Completion { get; set; }

        public int? Filepos { get; set; }

        public double? PrintTime { get; set; }

        public double? PrintTimeLeft { get; set; }
    }
}
