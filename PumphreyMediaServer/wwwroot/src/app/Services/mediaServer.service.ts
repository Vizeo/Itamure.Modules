//This is generated code
//Add ignore attribute for class properties


export enum MediaSourceType {
	Directory = 1,
}
export abstract class MediaSource
{
	Id?: number; 
	Name?: string | null; 
	MediaSourceType?: MediaSourceType; 
	CreatedDate?: Date; 
}
export class OmdbApiData
{
	Key?: string | null; 
}
export enum MediaSubType {
	Music = 1,
	Pictures = 2,
	Movies = 3,
	Series = 4,
}
export class Rating
{
	Id?: number; 
	MediaSubType?: MediaSubType; 
	Name?: string | null; 
}
export class Tag
{
	Id?: number; 
	MediaSubType?: MediaSubType; 
	Name?: string | null; 
}
export enum MediaType {
	Unknown = 0,
	Audio = 1,
	Image = 2,
	Video = 3,
}
export class MediaFileType
{
	Id?: number; 
	MediaType?: MediaType; 
	FileExtension?: string | null; 
	ContentType?: string | null; 
}
export enum MediaItemType {
	UnknownAudioFile = 0,
	UnknownImageFile = 1,
	UnknownVideoFile = 2,
	MovieFile = 3,
	SeriesFile = 4,
	MusicFile = 5,
	PictureFile = 6,
}
export class MetadataValue
{
	Key?: string | null; 
	Value?: string | null; 
}
export enum MetadataTagType {
	Actor = 1,
	Director = 2,
	Genre = 3,
	Writer = 4,
}
export class MetadataTag
{
	MetadataTagType?: MetadataTagType; 
	Value?: string | null; 
}
export abstract class MediaItem
{
	Id?: number; 
	Name?: string | null; 
	AddedDate?: Date; 
	MediaType?: MediaType; 
	MediaItemType?: MediaItemType; 
	MetadataDate?: Date; 
	MetadataValues?: MetadataValue[]; 
	Error?: string | null; 
	FolderId?: number; 
	TagIds?: number[]; 
	MetadataTags?: MetadataTag[]; 
}
export class FileMediaItem extends MediaItem 
{
	FilePath?: string | null; 
	RatingId?: number; 
	ImdbID?: string | null; 
}
//Cannot Render System.UInt32
export class VideoFileMediaItem extends FileMediaItem 
{
	SeriesId?: number; 
	SeasonId?: number; 
	Width?: number; 
	Height?: number; 
	Year?: number; 
	Duration?: number; 
	Order?: number; 
	Description?: string | null; 
}
export class Folder
{
	Id?: number; 
	ParentId?: number; 
	Name?: string | null; 
}
export class Season
{
	Id?: number; 
	Name?: string | null; 
	Order?: number; 
}
export class Series
{
	Id?: number; 
	ImdbID?: string | null; 
	Name?: string | null; 
	Description?: string | null; 
	RatingId?: number; 
	Seasons?: Season[]; 
}
export class AddSeriesResponse
{
	Success?: boolean; 
	Message?: string | null; 
	Series?: Series; 
}
export enum MovieGroupingType {
	Newest = 1,
}

import { Injectable } from '@angular/core';
declare var hasSession: boolean;

export interface ProgressCallback {
    (progress: number): void;
}

@Injectable({ providedIn: 'root' })
export class MediaService {
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

	GetSources(): Promise<MediaSource[]> {
		var jsonObject = <any>new Object();
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetSources', jsonObject);
	}

	GetOmdbApiKey(): Promise<OmdbApiData> {
		var jsonObject = <any>new Object();
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetOmdbApiKey', jsonObject);
	}

