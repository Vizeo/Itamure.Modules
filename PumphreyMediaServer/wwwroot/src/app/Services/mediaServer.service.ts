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
export class UserAccess
{
	UserId?: string; 
	UserName?: string | null; 
	Allowed?: boolean; 
}
export class StringValue
{
	Value?: string | null; 
}
export class Access
{
	SettingsPermissions?: boolean; 
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
export enum MovieGroupingType {
	Newest = 1,
	Genres = 2,
	Folder = 3,
	Range = 4,
	Rating = 5,
	ContinueWatching = 6,
}
export class VideoGroup
{
	Id?: number; 
	Name?: string | null; 
	MovieGroupingType?: MovieGroupingType; 
	Count?: number; 
	Options?: string | null; 
	Order?: number; 
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
	Error?: string | null; 
	FolderId?: number; 
	TagIds?: number[]; 
	MetadataTags?: MetadataTag[]; 
	UnavailableDate?: Date; 
	Restricted?: boolean; 
	UserAccess?: string[]; 
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
export class UserMediaItem
{
	UniqueKey?: string; 
	SeriesId?: number; 
	SeasonId?: number; 
	Width?: number; 
	Height?: number; 
	Year?: number; 
	Duration?: number; 
	Order?: number; 
	Description?: string | null; 
	LastViewed?: Date; 
	Position?: number; 
	RatingId?: number; 
	Name?: string | null; 
	MediaType?: MediaType; 
	MediaItemType?: MediaItemType; 
	MetadataDate?: Date; 
	MimeType?: string | null; 
	MetadataTags?: MetadataTag[]; 
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
export class FolderTree extends Folder 
{
	SubFolders?: FolderTree[]; 
}
export class UserMediaItemSearchResult extends UserMediaItem 
{
	Weight?: number; 
	SeriesName?: string | null; 
	Season?: string | null; 
	Episode?: number; 
}
export class MediaReceiver
{
	Id?: string | null; 
	Name?: string | null; 
	ReceiverType?: string | null; 
}
export class MediaCastResult
{
	Success?: boolean; 
	Message?: string | null; 
}

import { Injectable } from '@angular/core';
declare var hasSession: boolean;

export interface ProgressCallback {
    (progress: number): void;
}

export class ApiCallOptions
{
    public Silent: boolean = false;
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

    protected ApiCall<T>(method: string, url: string, sendData: any, apiCallOptions: ApiCallOptions): Promise<T> {
        let result = new Promise<T>((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            
            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        if (xhr.getResponseHeader("Content-Type")?.indexOf("application/json") != -1) {
                            resolve(JSON.parse(xhr.responseText, (k, v) => this.DateTimeParser(k, v)));
                        }
                        else {
                            let errorMessage = "Error when processing api call to " + url + " unhandled content " + xhr.getResponseHeader("Content-Type");
                            if(!apiCallOptions.Silent)
                            {
                                alert(errorMessage);
                            }
                            throw errorMessage;
                        }
                    }
                    else if (xhr.status == 205) {
                        if (hasSession != null &&
                            hasSession == true) {
                            if(!apiCallOptions.Silent)
                            {
                                alert("Your session has expired.")
                            }                            
                            location.reload();
                        }
                    }
                    else if (xhr.status == 0) {
                        //alert("Could not connect to server");
                    }
                    else {
                        let errorMessage = "Error when processing api call to " + url;
                        if(!apiCallOptions.Silent)
                        {
                            alert(errorMessage);
                        }
                        throw errorMessage;
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
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetSources',jsonObject, { Silent: false } );
	}

	GetOmdbApiKey(): Promise<OmdbApiData> {
		var jsonObject = <any>new Object();
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetOmdbApiKey',jsonObject, { Silent: false } );
	}

	SetOmdbApiKey(omdbApiData: OmdbApiData): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.omdbApiData = omdbApiData
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/SetOmdbApiKey',jsonObject, { Silent: false } );
	}

	UpdateMediaItemAccess(mediaItemId: number, restrict: boolean, accessUserIds: string[]): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.mediaItemId = mediaItemId
		jsonObject.restrict = restrict
		jsonObject.accessUserIds = accessUserIds
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/UpdateMediaItemAccess',jsonObject, { Silent: false } );
	}

	GetMediaItemAccess(mediaItemId: number): Promise<UserAccess[]> {
		var jsonObject = <any>new Object();
		jsonObject.mediaItemId = mediaItemId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetMediaItemAccess',jsonObject, { Silent: false } );
	}

