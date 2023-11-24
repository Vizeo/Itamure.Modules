using Itamure.Core;

namespace MediaServer.Events
{
    public class IterationChangedEvent : Event
    {
        public IterationChangedEvent(int count)
        {
            Count = count;
        }

        public int Count { get; }
    }
}
