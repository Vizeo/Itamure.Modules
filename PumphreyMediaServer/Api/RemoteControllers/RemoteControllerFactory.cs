namespace MediaServer.Api.RemoteControllers
{
	internal static class RemoteControllerFactory
	{
		public static IRemoteController GetRemoteController(string controlerType)
		{
			switch(controlerType) 
			{
				case "Upnp":
					return new UpnpController();
				case "Web":
					return new WebScreenController();
			}

			throw new Exception("Undefined Controller");
		}
	}
}