	SetOmdbApiKey(omdbApiData: OmdbApiData): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.omdbApiData = omdbApiData
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/SetOmdbApiKey', jsonObject);
	}

	AddMediaSource(mediaSource: MediaSource): Promise<MediaSource> {
		var jsonObject = <any>new Object();
		jsonObject.mediaSource = mediaSource
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/AddMediaSource', jsonObject);
	}

	ValidateDirectory(path: string | null): Promise<boolean> {
		var jsonObject = <any>new Object();
		jsonObject.path = path
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/ValidateDirectory', jsonObject);
	}

	RemoveSource(mediaSource: MediaSource): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.mediaSource = mediaSource
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/RemoveSource', jsonObject);
	}

	GetRatings(mediaSubType: MediaSubType): Promise<Rating[]> {
		var jsonObject = <any>new Object();
		jsonObject.mediaSubType = mediaSubType
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetRatings', jsonObject);
	}

	AddRating(name: string | null, mediaSubType: MediaSubType): Promise<Rating> {
		var jsonObject = <any>new Object();
		jsonObject.name = name
		jsonObject.mediaSubType = mediaSubType
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/AddRating', jsonObject);
	}

	UpdateRating(rating: Rating): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.rating = rating
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/UpdateRating', jsonObject);
	}

	DeleteRating(ratingId: number): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.ratingId = ratingId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/DeleteRating', jsonObject);
	}

	GetTags(mediaSubType: MediaSubType): Promise<Tag[]> {
		var jsonObject = <any>new Object();
		jsonObject.mediaSubType = mediaSubType
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetTags', jsonObject);
	}

	AddTag(name: string | null, mediaSubType: MediaSubType): Promise<Tag> {
		var jsonObject = <any>new Object();
		jsonObject.name = name
		jsonObject.mediaSubType = mediaSubType
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/AddTag', jsonObject);
	}

	UpdateTag(tag: Tag): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.tag = tag
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/UpdateTag', jsonObject);
	}

	DeleteTag(tagId: number): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.tagId = tagId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/DeleteTag', jsonObject);
	}

	GetMediaFileTypes(): Promise<MediaFileType[]> {
		var jsonObject = <any>new Object();
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetMediaFileTypes', jsonObject);
	}

	AddMediaFileType(mediaFileType: MediaFileType): Promise<MediaFileType> {
		var jsonObject = <any>new Object();
		jsonObject.mediaFileType = mediaFileType
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/AddMediaFileType', jsonObject);
	}

	UpdateMediaFielType(mediaFileType: MediaFileType): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.mediaFileType = mediaFileType
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/UpdateMediaFielType', jsonObject);
	}

	RemoveMediaFileType(mediaFileTypeId: number): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.mediaFileTypeId = mediaFileTypeId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/RemoveMediaFileType', jsonObject);
	}

	GetVideoMediaItems(mediaItemType: MediaItemType, folderId: number): Promise<VideoFileMediaItem[]> {
		var jsonObject = <any>new Object();
		jsonObject.mediaItemType = mediaItemType
		jsonObject.folderId = folderId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetVideoMediaItems', jsonObject);
	}

	GetVideoMediaItem(videoMediaItemId: number): Promise<VideoFileMediaItem> {
		var jsonObject = <any>new Object();
		jsonObject.videoMediaItemId = videoMediaItemId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetVideoMediaItem', jsonObject);
	}

	AddFolder(folder: Folder): Promise<number> {
		var jsonObject = <any>new Object();
		jsonObject.folder = folder
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/AddFolder', jsonObject);
	}

	UpdateFolder(folder: Folder): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.folder = folder
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/UpdateFolder', jsonObject);
	}

	GetFolders(parentId: number): Promise<Folder[]> {
		var jsonObject = <any>new Object();
		jsonObject.parentId = parentId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetFolders', jsonObject);
	}

	DeleteFolder(folderId: number): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.folderId = folderId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/DeleteFolder', jsonObject);
	}

	GetUnassignedVideoMediaItems(): Promise<VideoFileMediaItem[]> {
		var jsonObject = <any>new Object();
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetUnassignedVideoMediaItems', jsonObject);
	}

	AssignVideoToMovies(videoFileMediaItemIds: number[], folderId: number): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.videoFileMediaItemIds = videoFileMediaItemIds
		jsonObject.folderId = folderId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/AssignVideoToMovies', jsonObject);
	}

	GetSeriesList(): Promise<Series[]> {
		var jsonObject = <any>new Object();
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetSeriesList', jsonObject);
	}

	GetSeries(id: number): Promise<Series> {
		var jsonObject = <any>new Object();
		jsonObject.id = id
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetSeries', jsonObject);
	}

	AddSeries(series: Series): Promise<AddSeriesResponse> {
		var jsonObject = <any>new Object();
		jsonObject.series = series
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/AddSeries', jsonObject);
	}

	SaveSeries(series: Series): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.series = series
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/SaveSeries', jsonObject);
	}

	AssignVideoToSeason(seriesId: number, seasonId: number, videoFileMediaItemIds: number[]): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.seriesId = seriesId
		jsonObject.seasonId = seasonId
		jsonObject.videoFileMediaItemIds = videoFileMediaItemIds
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/AssignVideoToSeason', jsonObject);
	}

	GetSeasonMediaItems(seriesId: number, seasonId: number): Promise<VideoFileMediaItem[]> {
		var jsonObject = <any>new Object();
		jsonObject.seriesId = seriesId
		jsonObject.seasonId = seasonId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetSeasonMediaItems', jsonObject);
	}

	SetSeasonMediaItemSort(videoFileMediaItemIds: number[]): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.videoFileMediaItemIds = videoFileMediaItemIds
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/SetSeasonMediaItemSort', jsonObject);
	}

	DeleteSeason(seriesId: number, seasonId: number): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.seriesId = seriesId
		jsonObject.seasonId = seasonId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/DeleteSeason', jsonObject);
	}

	DeleteSeries(seriesId: number): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.seriesId = seriesId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/DeleteSeries', jsonObject);
	}

	UnassignVideoFileMediaItems(videoFileMediaItemIds: number[]): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.videoFileMediaItemIds = videoFileMediaItemIds
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/UnassignVideoFileMediaItems', jsonObject);
	}

	SetVideoFileMediaItemImage(mediaItemId: number, mimeType: string | null, data: ArrayBuffer): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.mediaItemId = mediaItemId
		jsonObject.mimeType = mimeType
		jsonObject.data = data
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/SetVideoFileMediaItemImage', jsonObject);
	}

	GetVideoFileMediaItemImage(mediaItemId: number): Promise<any> {
		var jsonObject = <any>new Object();
		jsonObject.mediaItemId = mediaItemId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetVideoFileMediaItemImage', jsonObject);
	}

	SetVideoFileMediaMetadata(videoFileMediaItem: VideoFileMediaItem): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.videoFileMediaItem = videoFileMediaItem
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/SetVideoFileMediaMetadata', jsonObject);
	}

	SetSeriesImage(seriesId: number, mimeType: string | null, data: ArrayBuffer): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.seriesId = seriesId
		jsonObject.mimeType = mimeType
		jsonObject.data = data
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/SetSeriesImage', jsonObject);
	}

	GetSeriesImage(seriesId: number): Promise<any> {
		var jsonObject = <any>new Object();
		jsonObject.seriesId = seriesId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetSeriesImage', jsonObject);
	}

	GetMovieGrouping(movieGroupingType: MovieGroupingType, count: number): Promise<VideoFileMediaItem[]> {
		var jsonObject = <any>new Object();
		jsonObject.movieGroupingType = movieGroupingType
		jsonObject.count = count
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetMovieGrouping', jsonObject);
	}

}
    

export class DirectoryMediaSource extends MediaSource 
{
	Path?: string | null; 
	IncludeSubdirectories?: boolean; 
}
//Cannot Render MediaServer.Api.AddResponse
//Cannot Render MediaServer.Entities.SpecialPerentFolder
