using Itamure.Core;

namespace MediaServer.Events
{
    public class ClickChangedEvent : Event
    {
        public ClickChangedEvent(int count)
        {
            Count = count;
        }

        public int Count { get; }
    }
}
