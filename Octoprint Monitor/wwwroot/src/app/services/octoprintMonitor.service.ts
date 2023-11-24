//This is generated code
//Add ignore attribute for class properties


export class PrinterInfo
{
	Id?: number; 
	Address?: string; 
	Name?: string; 
	ApiKey?: string; 
}

import { Injectable } from '@angular/core';
declare var hasSession: boolean;

export interface ProgressCallback {
    (progress: number): void;
}

@Injectable({ providedIn: 'root' })
export class OctoprintMonitorService {
    private _reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.{0,1}\d*))(?:Z|(\+|-)([\d|:]*))?$/;
    private _reMsAjax = /^\/Date\((d|-|.*)\)[\/|\\]$/;
    private _reNonTimeZoneDateTime = /^(\d{4})\/(\d{2})\/(\d{2})-(\d{2}):(\d{2}):(\d{2})$/;

    private DateTimeParser(key: string, value: string) {
        if (typeof value === 'string') {
            let a = this._reISO.exec(value);
            if (a) {
                if (parseInt(a[1]) < 1970) {
                    throw new Error("Can not parse year");
                }

                let offset = 0;
                if (a[8] != null) {
                    offset = Number(a[8].split(':')[0]);
                }

                let date = Date.UTC(
                    Number(a[1]),
                    Number(a[2]) - 1,
                    Number(a[3]),
                    Number(a[4]) + offset,
                    Number(a[5]),
                    Number(a[6]));

                return new Date(date);
            }

            a = this._reNonTimeZoneDateTime.exec(value)
            if (a) {
                if (parseInt(a[1]) < 1970) {
                    throw new Error("Can not parse year");
                }

                let date = new Date(
                    Number(a[1]),
                    Number(a[2]) - 1,
                    Number(a[3]),
                    Number(a[4]),
                    Number(a[5]),
                    Number(a[6]));

                return date;
            }

            a = this._reMsAjax.exec(value)
            if (a) {
                var b = a[1].split(/[-+,.]/);
                return new Date(b[0] ? +b[0] : 0 - +b[1]);
            }
        }
        return value;
    }

    protected ApiCall<T>(method: string, url: string, sendData: any, progressCallback?: ProgressCallback | null): Promise<T> {
        let result = new Promise<T>((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.setRequestHeader("Content-Type", "application/json");

            if (progressCallback != null) {
                xhr.upload.addEventListener("progress", (progressEvent: ProgressEvent) => {
                    if (progressEvent.lengthComputable) {
                        progressCallback(Math.round((progressEvent.loaded / progressEvent.total) * 100));
                    }
                }, false);

                xhr.upload.addEventListener("load", (loadEvent: ProgressEvent) => {
                    progressCallback(-1);
                }, false);
            }

            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        if (xhr.getResponseHeader("Content-Type")?.indexOf("application/json") != -1) {
                            resolve(JSON.parse(xhr.responseText, (k, v) => this.DateTimeParser(k, v)));
                        }
                        else {
                            alert("Error when processing api call to " + url + " unhandled content " + xhr.getResponseHeader("Content-Type"));
                        }
                    }
                    else if (xhr.status == 205) {
                        if (hasSession != null &&
                            hasSession == true) {
                            alert("Your session has expired.")
                            location.reload();
                        }
                    }
                    else if (xhr.status == 0) {
                        //alert("Could not connect to server");
                    }
                    else {
                        alert("Error when processing api call to " + url);
                        reject(xhr.statusText);
                    }
                }
            }
            if (sendData != null && method != 'GET') {
                var serializedPostData = JSON.stringify(sendData);
                xhr.send(serializedPostData);
            }
            else {
                xhr.send();
            }
        });
        
        return result;
    }

	GetCurrentInstances(): Promise<PrinterInfo[]> {
		var jsonObject = <any>new Object();
		return this.ApiCall<any>('POST', '/OctoprintMonitor/Api/OctoprintMonitorService/GetCurrentInstances', jsonObject);
	}

	Remove(printerInfo: PrinterInfo): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.printerInfo = printerInfo
		return this.ApiCall<any>('POST', '/OctoprintMonitor/Api/OctoprintMonitorService/Remove', jsonObject);
	}

	Update(printerInfo: PrinterInfo): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.printerInfo = printerInfo
		return this.ApiCall<any>('POST', '/OctoprintMonitor/Api/OctoprintMonitorService/Update', jsonObject);
	}

	Add(printerInfo: PrinterInfo): Promise<number> {
		var jsonObject = <any>new Object();
		jsonObject.printerInfo = printerInfo
		return this.ApiCall<any>('POST', '/OctoprintMonitor/Api/OctoprintMonitorService/Add', jsonObject);
	}

}
    

