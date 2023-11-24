using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OctoprintApi
{
    public class PrinterState
    {
        public Temperature Temperature { get; set; }

        public Sd Sd { get; set; }

        public State State { get; set; }
    }

    public class TemperatureValue
    {
        public double Actual { get; set; }

        public double Target { get; set; }

        public int Offset { get; set; }
    }

    public class History
    {
        public int Time { get; set; }

        public TemperatureValue Tool0 { get; set; }

        public TemperatureValue Bed { get; set; }
    }

    public class Temperature
    {
        public TemperatureValue Tool0 { get; set; }

        public TemperatureValue Bed { get; set; }

        public List<History> History { get; set; }
    }

    public class Sd
    {
        public bool Ready { get; set; }
    }

    public class Flags
    {
        public bool Operational { get; set; }

        public bool Paused { get; set; }

        public bool Printing { get; set; }

        public bool Cancelling { get; set; }

        public bool Pausing { get; set; }

        public bool SdReady { get; set; }

        public bool Error { get; set; }

        public bool Ready { get; set; }

        public bool ClosedOrError { get; set; }
    }

    public class State
    {
        public string Text { get; set; }

        public Flags Flags { get; set; }
    }
}
