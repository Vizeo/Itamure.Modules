using Itamure.Core;
using MediaServer.Entities;

namespace MediaServer.Events
{
    public class ReceiverRemovedEvent : Event
    {
        public ReceiverRemovedEvent()
        {
        }

        public string? ReceiverId { get; set; }
    }
}
