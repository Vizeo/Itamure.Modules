using Itamure.Core;
using MediaServer.Api;
using MediaServer.Entities;

namespace MediaServer.Events
{
    public class ReceiverAddedEvent : Event
    {
        public ReceiverAddedEvent()
        {
        }

        public MediaReceiver? Receiver { get; set; }
	}
}
