import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
import { MovieDetailsComponent } from './Videos/movieDetails.component';

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
        MovieDetailsComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        InterlinkModule
    ],
    providers: [],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
