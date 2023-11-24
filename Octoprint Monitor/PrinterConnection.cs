using OctoprintApi;
using OctoprintMonitor.Entities;
using OctoprintMonitor.Events;
using System.Diagnostics;
using System.Net;

namespace OctoprintMonitor
{
    internal class PrinterConnection
    {
        private Service? _service;
        private bool _gettingStatus = false;
        private JobFile? _jobFile;
        private string? _initError;

        public PrinterConnection(PrinterInfo printerInfo)
        {
            PrinterInfo = printerInfo;

            if (printerInfo == null)
            {
                _initError = "printerInfo cannot be null";
                throw new ArgumentNullException("printerInfo cannot be null");
            }

            if (printerInfo.Address == null)
            {
                _initError = "printerInfo.Address cannot be null";
                throw new ArgumentNullException("printerInfo.Address cannot be null");
            }
            else
            {
                try
                {
                    _service = new Service(PrinterInfo.Address, PrinterInfo.ApiKey);
                }
                catch (Exception e)
                {
                    _initError = $"Error: Attempting to connect to: {PrinterInfo.Address}. {e.Message}";
                }
            }
        }

        public PrinterInfo PrinterInfo { get; set; }

        private string CleanAddress(string? address)
        {
            if (address == null)
            {
                throw new ArgumentNullException("address cannot be null");
            }

            var result = address.Replace("http://", string.Empty);
            if (result.EndsWith("/"))
            {
                result = result.Substring(0, result.Length - 1);
            }
            return result;
        }

        public async Task<Stream?> GetGCodeFile()
        {
            if(_jobFile != null)
            {
                return await _service!.DownloadCurrentFile(_jobFile);
            }
            return null;
        }

        public async Task<PrinterStatus> GetPrinterState()
        {
            try
            {
                var result = new PrinterStatus()
                {
                    PrinterId = PrinterInfo.Id,
                    Name = PrinterInfo.Name,
                };
                result.Url = PrinterInfo.Address;

                if (!_gettingStatus)
                {
                    if (_service != null)
                    {
                        if (!string.IsNullOrWhiteSpace(PrinterInfo.ApiKey) &&
                            PrinterInfo.ApiKey.Length > 10)
                        {
                            try
                            {
                                _gettingStatus = true;
                                var connection = await _service.Connection();
                                result.State = connection.Current.State;

                                if (connection.Current.State != "Closed")
                                {
                                    var printer = await _service.Printer();

                                    if (printer.State.Flags.Error)
                                    {
                                        result.State = "Error";
                                    }
                                    else if (printer.State.Flags.Ready)
                                    {
                                        result.State = "Ready";
                                    }
                                    else if (printer.State.Flags.Pausing)
                                    {
                                        result.State = "Pausing";
                                    }
                                    else if (printer.State.Flags.Cancelling)
                                    {
                                        result.State = "Cancelling";
                                    }
                                    else if (printer.State.Flags.Printing)
                                    {
                                        result.State = "Printing";
                                    }
                                    else if (printer.State.Flags.Paused)
                                    {
                                        result.State = "Paused";
                                    }

                                    if (printer.Temperature.Tool0 != null)
                                    {
                                        result.ToolActual = printer.Temperature.Tool0.Actual;
                                        result.ToolTarget = printer.Temperature.Tool0.Target;
                                    }

                                    if (printer.Temperature.Bed != null)
                                    {
                                        result.BedActual = printer.Temperature.Bed.Actual;
                                        result.BedTarget = printer.Temperature.Bed.Target;
                                    }

                                    var jobInformationResponse = await _service.Job();
                                    result.JobState = jobInformationResponse.State;
                                    result.JobProgress = jobInformationResponse.Progress.Completion;
                                    result.PrintTime = jobInformationResponse.Progress.PrintTime;
                                    result.PrintTimeLeft = jobInformationResponse.Progress.PrintTimeLeft;
                                    result.EstimatedPrintTime = jobInformationResponse.Job.EstimatedPrintTime;
                                    result.FileName = jobInformationResponse.Job.File.Name;

                                    if (!string.IsNullOrWhiteSpace(result.FileName))
                                    {
                                        var value = await _service.DownloadCurrentFile(jobInformationResponse.Job.File);
                                    }

                                    _jobFile = jobInformationResponse.Job.File;
                                }
                                else
                                {
                                    _jobFile = null;
                                }
                                return result;
                            }
                            finally
                            {
                                _gettingStatus = false;
                            }
                        }
                        else
                        {
                            _jobFile = null;
                            result.State = $"Missing or Invalid API Key";
                        }
                    }
                    else
                    {
                        _jobFile = null;
                        result.State = _initError;
                    }
                }
                else
                {
                    _jobFile = null;
                    result.State = "Connecting";
                }
                return result;
            }
            catch
            {
                return new PrinterStatus()
                {
                    PrinterId = PrinterInfo.Id,
                    State = "Offline",
                    Name = PrinterInfo.Name,
                };
            }
        }
    }
}
