import { NgModule, CUSTOM_ELEMENTS_SCHEMA, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
import { InterlinkModule } from 'interLink';

import { AppComponent } from './app.component';
import { MediaServerAppComponent } from './mediaServerApp.component';
import { MainMenuComponent } from './mainMenu.component';
import { SubMenuComponent } from './subMenu.component';
import { IconComponent } from './Controls/icon.component';
import { MediaServerSettingsComponent } from './mediaServerSettings.component';
import { SeriesViewComponent } from './seriesView.component';
import { MusicViewComponent } from './musicView.component';
import { TagSettingComponent } from './tagSettings.component';
import { MediaFileTypesSettingComponent } from './mediaFileTypesSetting.component';
import { VideoSettingComponent } from './Videos/Settings/videoSettings.component';
import { MoviesViewComponent } from './Videos/moviesView.component';
import { RatingSettingComponent } from './ratingSetting.component';
import { AudioSettingComponent } from './audioSettings.component';
import { SourcesSettingsComponent } from './sourcesSettings.component';
import { ImagesViewComponent } from './imagesView.component';
import { DropTargetComponent } from './Controls/dropTarget.component';
import { SeriesVideoComponent } from './Videos/Settings/seriesVideo.component';
import { MovieVideoComponent } from './Videos/Settings/movieVideo.component';
import { UnassignedVideoComponent } from './Videos/Settings/unassignedVideo.component';
import { UnassignedVideoListComponent } from './Videos/Settings/unassignedVideoList.component';
import { MoviesListComponent } from './Videos/Settings/moviesList.component';
import { SeasonListComponent } from './Videos/Settings/seasonList.component';
import { SeriesListComponent } from './Videos/Settings/seriesList.component';
import { SeriesEditorComponent } from './Videos/Settings/seriesEditor.component';
import { SeasonEditorComponent } from './Videos/Settings/seasonEditor.component';
import { SeasonComponent } from './Videos/Settings/season.component';
import { EpisodeListComponent } from './Videos/Settings/episodeList.component';
import { EpisodeVideoComponent } from './Videos/Settings/episodeVideo.component';
import { MovieMetadataEditorComponent } from './Videos/Settings/movieMetadataEditor.component';
import { MovieMetadataSearchComponent } from './Videos/Settings/movieMetadataSearch.component';
import { ImageUploadComponent } from './Controls/imageUpload.component';
import { EpisodeMetadataEditorComponent } from './Videos/Settings/episodeMetadataEditor.component';
import { EpisodeMetadataSearchComponent } from './Videos/Settings/episodeMetadataSearch.component';
import { VideoPlayerComponent } from './Videos/videoPlayer.component';
import { SeriesPreviewComponent } from './Videos/seriesPreview.component';
import { SeriesDetailsComponent } from './Videos/seriesDetails.component';
import { MovieGroupingComponent } from './Videos/movieGrouping.component';
import { videoDetailsComponent } from './Videos/videoDetails.component';
import { SearchComponent } from './search.component';
import { EpisodeDetailsComponent } from './Videos/episodeDetails.component';
import { FullMovieGroupingComponent } from './Videos/fullMovieGrouping.component';
import { RemotePlayerComponent } from './Videos/remotePlayer.component';
import { RemoteWebScreenComponent } from './remoteWebScreen.component';
import { VideoGroupManagerComponent } from './Videos/Settings/videoGroupManager.component';
import { MediaItemAccessComponent } from './Videos/Settings/mediaItemAccess.component';
import { FolderVideoGroupComponent } from './Videos/Settings/VideoGroupEditors/folderVideoGroup.component';

import { DateRangeVideoGroupComponent } from './Videos/Settings/VideoGroupEditors/dateRangeVideoGroup.component';
import { RatingVideoGroupComponent } from './Videos/Settings/VideoGroupEditors/ratingVideoGroup.component';
import { GenreVideoGroupComponent } from './Videos/Settings/VideoGroupEditors/genreVideoGroup.component';
import { ActivityWidgetComponent } from './widgets/activityWidget.component';
import { ServiceWorkerModule } from '@angular/service-worker';

@NgModule({
    declarations: [
        AppComponent,
        IconComponent,
        MediaServerAppComponent,
        MainMenuComponent,
        SubMenuComponent,
        MediaServerSettingsComponent,
        MoviesViewComponent,
        SeriesViewComponent,
        MusicViewComponent,
        ImagesViewComponent,
        MediaFileTypesSettingComponent,
        TagSettingComponent,
        RatingSettingComponent,
        VideoSettingComponent,
        AudioSettingComponent,
        TagSettingComponent,
        SourcesSettingsComponent,
        DropTargetComponent,
        SeriesVideoComponent,
        MovieVideoComponent,
        UnassignedVideoListComponent,
        UnassignedVideoComponent,
        MoviesListComponent,
        SeriesListComponent,
        SeasonListComponent,
        SeriesEditorComponent,
        SeasonEditorComponent,
        SeasonComponent,
        EpisodeListComponent,
        EpisodeVideoComponent,
        MovieMetadataEditorComponent,
        MovieMetadataSearchComponent,
        EpisodeMetadataEditorComponent,
        EpisodeMetadataSearchComponent,
        ImageUploadComponent,
        VideoPlayerComponent,
        SeriesPreviewComponent,
        SeriesDetailsComponent,
        MovieGroupingComponent,
        videoDetailsComponent,
        SearchComponent,
        EpisodeDetailsComponent,
        FullMovieGroupingComponent,
        RemotePlayerComponent,
        RemoteWebScreenComponent,
        VideoGroupManagerComponent,
        FolderVideoGroupComponent,
        DateRangeVideoGroupComponent,
        RatingVideoGroupComponent,
        GenreVideoGroupComponent,
        ActivityWidgetComponent,
        MediaItemAccessComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        InterlinkModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
          enabled: !isDevMode(),
          // Register the ServiceWorker as soon as the application is stable
          // or after 30 seconds (whichever comes first).
          registrationStrategy: 'registerWhenStable:30000'
        })
    ],
    providers: [],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