	AddMediaSource(mediaSource: MediaSource): Promise<MediaSource> {
		var jsonObject = <any>new Object();
		jsonObject.mediaSource = mediaSource
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/AddMediaSource',jsonObject, { Silent: false } );
	}

	GetGenres(): Promise<StringValue[]> {
		var jsonObject = <any>new Object();
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetGenres',jsonObject, { Silent: false } );
	}

	GetAccess(): Promise<Access> {
		var jsonObject = <any>new Object();
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetAccess',jsonObject, { Silent: false } );
	}

	ValidateDirectory(path: string | null): Promise<boolean> {
		var jsonObject = <any>new Object();
		jsonObject.path = path
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/ValidateDirectory',jsonObject, { Silent: false } );
	}

	RemoveSource(mediaSource: MediaSource): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.mediaSource = mediaSource
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/RemoveSource',jsonObject, { Silent: false } );
	}

	RemoveMediaFileItem(mediaItemId: number): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.mediaItemId = mediaItemId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/RemoveMediaFileItem',jsonObject, { Silent: false } );
	}

	GetRatings(mediaSubType: MediaSubType): Promise<Rating[]> {
		var jsonObject = <any>new Object();
		jsonObject.mediaSubType = mediaSubType
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetRatings',jsonObject, { Silent: false } );
	}

	AddRating(name: string | null, mediaSubType: MediaSubType): Promise<Rating> {
		var jsonObject = <any>new Object();
		jsonObject.name = name
		jsonObject.mediaSubType = mediaSubType
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/AddRating',jsonObject, { Silent: false } );
	}

	UpdateRating(rating: Rating): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.rating = rating
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/UpdateRating',jsonObject, { Silent: false } );
	}

