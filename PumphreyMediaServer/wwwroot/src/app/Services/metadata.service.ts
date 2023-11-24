//This is generated code
//Add ignore attribute for class properties


export class SearchItem
{
	Title?: string | null; 
	Year?: string | null; 
	ImdbID?: string | null; 
	Type?: string | null; 
	Poster?: string | null; 
}
export class SearchResult
{
	Search?: SearchItem[]; 
	TotalResults?: string | null; 
	Response?: string | null; 
}
export abstract class ItemResult
{
	Poster?: string | null; 
	ImdbID?: string | null; 
}
export class RatingsItem
{
	Source?: string | null; 
	Value?: string | null; 
}
export class MovieResult extends ItemResult 
{
	Title?: string | null; 
	Year?: string | null; 
	Rated?: string | null; 
	Released?: string | null; 
	Runtime?: string | null; 
	Genre?: string | null; 
	Director?: string | null; 
	Writer?: string | null; 
	Actors?: string | null; 
	Plot?: string | null; 
	Language?: string | null; 
	Country?: string | null; 
	Awards?: string | null; 
	Metascore?: string | null; 
	ImdbRating?: string | null; 
	ImdbVotes?: string | null; 
	Type?: string | null; 
	DVD?: string | null; 
	BoxOffice?: string | null; 
	Production?: string | null; 
	Website?: string | null; 
	Response?: string | null; 
	Ratings?: RatingsItem[]; 
}
export class SeriesResult extends ItemResult 
{
	Title?: string | null; 
	Year?: string | null; 
	Rated?: string | null; 
	Released?: string | null; 
	Runtime?: string | null; 
	Genre?: string | null; 
	Director?: string | null; 
	Writer?: string | null; 
	Actors?: string | null; 
	Plot?: string | null; 
	Language?: string | null; 
	Country?: string | null; 
	Awards?: string | null; 
	Metascore?: string | null; 
	ImdbRating?: string | null; 
	ImdbVotes?: string | null; 
	Type?: string | null; 
	TotalSeasons?: string | null; 
	Response?: string | null; 
	Ratings?: RatingsItem[]; 
}
export class EpisodeResult extends ItemResult 
{
	Title?: string | null; 
	Year?: string | null; 
	Rated?: string | null; 
	Released?: string | null; 
	Season?: string | null; 
	Episode?: string | null; 
	Runtime?: string | null; 
	Genre?: string | null; 
	Director?: string | null; 
	Writer?: string | null; 
	Actors?: string | null; 
	Plot?: string | null; 
	Language?: string | null; 
	Country?: string | null; 
	Awards?: string | null; 
	Metascore?: string | null; 
	ImdbRating?: string | null; 
	ImdbVotes?: string | null; 
	SeriesID?: string | null; 
	Type?: string | null; 
	Response?: string | null; 
	Ratings?: RatingsItem[]; 
}

import { Injectable } from '@angular/core';
declare var hasSession: boolean;

export interface ProgressCallback {
    (progress: number): void;
}

@Injectable({ providedIn: 'root' })
export class MetadataService {
    private _reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.{0,1}\d*))(?:Z|(\+|-)([\d|:]*))?$/;
    private _reMsAjax = /^\/Date\((d|-|.*)\)[\/|\\]$/;
    private _reNonTimeZoneDateTime = /^(\d{4})\/(\d{2})\/(\d{2})-(\d{2}):(\d{2}):(\d{2})$/;

    constructor() {
        this.DateJson();
    }

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

    private DateJson() {
        Date.prototype.toJSON = function () {
            var timezoneOffsetInHours = -(this.getTimezoneOffset() / 60); //UTC minus local time
            var sign = timezoneOffsetInHours >= 0 ? '+' : '-';
            var leadingZero = timezoneOffsetInHours.toString().length == 1 ? '0' : '';

            //Adjust the date with the timezone offset
            var correctedDate = new Date(this.getTime());
            correctedDate.setHours(this.getHours() + timezoneOffsetInHours);

            //Handle dates when the time zone changes
            var timeZoneVariation = (this.getTimezoneOffset() / 60) - (correctedDate.getTimezoneOffset() / 60);
            var finalDate = new Date(correctedDate.getTime() + (timeZoneVariation * 60 * 60 * 1000));

            var iso = finalDate.toISOString().replace('Z', '');

            return iso + sign + leadingZero + Math.abs(timezoneOffsetInHours).toString() + ':00';
        }
    }

	ApiKeySet(): Promise<boolean> {
		var jsonObject = <any>new Object();
		return this.ApiCall<any>('POST', '/mediaServer/api/metadataService/ApiKeySet', jsonObject);
	}

	MovieSearch(name: string | null): Promise<SearchResult> {
		var jsonObject = <any>new Object();
		jsonObject.name = name
		return this.ApiCall<any>('POST', '/mediaServer/api/metadataService/MovieSearch', jsonObject);
	}

	GetMovieMetadata(imdbId: string | null): Promise<MovieResult> {
		var jsonObject = <any>new Object();
		jsonObject.imdbId = imdbId
		return this.ApiCall<any>('POST', '/mediaServer/api/metadataService/GetMovieMetadata', jsonObject);
	}

	SeriesSearch(name: string | null): Promise<SearchResult> {
		var jsonObject = <any>new Object();
		jsonObject.name = name
		return this.ApiCall<any>('POST', '/mediaServer/api/metadataService/SeriesSearch', jsonObject);
	}

	GetSeriesMetadata(imdbId: string | null): Promise<SeriesResult> {
		var jsonObject = <any>new Object();
		jsonObject.imdbId = imdbId
		return this.ApiCall<any>('POST', '/mediaServer/api/metadataService/GetSeriesMetadata', jsonObject);
	}

	EpisodeSearch(series: string | null, season: number, episode: number): Promise<EpisodeResult> {
		var jsonObject = <any>new Object();
		jsonObject.series = series
		jsonObject.season = season
		jsonObject.episode = episode
		return this.ApiCall<any>('POST', '/mediaServer/api/metadataService/EpisodeSearch', jsonObject);
	}

	GetEpisodeMetadata(imdbId: string | null): Promise<EpisodeResult> {
		var jsonObject = <any>new Object();
		jsonObject.imdbId = imdbId
		return this.ApiCall<any>('POST', '/mediaServer/api/metadataService/GetEpisodeMetadata', jsonObject);
	}

}
    

