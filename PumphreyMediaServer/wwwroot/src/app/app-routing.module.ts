import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MediaServerAppComponent } from './mediaServerApp.component';
import { MediaServerSettingsComponent } from './mediaServerSettings.component';
import { MoviesViewComponent } from './Videos/moviesView.component';
import { SeriesViewComponent } from './seriesView.component';
import { MusicViewComponent } from './musicView.component';
import { MediaFileTypesSettingComponent } from './mediaFileTypesSetting.component';
import { VideoSettingComponent } from './Videos/Settings/videoSettings.component';
import { SourcesSettingsComponent } from './sourcesSettings.component';
import { AudioSettingComponent } from './audioSettings.component';
import { ImagesViewComponent } from './imagesView.component';
import { ImagesSettingComponent } from './imagesSettings.component';
import { UnassignedVideoListComponent } from './Videos/Settings/unassignedVideoList.component';
import { SeriesDetailsComponent } from './Videos/seriesDetails.component';
import { MovieDetailsComponent } from './Videos/movieDetails.component';
import { SearchComponent } from './search.component';
import { EpisodeDetailsComponent } from './Videos/episodeDetails.component';
import { FullMovieGroupingComponent } from './Videos/fullMovieGrouping.component';
import { RemoteWebScreenComponent } from './remoteWebScreen.component';

const routes: Routes = [
    {
        path: 'App', component: MediaServerAppComponent,
        children: [
            { path: '', redirectTo: 'Movies', pathMatch: 'full' },
            { path: 'Movies', component: MoviesViewComponent },
            { path: 'Movie/:id', component: MovieDetailsComponent },
            { path: 'Series', component: SeriesViewComponent },
            { path: 'Series/:id', component: SeriesDetailsComponent },
            { path: 'Episode/:id', component: EpisodeDetailsComponent },
            { path: 'Music', component: MusicViewComponent },
            { path: 'Pictures', component: ImagesViewComponent },
            { path: 'Search', component: SearchComponent },
            { path: 'FullGroupView', component: FullMovieGroupingComponent }
        ]
    },
    {
        path: 'Settings', component: MediaServerSettingsComponent,
        children: [
            { path: '', redirectTo: 'Sources', pathMatch: 'full' },
            { path: 'Sources', component: SourcesSettingsComponent },
            { path: 'FileTypes', component: MediaFileTypesSettingComponent },
            {
                path: 'Videos', component: VideoSettingComponent,
                children: [
                    { path: 'Unassigned', component: UnassignedVideoListComponent },
                ]
            },
            { path: 'Audio', component: AudioSettingComponent },
            { path: 'Images', component: ImagesSettingComponent },
        ]
    },
    { path: '', component: MediaServerAppComponent },
    { path: 'RemoteWebScreen', component: RemoteWebScreenComponent }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