	DeleteRating(ratingId: number): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.ratingId = ratingId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/DeleteRating',jsonObject, { Silent: false } );
	}

	GetTags(mediaSubType: MediaSubType): Promise<Tag[]> {
		var jsonObject = <any>new Object();
		jsonObject.mediaSubType = mediaSubType
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetTags',jsonObject, { Silent: false } );
	}

	AddTag(name: string | null, mediaSubType: MediaSubType): Promise<Tag> {
		var jsonObject = <any>new Object();
		jsonObject.name = name
		jsonObject.mediaSubType = mediaSubType
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/AddTag',jsonObject, { Silent: false } );
	}

	UpdateTag(tag: Tag): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.tag = tag
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/UpdateTag',jsonObject, { Silent: false } );
	}

	DeleteTag(tagId: number): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.tagId = tagId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/DeleteTag',jsonObject, { Silent: false } );
	}

	GetMediaFileTypes(): Promise<MediaFileType[]> {
		var jsonObject = <any>new Object();
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetMediaFileTypes',jsonObject, { Silent: false } );
	}

	AddMediaFileType(mediaFileType: MediaFileType): Promise<MediaFileType> {
		var jsonObject = <any>new Object();
		jsonObject.mediaFileType = mediaFileType
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/AddMediaFileType',jsonObject, { Silent: false } );
	}

	UpdateVideoGroup(videoGroup: VideoGroup): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.videoGroup = videoGroup
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/UpdateVideoGroup',jsonObject, { Silent: false } );
	}

	UpdateMediaFielType(mediaFileType: MediaFileType): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.mediaFileType = mediaFileType
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/UpdateMediaFielType',jsonObject, { Silent: false } );
	}

	RemoveMediaFileType(mediaFileTypeId: number): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.mediaFileTypeId = mediaFileTypeId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/RemoveMediaFileType',jsonObject, { Silent: false } );
	}

	GetVideoMediaItems(mediaItemType: MediaItemType, folderId: number): Promise<VideoFileMediaItem[]> {
		var jsonObject = <any>new Object();
		jsonObject.mediaItemType = mediaItemType
		jsonObject.folderId = folderId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetVideoMediaItems',jsonObject, { Silent: false } );
	}

	GetVideoMediaItem(UniqueKey: string): Promise<UserMediaItem> {
		var jsonObject = <any>new Object();
		jsonObject.UniqueKey = UniqueKey
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetVideoMediaItem',jsonObject, { Silent: false } );
	}

	AddFolder(folder: Folder): Promise<number> {
		var jsonObject = <any>new Object();
		jsonObject.folder = folder
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/AddFolder',jsonObject, { Silent: false } );
	}

	UpdateFolder(folder: Folder): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.folder = folder
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/UpdateFolder',jsonObject, { Silent: false } );
	}

	GetFolders(parentId: number): Promise<Folder[]> {
		var jsonObject = <any>new Object();
		jsonObject.parentId = parentId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetFolders',jsonObject, { Silent: false } );
	}

	DeleteFolder(folderId: number): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.folderId = folderId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/DeleteFolder',jsonObject, { Silent: false } );
	}

	GetUnassignedVideoMediaItems(): Promise<VideoFileMediaItem[]> {
		var jsonObject = <any>new Object();
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetUnassignedVideoMediaItems',jsonObject, { Silent: false } );
	}

	AssignVideoToMovies(videoFileMediaItemIds: number[], folderId: number): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.videoFileMediaItemIds = videoFileMediaItemIds
		jsonObject.folderId = folderId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/AssignVideoToMovies',jsonObject, { Silent: false } );
	}

	GetSeriesList(): Promise<Series[]> {
		var jsonObject = <any>new Object();
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetSeriesList',jsonObject, { Silent: false } );
	}

	GetSeries(id: number): Promise<Series> {
		var jsonObject = <any>new Object();
		jsonObject.id = id
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetSeries',jsonObject, { Silent: false } );
	}

	AddSeries(series: Series): Promise<AddSeriesResponse> {
		var jsonObject = <any>new Object();
		jsonObject.series = series
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/AddSeries',jsonObject, { Silent: false } );
	}

	SaveSeries(series: Series): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.series = series
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/SaveSeries',jsonObject, { Silent: false } );
	}

	AssignVideoToSeason(seriesId: number, seasonId: number, videoFileMediaItemIds: number[]): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.seriesId = seriesId
		jsonObject.seasonId = seasonId
		jsonObject.videoFileMediaItemIds = videoFileMediaItemIds
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/AssignVideoToSeason',jsonObject, { Silent: false } );
	}

	GetSeasonMediaItems(seriesId: number, seasonId: number): Promise<VideoFileMediaItem[]> {
		var jsonObject = <any>new Object();
		jsonObject.seriesId = seriesId
		jsonObject.seasonId = seasonId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetSeasonMediaItems',jsonObject, { Silent: false } );
	}

	SetSeasonMediaItemSort(videoFileMediaItemIds: number[]): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.videoFileMediaItemIds = videoFileMediaItemIds
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/SetSeasonMediaItemSort',jsonObject, { Silent: false } );
	}

	DeleteSeason(seriesId: number, seasonId: number): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.seriesId = seriesId
		jsonObject.seasonId = seasonId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/DeleteSeason',jsonObject, { Silent: false } );
	}

	DeleteSeries(seriesId: number): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.seriesId = seriesId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/DeleteSeries',jsonObject, { Silent: false } );
	}

	UnassignVideoFileMediaItems(videoFileMediaItemIds: number[]): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.videoFileMediaItemIds = videoFileMediaItemIds
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/UnassignVideoFileMediaItems',jsonObject, { Silent: false } );
	}

	SetVideoFileMediaItemImage(mediaItemId: number, mimeType: string | null, data: ArrayBuffer): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.mediaItemId = mediaItemId
		jsonObject.mimeType = mimeType
		jsonObject.data = data
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/SetVideoFileMediaItemImage',jsonObject, { Silent: false } );
	}

	GetVideoFileMediaItemImage(mediaItemId: number): Promise<any> {
		var jsonObject = <any>new Object();
		jsonObject.mediaItemId = mediaItemId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetVideoFileMediaItemImage',jsonObject, { Silent: false } );
	}

	SetVideoFileMediaMetadata(videoFileMediaItem: VideoFileMediaItem): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.videoFileMediaItem = videoFileMediaItem
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/SetVideoFileMediaMetadata',jsonObject, { Silent: false } );
	}

	SetSeriesImage(seriesId: number, mimeType: string | null, data: ArrayBuffer): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.seriesId = seriesId
		jsonObject.mimeType = mimeType
		jsonObject.data = data
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/SetSeriesImage',jsonObject, { Silent: false } );
	}

	GetSeriesImage(seriesId: number): Promise<any> {
		var jsonObject = <any>new Object();
		jsonObject.seriesId = seriesId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetSeriesImage',jsonObject, { Silent: false } );
	}

	GetSeriesMostRecent(seriesId: number): Promise<UserMediaItem> {
		var jsonObject = <any>new Object();
		jsonObject.seriesId = seriesId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetSeriesMostRecent',jsonObject, { Silent: false } );
	}

	GetSeriesNextRecent(uniqueKey: string): Promise<UserMediaItem> {
		var jsonObject = <any>new Object();
		jsonObject.uniqueKey = uniqueKey
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetSeriesNextRecent',jsonObject, { Silent: false } );
	}

	GetVideoGroupMedia(videoGroupId: number, all: boolean): Promise<UserMediaItem[]> {
		var jsonObject = <any>new Object();
		jsonObject.videoGroupId = videoGroupId
		jsonObject.all = all
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetVideoGroupMedia',jsonObject, { Silent: false } );
	}

	GetVideoGroups(): Promise<VideoGroup[]> {
		var jsonObject = <any>new Object();
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetVideoGroups',jsonObject, { Silent: false } );
	}

	UpdateVideoGroups(videoGroups: VideoGroup[]): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.videoGroups = videoGroups
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/UpdateVideoGroups',jsonObject, { Silent: false } );
	}

	GetVideoFolders(): Promise<FolderTree[]> {
		var jsonObject = <any>new Object();
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetVideoFolders',jsonObject, { Silent: false } );
	}

	AddVideoGroup(videoGroup: VideoGroup): Promise<VideoGroup> {
		var jsonObject = <any>new Object();
		jsonObject.videoGroup = videoGroup
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/AddVideoGroup',jsonObject, { Silent: false } );
	}

	DeleteVideoGroup(videoGroup: VideoGroup): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.videoGroup = videoGroup
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/DeleteVideoGroup',jsonObject, { Silent: false } );
	}

	Search(search: string | null, count: number): Promise<UserMediaItemSearchResult[]> {
		var jsonObject = <any>new Object();
		jsonObject.search = search
		jsonObject.count = count
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/Search',jsonObject, { Silent: false } );
	}

	GetUserMediaItemImage(uniqueKey: string): Promise<any> {
		var jsonObject = <any>new Object();
		jsonObject.uniqueKey = uniqueKey
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetUserMediaItemImage',jsonObject, { Silent: false } );
	}

	GetUserMediaItem(uniqueKey: string): Promise<UserMediaItem> {
		var jsonObject = <any>new Object();
		jsonObject.uniqueKey = uniqueKey
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetUserMediaItem',jsonObject, { Silent: false } );
	}

	GetSeasonUserMediaItems(seriesId: number, seasonId: number): Promise<UserMediaItem[]> {
		var jsonObject = <any>new Object();
		jsonObject.seriesId = seriesId
		jsonObject.seasonId = seasonId
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetSeasonUserMediaItems',jsonObject, { Silent: false } );
	}

	GetMediaReceivers(): Promise<MediaReceiver[]> {
		var jsonObject = <any>new Object();
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/GetMediaReceivers',jsonObject, { Silent: false } );
	}

	CastToReceiver(recieverType: string | null, receiverId: string | null, userMediaId: string, position: number): Promise<MediaCastResult> {
		var jsonObject = <any>new Object();
		jsonObject.recieverType = recieverType
		jsonObject.receiverId = receiverId
		jsonObject.userMediaId = userMediaId
		jsonObject.position = position
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/CastToReceiver',jsonObject, { Silent: false } );
	}

	PauseMediaReceiver(receiverId: string | null, recieverType: string | null): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.receiverId = receiverId
		jsonObject.recieverType = recieverType
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/PauseMediaReceiver',jsonObject, { Silent: false } );
	}

	PlayMediaReceiver(receiverId: string | null, recieverType: string | null): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.receiverId = receiverId
		jsonObject.recieverType = recieverType
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/PlayMediaReceiver',jsonObject, { Silent: false } );
	}

	StopMediaReceiver(receiverId: string | null, recieverType: string | null): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.receiverId = receiverId
		jsonObject.recieverType = recieverType
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/StopMediaReceiver',jsonObject, { Silent: false } );
	}

	SeekMediaReceiver(receiverId: string | null, recieverType: string | null, second: number): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.receiverId = receiverId
		jsonObject.recieverType = recieverType
		jsonObject.second = second
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/SeekMediaReceiver',jsonObject, { Silent: false } );
	}

	UpdateMediaPosition(userMediaId: string, positionInSeconds: number): Promise<void> {
		var jsonObject = <any>new Object();
		jsonObject.userMediaId = userMediaId
		jsonObject.positionInSeconds = positionInSeconds
		return this.ApiCall<any>('POST', '/mediaServer/api/mediaServerService/UpdateMediaPosition',jsonObject, { Silent: true } );
	}

}
    

export class DirectoryMediaSource extends MediaSource 
{
	Path?: string | null; 
	IncludeSubdirectories?: boolean; 
}
//Cannot Render MediaServer.Api.AddResponse
//Cannot Render MediaServer.Entities.SpecialPerentFolder
