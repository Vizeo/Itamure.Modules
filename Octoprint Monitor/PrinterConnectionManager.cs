using OctoprintMonitor.Entities;
using RizeDb;
using System.IO;

namespace OctoprintMonitor
{
    internal class PrinterConnectionManager : IDisposable
    {
        private object _lock = new object();
        private List<PrinterConnection> _printerConnections;
        private List<PrinterStatusWidget> _printerStatusWidgets;
        private bool _running = true;
        private int _updateFrequencySeconds;

        public PrinterConnectionManager(ObjectStore objectStore, int updateFrequencySeconds)
        {
            _updateFrequencySeconds = updateFrequencySeconds;
            _printerConnections = new List<PrinterConnection>();
            var printerInfos = objectStore.Retrieve<PrinterInfo>();
            foreach (PrinterInfo printerInfo in printerInfos)
            {
                _printerConnections.Add(new PrinterConnection(printerInfo));
            }

            _printerStatusWidgets = new List<PrinterStatusWidget>();    

            var thread = new System.Threading.Thread(() => UpdateLoop());
            thread.IsBackground = true;
            thread.Start();
        }

        public PrinterConnection? GetConnection(long printerId)
        {
            lock(_lock)
            {                
                return _printerConnections.FirstOrDefault(c => c.PrinterInfo!.Id == printerId);
            }
        }

        private void UpdateLoop()
        {
            while (_running)
            {
                List<PrinterConnection> printerConnections;
                lock (_lock)
                {
                    //Make a copy to avoid any race conditions
                    printerConnections = _printerConnections.ToList();
                }

                foreach (var printerConnection in printerConnections)
                {
                    Task.Run(async () =>
                    {
                        var printerState = await printerConnection.GetPrinterState();
                        lock (_printerStatusWidgets)
                        {
                            var printerStatusWidget = _printerStatusWidgets.FirstOrDefault(p => p.Instance == printerConnection.PrinterInfo.Id);
                            if (printerState != null)
                            {
                                Module.CurrentModule!.SendEvent(printerState);
                                if (printerStatusWidget == null)
                                {
                                    if (printerState.State != "Closed")
                                    {
                                        printerStatusWidget = new PrinterStatusWidget(printerConnection.PrinterInfo.Id);
                                        _printerStatusWidgets.Add(printerStatusWidget);
                                        Module.CurrentModule.AddWidget(printerStatusWidget);
                                    }
                                }
                                else if (printerState.State == "Closed")
                                {
                                    _printerStatusWidgets.Remove(printerStatusWidget);
                                    Module.CurrentModule.RemoveWidget(printerStatusWidget);
                                }
                            }
                            else if(printerStatusWidget != null)
                            {
                                _printerStatusWidgets.Remove(printerStatusWidget);
                                Module.CurrentModule!.RemoveWidget(printerStatusWidget);
                            }
                        }
                    });
                }

                //Update every 10 seconds
                //TODO: Pull update time from Settings
                System.Threading.Thread.Sleep(Convert.ToInt32(TimeSpan.FromSeconds(10).TotalMilliseconds));
            }
        }

        internal void PrinterAdded(PrinterInfo printerInfo)
        {
            lock (_lock)
            {
                var existing = _printerConnections.FirstOrDefault(p => p.PrinterInfo.Id == printerInfo.Id);
                if (existing == null)
                {
                    _printerConnections.Add(new PrinterConnection(printerInfo));
                }
            }
        }

        internal void PrinterRemoved(PrinterInfo printerInfo)
        {
            lock (_lock)
            {
                var existing = _printerConnections.FirstOrDefault(p => p.PrinterInfo.Id == printerInfo.Id);
                if (existing != null)
                {
                    _printerConnections.Remove(existing);
                }
            }

            //Remove associated widget
        }

        internal void PrinterUpdated(PrinterInfo printerInfo)
        {
            lock (_lock)
            {
                var existing = _printerConnections.FirstOrDefault(p => p.PrinterInfo.Id == printerInfo.Id);
                if (existing != null)
                {
                    _printerConnections.Remove(existing);
                }

                _printerConnections.Add(new PrinterConnection(printerInfo));
            }
        }

        public void Dispose()
        {
            _running = false;
        }
    }
}
